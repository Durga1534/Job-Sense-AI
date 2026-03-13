import axios from 'axios';
import { RawJob } from '../types';
import { deduplicateJob } from './utils';

export async function scrapeHirect(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  
  try {
    // Hirect API for Indian startup jobs
    const response = await axios.get('https://hirect.in/api/jobs', {
      params: {
        limit: 50,
        remote: true,
        experience: '0-1',
        skills: 'nodejs,typescript,react,javascript',
        city: 'Bangalore',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    for (const job of response.data.data || []) {
      const processedJob: RawJob = {
        externalId: `hirect-${job.id}`,
        title: job.job_title,
        company: job.company_name,
        description: job.job_description,
        requirements: job.skills_required || '',
        skills: job.skills ? job.skills.split(',').map((s: string) => s.trim()) : [],
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        location: job.location,
        remote: job.work_from_home || false,
        source: 'hirect',
        applyUrl: job.apply_link,
        postedAt: job.created_at,
      };

      if (await deduplicateJob(processedJob)) {
        jobs.push(processedJob);
      }
    }
  } catch (error) {
    console.error('Hirect scraping error:', error);
  }

  return jobs;
}
