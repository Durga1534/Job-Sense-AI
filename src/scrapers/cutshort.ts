import axios from 'axios';
import { RawJob } from '../types';
import { deduplicateJob } from './utils';

export async function scrapeCutshort(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  
  try {
    // Cutshort API for Indian startups
    const response = await axios.get('https://api.cutshort.io/jobs', {
      params: {
        limit: 50,
        remote: true,
        experience: '0-1', // Fresher friendly
        skills: 'nodejs,typescript,react,javascript',
        location: 'Bangalore,Remote',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    for (const job of response.data.jobs || []) {
      const processedJob: RawJob = {
        externalId: `cutshort-${job.id}`,
        title: job.title,
        company: job.company.name,
        description: job.description,
        requirements: job.requirements || '',
        skills: job.skills || [],
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        location: job.location,
        remote: job.remote || false,
        source: 'cutshort',
        applyUrl: job.apply_url,
        postedAt: job.posted_at,
      };

      if (await deduplicateJob(processedJob)) {
        jobs.push(processedJob);
      }
    }
  } catch (error) {
    console.error('Cutshort scraping error:', error);
  }

  return jobs;
}
