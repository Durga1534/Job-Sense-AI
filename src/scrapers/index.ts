import { RawJob } from '@/types';
import { scrapeAdzuna } from './adzuna';
import { scrapeRemotive } from './remotive';
import { scrapeArbeitnow } from './arbeitnow';
import { scrapeCutshort } from './cutshort';
import { scrapeHirect } from './hirect';
import { scrapeWellfound } from './wellfound';

export async function runAllScrapers(): Promise<RawJob[]> {
  const results: RawJob[] = [];
  const settled = await Promise.allSettled([
    scrapeAdzuna(),
    scrapeRemotive(),
    scrapeArbeitnow(),
    scrapeCutshort(),
    scrapeHirect(),
    scrapeWellfound(),
  ]);
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const source = ['adzuna', 'remotive', 'arbeitnow', 'cutshort', 'hirect', 'wellfound'][i];
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
