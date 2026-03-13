import { RawJob } from '@/types';
import axios from 'axios';

export async function scrapeArbeitnow(): Promise<RawJob[]> {
  const url = 'https://www.arbeitnow.com/api/job-board-api';
  try {
    const [res1, res2, res3] = await Promise.allSettled([
      axios.get(url, { params: { search: 'nodejs backend typescript' } }),
      axios.get(url, { params: { search: 'full stack developer react' } }),
      axios.get(url, { params: { search: 'frontend react next.js' } }),
    ]);

    const allJobs: any[] = [];
    for (const result of [res1, res2, res3]) {
      if (result.status === 'fulfilled') {
        allJobs.push(...(result.value.data.data || []));
      }
    }

    // Deduplicate by slug
    const seen = new Set();
    const unique = allJobs.filter(job => {
      if (seen.has(job.slug)) return false;
      seen.add(job.slug);
      return true;
    });

    // Slice to 20
    return unique
      .slice(0, 20)
      .map((job: any) => ({
        externalId: `arbeitnow-${job.slug}`,
        title: job.title,
        company: job.company_name,
        location: job.location || 'Remote',
        url: job.url,
        applyUrl: job.url,
        description: job.description,
        requirements: '',
        skills: job.tags || [],
        source: 'arbeitnow',
        postedAt: new Date(job.created_at * 1000).toISOString(),
      }));
  } catch (err) {
    console.error('Arbeitnow API error', err);
    return [];
  }
}