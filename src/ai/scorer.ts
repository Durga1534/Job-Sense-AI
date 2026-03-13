import { RawJob, JobScore } from '@/types';
import { callAI } from './client';
import { MY_RESUME } from './resume';
import { z } from 'zod';

const jobScoreSchema = z.object({
  score: z.number().min(0).max(100),
  matchLevel: z.enum(['STRONG', 'GOOD', 'WEAK', 'SKIP']),
  matchingSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  experienceGap: z.string(),
  whyApply: z.string(),
  salaryFit: z.string(),
});

export async function scoreJob(job: RawJob): Promise<JobScore> {
  // Truncate job description to save tokens
  const truncatedJob = {
    ...job,
    description: job.description?.slice(0, 500) + (job.description?.length > 500 ? '...' : ''),
    requirements: job.requirements?.slice(0, 200) + (job.requirements?.length > 200 ? '...' : ''),
  };

  const prompt = `Score this job for a FRESHER candidate (0 years exp, strong projects):

CANDIDATE:
- Skills: Node.js, TypeScript, Express, React, PostgreSQL, MongoDB, Redis, Docker
- Target: 6-15 LPA, Bangalore/Remote
- Projects: Rate Limiter API, Subscription Tracker, Voice AI Platform

JOB:
Title: ${truncatedJob.title}
Company: ${truncatedJob.company}
Skills: ${truncatedJob.skills?.join(', ')}
Salary: ${truncatedJob.salaryMin || 'Not specified'} - ${truncatedJob.salaryMax || 'Not specified'}
Location: ${truncatedJob.location}
Remote: ${truncatedJob.remote}
Description: ${truncatedJob.description}

RULES:
- 3+ years exp = SKIP (max 25)
- 2 years exp = WEAK (max 45)  
- 0-1 years/fresher = score normally
- Salary <6L or >20L = "Out of range"
- Remote/Bangalore = boost score
- Related skills count (Node.js→Backend, React→Frontend)

Return JSON:
${JSON.stringify(jobScoreSchema.shape, null, 2)}`;

  const result = await callAI(prompt, 800); // Reduced from 1500 tokens
  return jobScoreSchema.parse(result);
}