import { RawJob, JobScore, JobAssessment } from '@/types';
import { callAI } from './client';
import { MY_RESUME } from './resume';
import { z } from 'zod';

const jobAssessmentSchema = z.object({
  overallVerdict: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  bulletImprovements: z.array(
    z.object({
      project: z.string(),
      current: z.string(),
      improved: z.string(),
      why: z.string(),
    }),
  ),
  keywordsToAdd: z.array(z.string()),
  projectToHighlight: z.string(),
  projectReason: z.string(),
  coverLetterHook: z.string(),
  scoreIfFixed: z.number(),
});

export async function assessResumeForJob(
  job: RawJob,
  score: JobScore,
): Promise<JobAssessment> {
  const prompt = `You are an engineering hiring manager reviewing 
a candidate for the following job posting. Give a brutally honest 
assessment including which project to highlight and a personalized 
cover letter hook.

  Candidate Resume:
  ${JSON.stringify(MY_RESUME, null, 2)}

  Job Posting:
  ${JSON.stringify(job, null, 2)}

  Score:
  ${JSON.stringify(score, null, 2)}

  Respond with JSON matching this schema:
   ${JSON.stringify(jobAssessmentSchema.shape, null, 2)}`;

  const result = await callAI(prompt, 2000);
  return jobAssessmentSchema.parse(result);
}
