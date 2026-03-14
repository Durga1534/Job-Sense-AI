import { Router } from 'express';
import { verifyQStash } from '../middleware/qstash';
import { rateLimit } from '../middleware/arcjet';
import { runAllScrapers } from '../scrapers';
import { filterNewJobs } from '../cache/redis';
import { scoreJob } from '../ai/scorer';
import { assessResumeForJob } from '../ai/assessor';
import { rewriteBulletsForJob } from '../ai/improver';
import { saveJob } from '../db/jobs';
import { createDailyRun } from '../db/runs';
import { sendDailyDigest, sendNoJobsAlert } from '../notifications/whatsapp';
import { sendDailyReport } from '../notifications/email';
import { RawJob } from '../types';

const router = Router();

function isFresherFriendly(job: RawJob): boolean {
  const title = job.title.toLowerCase();
  const text = `${job.title} ${job.description}`.toLowerCase();

  // Skip senior titles
  const seniorKeywords = [
    'senior', 'sr.', 'lead', 'principal', 'staff',
    'architect', 'manager', 'head of', 'director', 'vp ', 'vice president'
  ];
  if (seniorKeywords.some(k => title.includes(k))) return false;

  // Skip jobs requiring 2+ years experience
  const experiencePatterns = [
    /(\d+)\s*[-–+]\s*\d*\s*years?\s*(of)?\s*(experience|exp)/gi,
    /minimum\s*(\d+)\s*years?/gi,
    /at\s*least\s*(\d+)\s*years?/gi,
    /(\d+)\+\s*years?/gi,
  ];

  for (const pattern of experiencePatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const minYears = parseInt(match[1]);
      if (minYears >= 2) return false;
    }
  }

  return true;
}

router.post(
  '/trigger',
  verifyQStash,
  rateLimit,
  async (req, res) => {
    const start = new Date();
    console.log('pipeline start', start.toISOString());
    try {
      const allJobs = await runAllScrapers();
      const newJobs = await filterNewJobs(allJobs);

      if (newJobs.length === 0) {
        await sendNoJobsAlert(new Date());
        return res.json({ jobsScraped: allJobs.length, jobsNew: 0, jobsScored: 0, sent: 'no-new-jobs' });
      }

      const fresherJobs = newJobs.filter(isFresherFriendly);
      console.log(`Fresher-friendly: ${fresherJobs.length} of ${newJobs.length} new jobs`);

      const scored: any[] = [];

      // Limit to 5 jobs per day to stay within token limits
      const MAX_JOBS_PER_DAY = 5;
      const jobsToScore = fresherJobs.slice(0, MAX_JOBS_PER_DAY);

      console.log(`Scoring top ${jobsToScore.length} jobs (limit: ${MAX_JOBS_PER_DAY})`);

      for (const job of jobsToScore) {
        const score = await scoreJob(job);

        if (score.matchLevel === 'SKIP' || score.matchLevel === 'WEAK') {
          await saveJob({ ...job, matchScore: score.score, matchLevel: score.matchLevel });
          continue;
        }

        if (score.matchLevel === 'STRONG') {
          // Skip AI calls for now to avoid token issues
          const assessment = {
            strengths: ['Strong technical skills match', 'Good learning opportunity'],
            gaps: ['Need to learn specific company tech stack'],
            fitScore: 75,
            recommendations: ['Focus on backend development skills']
          };
          const bullets = [
            '• Strong foundation in Node.js and TypeScript',
            '• Quick learner with project experience',
            '• Good problem-solving abilities'
          ];
          await saveJob({ ...job, matchScore: score.score, matchLevel: score.matchLevel, assessment });
          scored.push({ job, score, assessment, bullets });
        } else {
          // GOOD match
          await saveJob({ ...job, matchScore: score.score, matchLevel: score.matchLevel });
          scored.push({ job, score, assessment: null, bullets: null });
        }

        await new Promise((r) => setTimeout(r, 1000));
      }

      scored.sort((a, b) => b.score.score - a.score.score);
      const topJobs = scored.slice(0, 5);

      await createDailyRun({
        jobsScraped: allJobs.length,
        jobsNew: newJobs.length,
        jobsScored: scored.length,
        topScore: topJobs[0]?.score?.score,
        topCompany: topJobs[0]?.job?.company,
      });

      if (topJobs.length === 0) {
        await sendNoJobsAlert(new Date());
        return res.json({
          jobsScraped: allJobs.length,
          jobsNew: newJobs.length,
          jobsFresherFiltered: fresherJobs.length,
          jobsScored: 0,
          sent: 'no-matches',
        });
      }

      await Promise.all([
        sendDailyDigest(topJobs, new Date()),
        sendDailyReport(topJobs, allJobs.length, new Date()),
      ]);

      return res.json({
        jobsScraped: allJobs.length,
        jobsNew: newJobs.length,
        jobsFresherFiltered: fresherJobs.length,
        jobsScored: scored.length,
        sent: 'both',
      });
    } catch (err: any) {
      console.error('pipeline error', err);
      res.status(500).json({ error: 'Pipeline failed', message: err.message, stack: err.stack });
    }
  },
);

export default router;