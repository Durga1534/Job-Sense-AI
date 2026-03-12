import { RawJob } from '@/types';
import axios from 'axios';

export async function scrapeRemotive(): Promise<RawJob[]> {
  const url = 'https://remotive.com/api/remote-jobs';
  try {
    const [res1, res2, res3] = await Promise.allSettled([
      axios.get(url, { params: { category: 'software-dev', search: 'backend nodejs', limit: 7 } }),
      axios.get(url, { params: { category: 'software-dev', search: 'full stack', limit: 7 } }),
      axios.get(url, { params: { category: 'software-dev', search: 'frontend react', limit: 6 } }),
    ]);

    const allJobs: any[] = [];
    for (const result of [res1, res2, res3]) {
      if (result.status === 'fulfilled') {
        allJobs.push(...(result.value.data.jobs || []));
      }
    }

    // Deduplicate by id
    const seen = new Set();
    const unique = allJobs.filter(job => {
      if (seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    });

    return unique.slice(0, 20).map((job: any) => ({
      externalId: `remotive-${job.id}`,
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || 'Remote',
      url: job.url,
      applyUrl: job.url,
      description: job.description,
      requirements: '',
      skills: job.tags || [],
      source: 'remotive',
      postedAt: job.publication_date,
    }));
  } catch (err) {
    console.error('Remotive API error', err);
    return [];
  }
}