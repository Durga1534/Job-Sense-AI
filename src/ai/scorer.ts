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
  
  // Further truncate to save tokens
  const truncatedJob = {
    title: job.title,
    company: job.company,
    skills: job.skills?.slice(0, 5).join(', ') || '',
    salary: `${job.salaryMin || 'Not specified'} - ${job.salaryMax || 'Not specified'}`,
    location: job.location,
    remote: job.remote,
    description: job.description?.slice(0, 300) + (job.description?.length > 300 ? '...' : ''),
  };

  const prompt = `Score job for FRESHER (0 years):

Skills: Node.js, TypeScript, React, PostgreSQL
Target: 6-15 LPA, Bangalore/Remote

Job: ${JSON.stringify(truncatedJob)}

Rules:
- 3+ years = SKIP
- 2 years = WEAK  
- 0-1 years = score normally
- Remote/Bangalore = boost
- Related skills count

Return JSON:
{"score": 0-100, "matchLevel": "STRONG|GOOD|WEAK|SKIP", "matchingSkills": [], "missingSkills": [], "experienceGap": "", "whyApply": "", "salaryFit": ""}`;

  const result = await callAI(prompt, 400); // Further reduced from 800
  return jobScoreSchema.parse(result);
}