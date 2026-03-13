import axios from 'axios';
import { RawJob } from '../types';
import { deduplicateJob } from './utils';

export async function scrapeWellfound(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  
  try {
    // Wellfound (formerly AngelList) for startup jobs
    const response = await axios.get('https://api.wellfound.com/jobs', {
      params: {
        limit: 50,
        remote: true,
        experience: '0-1',
        skills: 'nodejs,typescript,react,javascript',
        locations: 'Bangalore,Remote',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    for (const job of response.data.jobs || []) {
      const processedJob: RawJob = {
        externalId: `wellfound-${job.id}`,
        title: job.title,
        company: job.startup.name,
        description: job.description,
        requirements: job.skills || '',
        skills: job.skill_tags || [],
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        location: job.location,
        remote: job.remote || false,
        source: 'wellfound',
        applyUrl: job.apply_url,
        postedAt: job.created_at,
      };

      if (await deduplicateJob(processedJob)) {
        jobs.push(processedJob);
      }
    }
  } catch (error) {
    console.error('Wellfound scraping error:', error);
  }

  return jobs;
}
