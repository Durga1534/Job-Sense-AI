import { ResumeHealth } from '@/types';
import { callAI } from './client';
import { z } from 'zod';

const resumeHealthSchema = z.object({
  overallScore: z.number().min(0).max(100),
  breakdown: z.object({
    projectQuality: z.number(),
    skillsRelevance: z.number(),
    metricsAndNumbers: z.number(),
    atsOptimization: z.number(),
    productionEvidence: z.number(),
  }),
  topThreeActionsThisWeek: z.array(z.string()),
  strongestAsset: z.string(),
  biggestGap: z.string(),
  estimatedDaysToInterviewReady: z.number(),
});

export async function getResumeHealthScore(): Promise<ResumeHealth> {
  const prompt = `You are evaluating a software engineer resume for Indian product startup roles. Score the resume 0-100 and break down by projectQuality, skillsRelevance, metricsAndNumbers, atsOptimization, productionEvidence. Provide top three concrete actions to improve this week, strongest asset, biggest gap, and estimate days to interview readiness. Respond with JSON matching this schema: ${resumeHealthSchema}`;
  const result = await callAI(prompt, 2000);
  return resumeHealthSchema.parse(result);
}
