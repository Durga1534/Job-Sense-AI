import { RawJob } from '@/types';
import { scrapeAdzuna } from './adzuna';
import { scrapeRemotive } from './remotive';
import { scrapeArbeitnow } from './arbeitnow';

export async function runAllScrapers(): Promise<RawJob[]> {
  const results: RawJob[] = [];
  const settled = await Promise.allSettled([
    scrapeAdzuna(),
    scrapeRemotive(),
    scrapeArbeitnow(),
  ]);
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const source = ['adzuna', 'naukri', 'remotive', 'arbeitnow'][i];
      console.log(`scraper ${source} succeeded, got ${r.value.length}`);
      results.push(...r.value);
    } else {
      console.error(`scraper ${i} failed`, r.reason);
    }
  });
  const seen = new Set<string>();
  return results.filter((j) => {
    if (seen.has(j.externalId)) return false;
    seen.add(j.externalId);
    return true;
  });
}
