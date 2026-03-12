import { RawJob } from '@/types';
import axios from 'axios';

export async function scrapeAdzuna(): Promise<RawJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.error('Adzuna credentials missing');
    return [];
  }

  const url = `https://api.adzuna.com/v1/api/jobs/in/search/1`;

  const queries = [
    'nodejs backend developer junior',
    'full stack developer fresher',
    'frontend react developer junior',
  ];

  try {
    const requests = queries.map(what =>
      axios.get(url, {
        params: {
          app_id: appId,
          app_key: appKey,
          where: 'India',
          what,
          results_per_page: 5,
          max_days_old: 1,
        },
      })
    );

    const results = await Promise.allSettled(requests);

    const allJobs: any[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allJobs.push(...(result.value.data.results || []));
      }
    }

    // Deduplicate by job id
    const seen = new Set();
    const unique = allJobs.filter(job => {
      if (seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    });

    return unique.slice(0, 15).map((job: any) => ({
      externalId: `adzuna-${job.id}`,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      url: job.redirect_url,
      applyUrl: job.redirect_url,
      description: job.description,
      requirements: '',
      skills: [],
      source: 'adzuna',
      postedAt: job.created,
    }));
  } catch (err) {
    console.error('Adzuna API error', err);
    return [];
  }
}