import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '', {
  family: 0,
});

redis.on('error', (err) => {
  console.error('Redis error', err);
});

export async function isNewJob(jobId: string): Promise<boolean> {
  try {
    const exists = await redis.exists(`job:seen:${jobId}`);
    return exists === 0;
  } catch (err) {
    console.error('Redis isNewJob error', err);
    // fail open
    return true;
  }
}

export async function markJobSeen(jobId: string): Promise<void> {
  try {
    await redis.set(`job:seen:${jobId}`, '1', 'EX', 604800);
  } catch (err) {
    console.error('Redis markJobSeen error', err);
  }
}

export async function filterNewJobs(jobs: any[]): Promise<any[]> {
  const results = await Promise.all(
    jobs.map(async (j) => {
      const newJob = await isNewJob(j.externalId);
      if (newJob) {
        await markJobSeen(j.externalId);
        return j;
      }
      return null;
    }),
  );
  return results.filter((j) => j !== null) as any[];
}

export async function disconnect(): Promise<void> {
  try {
    await redis.quit();
  } catch (err) {
    console.error('Redis disconnect error', err);
  }
}
