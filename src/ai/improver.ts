import { RawJob, JobAssessment, BulletRewrite } from '@/types';
import { callAI } from './client';
import { MY_RESUME } from './resume';
import { z } from 'zod';

const bulletRewriteSchema = z.object({
  projectName: z.string(),
  rewrittenBullets: z.array(z.string()),
  keywordsAdded: z.array(z.string()),
});

export async function rewriteBulletsForJob(
  job: RawJob,
  assessment: JobAssessment,
): Promise<BulletRewrite> {
  const prompt = `You are rewriting resume project bullets to be 
more specific, metric-driven, and keyword-optimized for this job.
Keep everything honest — only use skills already in the resume.

Candidate Resume:
${JSON.stringify(MY_RESUME, null, 2)}

Job Posting:
${JSON.stringify(job, null, 2)}

Assessment:
${JSON.stringify(assessment, null, 2)}

Respond with JSON matching this schema: 
${JSON.stringify(bulletRewriteSchema.shape, null, 2)}`;

  const result = await callAI(prompt, 1500);
  return bulletRewriteSchema.parse(result);
}
