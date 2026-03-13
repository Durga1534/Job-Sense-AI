import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '', {
  family: 0,
});

redis.on('error', (err) => {
  console.error('Redis error', err);
});

interface UsageStats {
  dailyTokens: number;
  dailyRequests: number;
  lastReset: string;
  monthlyTokens: number;
  monthlyRequests: number;
}

const GROQ_FREE_LIMITS = {
  DAILY_TOKENS: 14000, // ~14K tokens per day
  MONTHLY_TOKENS: 14000, // ~14K tokens per month for free tier
  MAX_REQUESTS_PER_DAY: 20, // Conservative limit
};

export class UsageTracker {
  private static instance: UsageTracker;
  private redis = redis;

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  async trackUsage(tokensUsed: number): Promise<{ allowed: boolean; remaining: number; stats: UsageStats }> {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const dailyKey = `groq:usage:${today}`;
    const monthlyKey = `groq:usage:${currentMonth}`;

    // Get current usage
    const dailyTokens = parseInt((await this.redis.get(`${dailyKey}:tokens`) || '0'));
    const dailyRequests = parseInt((await this.redis.get(`${dailyKey}:requests`) || '0'));
    const monthlyTokens = parseInt((await this.redis.get(`${monthlyKey}:tokens`) || '0'));
    const monthlyRequests = parseInt((await this.redis.get(`${monthlyKey}:requests`) || '0'));

    // Check limits
    const wouldExceedDaily = dailyTokens + tokensUsed > GROQ_FREE_LIMITS.DAILY_TOKENS;
    const wouldExceedMonthly = monthlyTokens + tokensUsed > GROQ_FREE_LIMITS.MONTHLY_TOKENS;
    const wouldExceedRequests = dailyRequests >= GROQ_FREE_LIMITS.MAX_REQUESTS_PER_DAY;

    const allowed = !wouldExceedDaily && !wouldExceedMonthly && !wouldExceedRequests;

    if (allowed) {
      // Update usage
      await this.redis.incrby(`${dailyKey}:tokens`, tokensUsed);
      await this.redis.incr(`${dailyKey}:requests`);
      await this.redis.incrby(`${monthlyKey}:tokens`, tokensUsed);
      await this.redis.incr(`${monthlyKey}:requests`);
      
      // Set expiry for daily keys (24 hours)
      await this.redis.expire(`${dailyKey}:tokens`, 86400);
      await this.redis.expire(`${dailyKey}:requests`, 86400);
      
      // Set expiry for monthly keys (30 days)
      await this.redis.expire(`${monthlyKey}:tokens`, 2592000);
      await this.redis.expire(`${monthlyKey}:requests`, 2592000);
    }

    const stats: UsageStats = {
      dailyTokens,
      dailyRequests,
      lastReset: today,
      monthlyTokens,
      monthlyRequests,
    };

    const remainingDaily = Math.max(0, GROQ_FREE_LIMITS.DAILY_TOKENS - dailyTokens);
    const remainingMonthly = Math.max(0, GROQ_FREE_LIMITS.MONTHLY_TOKENS - monthlyTokens);

    return {
      allowed,
      remaining: Math.min(remainingDaily, remainingMonthly),
      stats,
    };
  }

  async getUsageStats(): Promise<UsageStats> {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const dailyKey = `groq:usage:${today}`;
    const monthlyKey = `groq:usage:${currentMonth}`;

    return {
      dailyTokens: parseInt((await this.redis.get(`${dailyKey}:tokens`) || '0')),
      dailyRequests: parseInt((await this.redis.get(`${dailyKey}:requests`) || '0')),
      lastReset: today,
      monthlyTokens: parseInt((await this.redis.get(`${monthlyKey}:tokens`) || '0')),
      monthlyRequests: parseInt((await this.redis.get(`${monthlyKey}:requests`) || '0')),
    };
  }

  async resetDailyUsage(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `groq:usage:${today}`;
    await this.redis.del(`${dailyKey}:tokens`);
    await this.redis.del(`${dailyKey}:requests`);
  }

  isNearLimit(stats: UsageStats): boolean {
    const dailyUsagePercent = (stats.dailyTokens / GROQ_FREE_LIMITS.DAILY_TOKENS) * 100;
    return dailyUsagePercent > 80; // Alert at 80% usage
  }
}

export const usageTracker = UsageTracker.getInstance();
