import { RawJob, JobScore } from '@/types';
import { callAI } from './client';
import { MY_RESUME } from './resume';
import { isFresherJob, extractExperienceLevel } from '../utils/jobFilter';
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
  // Pre-filter for fresher jobs to save tokens
  const isFresherFriendly = isFresherJob(job.title, job.description, job.requirements);
  const experienceLevel = extractExperienceLevel(job.title, job.description, job.requirements);
  
  // Auto-skip experienced jobs without AI call
  if (experienceLevel === '3+') {
    return {
      score: 20,
      matchLevel: 'SKIP',
      matchingSkills: [],
      missingSkills: [],
      experienceGap: 'Requires 3+ years experience',
      whyApply: 'Job requires too much experience',
      salaryFit: 'Not applicable',
    };
  }
  
  // Auto-weak 2-year jobs
  if (experienceLevel === '2') {
    return {
      score: 40,
      matchLevel: 'WEAK', 
      matchingSkills: [],
      missingSkills: [],
      experienceGap: 'Requires 2 years experience',
      whyApply: 'Experience requirement may be challenging',
      salaryFit: 'Not applicable',
    };
  }
  
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
Fresher Friendly: ${isFresherFriendly}

RULES:
- This is a FRESHER (0 years) candidate
- Only award STRONG for 0-1 years experience jobs
- 2 years exp = WEAK (max 45) - NEVER STRONG
- Salary <6L or >20L = "Out of range"
- Remote/Bangalore = boost score
- Related skills count (Node.js→Backend, React→Frontend)
- For STRONG: must be fresher-friendly AND 3+ skills match AND salary in range

Return JSON:
${JSON.stringify(jobScoreSchema.shape, null, 2)}`;

  const result = await callAI(prompt, 800); // Reduced from 1500 tokens
  return jobScoreSchema.parse(result);
}