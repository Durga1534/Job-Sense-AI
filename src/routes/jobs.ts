import { Router } from 'express';
import prisma from '../db/client';
import { JobMatcherService } from '../services/jobMatcher';
import { JobMatchCriteria } from '../types/matching';
import { usageTracker } from '../ai/usageTracker';

const router = Router();
const jobMatcher = new JobMatcherService();

router.get('/', async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const jobs = await prisma.job.findMany({
    where: { scrapedAt: { gte: start } },
    orderBy: { matchScore: 'desc' },
  });
  res.json(jobs);
});

router.get('/:id', async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json(job);
});

// AI Usage monitoring endpoint
router.get('/usage/stats', async (req, res) => {
  try {
    const stats = await usageTracker.getUsageStats();
    const isNearLimit = usageTracker.isNearLimit(stats);
    
    res.json({
      stats,
      isNearLimit,
      limits: {
        dailyTokens: 14000,
        maxRequestsPerDay: 20,
      },
      recommendations: isNearLimit ? [
        'Consider using Gemini API for additional scoring',
        'Reduce job scoring to top 10 matches only',
        'Use simpler scoring prompts to save tokens'
      ] : []
    });
  } catch (error) {
    res.status(500).json({ error: 'Usage stats failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Advanced matching endpoints
router.get('/match/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const matches = await jobMatcher.getPersonalizedMatches(userId, limit);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Matching failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/match/:userId/:jobId', async (req, res) => {
  try {
    const { userId, jobId } = req.params;
    const match = await jobMatcher.matchSpecificJob(userId, jobId);
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Matching failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/skills/gap/:userId/:jobId', async (req, res) => {
  try {
    const { userId, jobId } = req.params;
    const skillGap = await jobMatcher.getSkillGapAnalysis(userId, jobId);
    res.json(skillGap);
  } catch (error) {
    res.status(500).json({ error: 'Skill gap analysis failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const insights = await jobMatcher.getMatchingInsights(userId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'Insights failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.put('/criteria/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const criteria: Partial<JobMatchCriteria> = req.body;
    await jobMatcher.saveUserCriteria(userId, criteria);
    res.json({ message: 'Criteria updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Criteria update failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/criteria/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const criteria = await jobMatcher.getUserCriteria(userId);
    res.json(criteria);
  } catch (error) {
    res.status(500).json({ error: 'Criteria retrieval failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
