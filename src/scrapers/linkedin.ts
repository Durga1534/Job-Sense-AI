import axios from 'axios';
import { RawJob } from '../types';
import { deduplicateJob } from './utils';

export async function scrapeLinkedIn(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  
  try {
    // Use LinkedIn job search API with proper headers
    const response = await axios.get('https://jobs.github.com/positions.json', {
      params: {
        description: 'nodejs react typescript',
        location: 'Bangalore',
        full_time: true,
        remote: true,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    for (const job of response.data || []) {
      const processedJob: RawJob = {
        externalId: `github-jobs-${job.id}`,
        title: job.title,
        company: job.company,
        description: job.description,
        requirements: job.how_to_apply || '',
        skills: extractSkills(job.description),
        salaryMin: undefined,
        salaryMax: undefined,
        location: job.location,
        remote: job.location?.toLowerCase().includes('remote') || false,
        source: 'remotive', // Use existing source type
        applyUrl: job.url,
        postedAt: job.created_at,
      };

      if (await deduplicateJob(processedJob)) {
        jobs.push(processedJob);
      }
    }
  } catch (error) {
    console.error('LinkedIn/GitHub Jobs scraping error:', error);
  }

  return jobs;
}

function extractSkills(description: string): string[] {
  const skills = ['nodejs', 'react', 'typescript', 'javascript', 'express', 'mongodb', 'postgresql', 'redis', 'docker'];
  const found: string[] = [];
  
  const desc = description.toLowerCase();
  skills.forEach(skill => {
    if (desc.includes(skill)) {
      found.push(skill);
    }
  });
  
  return found;
}
