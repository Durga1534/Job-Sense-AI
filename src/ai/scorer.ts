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
  const prompt = `You are a senior technical recruiter evaluating this job posting against the candidate resume below.

CANDIDATE RESUME:
${JSON.stringify(MY_RESUME, null, 2)}

JOB POSTING:
${JSON.stringify(job, null, 2)}

SCORING RULES — follow strictly:
- If job requires 3+ years experience: matchLevel SKIP, score max 25
- If job requires 2 years experience: matchLevel WEAK, score max 45
- If job requires 0-1 years OR is fresher/junior/entry-level friendly: score based on skills
- Candidate target salary is 6-15 LPA. If job salary is clearly below 6 LPA or above 20 LPA: set salaryFit to "Out of range"
- If salary is not mentioned: set salaryFit to "Not specified"
- A fresher with strong projects scores max 75
- Set STRONG only if: job is junior/fresher friendly AND 4+ skills match AND salary is in range or not specified
- Set GOOD if: experience is 0-2 years AND 3+ skills match
- Set WEAK if: experience gap exists OR fewer than 3 skills match
- Set SKIP if: 3+ years required OR completely wrong tech stack

Respond with ONLY a JSON object. No notes, no explanation, no text before or after the JSON:
${JSON.stringify(jobScoreSchema.shape, null, 2)}`;

  const result = await callAI(prompt, 1500);
  return jobScoreSchema.parse(result);
}