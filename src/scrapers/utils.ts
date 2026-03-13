import axios from 'axios';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '', {
  family: 0,
});

redis.on('error', (err) => {
  console.error('Redis error', err);
});

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/115.0.1901.188 Safari/537.36',
];

export function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function randomDelay(min = 1000, max = 3000): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createAxiosInstance() {
  return axios.create({
    timeout: 15000,
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': randomUserAgent(),
    },
  });
}

export async function deduplicateJob(job: { title: string; company: string; externalId?: string }): Promise<boolean> {
  const key = `job:${job.company}:${job.title}`;
  const exists = await redis.exists(key);
  
  if (!exists) {
    await redis.setex(key, 86400, '1'); // 24 hours TTL
    return true;
  }
  
  return false;
}
