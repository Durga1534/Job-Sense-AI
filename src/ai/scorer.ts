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
  
  // Use heuristic scoring directly to avoid AI issues
  console.log('Using heuristic scoring (AI-free) for job:', job.title);
  
  const location = job.location?.toLowerCase() || '';
  const skills = job.skills || [];
  const title = job.title?.toLowerCase() || '';
  
  let score = 50;
  let matchLevel: 'STRONG' | 'GOOD' | 'WEAK' | 'SKIP' = 'GOOD';
  
  // Location scoring
  if (location.includes('bangalore') || job.remote) {
    score += 15;
  } else if (location.includes('remote')) {
    score += 10;
  } else {
    score -= 10;
  }
  
  // Skills matching
  const matchingSkills = skills.filter(skill => 
    ['nodejs', 'react', 'typescript', 'postgresql', 'mongodb', 'express'].includes(skill.toLowerCase())
  );
  score += matchingSkills.length * 8;
  
  // Experience level detection
  if (title.includes('senior') || title.includes('lead') || title.includes('architect')) {
    matchLevel = 'SKIP';
    score = 20;
  } else if (title.includes('junior') || title.includes('fresher') || title.includes('entry')) {
    matchLevel = 'STRONG';
    score += 10;
  }
  
  // Cap the score
  score = Math.min(100, Math.max(0, score));
  
  // More lenient match levels for fresher jobs
  if (score >= 60) matchLevel = 'STRONG';  
  else if (score >= 40) matchLevel = 'GOOD';   
  else if (score >= 25) matchLevel = 'WEAK';   
  else matchLevel = 'SKIP';
  
  console.log(`Job: ${job.title} - Score: ${score} - Level: ${matchLevel}`);
  
  return {
    score,
    matchLevel,
    matchingSkills,
    missingSkills: [],
    experienceGap: matchLevel === 'SKIP' ? 'May require more experience' : 'Potential fit',
    whyApply: matchLevel === 'SKIP' ? 'Not suitable for fresher' : 'Good opportunity',
    salaryFit: 'Not specified',
  };
}