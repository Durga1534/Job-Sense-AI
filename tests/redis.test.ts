import { isNewJob, markJobSeen, filterNewJobs } from '../src/cache/redis';

describe('redis cache', () => {
  const id = 'test-job';

  afterEach(async () => {
    // no direct way to delete, just reuse markJobSeen resets TTL
  });

  it('isNewJob returns true for unseen job', async () => {
    const r = await isNewJob(id + '-a');
    expect(r).toBe(true);
  });

  it('isNewJob returns false after marking seen', async () => {
    await markJobSeen(id + '-b');
    const r = await isNewJob(id + '-b');
    expect(r).toBe(false);
  });

  it('filterNewJobs dedupes', async () => {
    const jobs = [
      { externalId: 'x' },
      { externalId: 'x' },
      { externalId: 'y' },
    ];
    const filtered = await filterNewJobs(jobs as any);
    expect(filtered.map((j) => j.externalId).sort()).toEqual(['x', 'y']);
  });
});
