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

IMPORTANT: Return ONLY a JSON object. No explanations, no text before/after.

JSON format:
{"score": number, "matchLevel": "STRONG|GOOD|WEAK|SKIP", "matchingSkills": [], "missingSkills": [], "experienceGap": "", "whyApply": "", "salaryFit": ""}`;

  const result = await callAI(prompt, 400); // Further reduced from 800
  
  try {
    return jobScoreSchema.parse(result);
  } catch (parseError) {
    console.error('Schema validation failed, using fallback:', parseError);
    
    // Fallback scoring based on simple heuristics
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
    
    if (score >= 70) matchLevel = 'STRONG';
    else if (score >= 50) matchLevel = 'GOOD';
    else if (score >= 30) matchLevel = 'WEAK';
    else matchLevel = 'SKIP';
    
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
}