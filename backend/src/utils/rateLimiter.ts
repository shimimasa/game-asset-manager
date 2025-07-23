import { RateLimiterMemory } from 'rate-limiter-flexible';
import { AppError } from './errors';

interface RateLimiterConfig {
  points: number; // Number of requests
  duration: number; // Per duration in seconds
  blockDuration?: number; // Block duration in seconds
}

class RateLimitManager {
  private limiters: Map<string, RateLimiterMemory> = new Map();

  createLimiter(key: string, config: RateLimiterConfig): RateLimiterMemory {
    const limiter = new RateLimiterMemory({
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration || 60,
    });

    this.limiters.set(key, limiter);
    return limiter;
  }

  async checkLimit(key: string, identifier: string): Promise<void> {
    const limiter = this.limiters.get(key);
    if (!limiter) {
      throw new Error(`Rate limiter ${key} not found`);
    }

    try {
      await limiter.consume(identifier);
    } catch (rateLimiterRes) {
      const retryAfter = Math.round((rateLimiterRes as any).msBeforeNext / 1000) || 60;
      throw new AppError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds`,
        429,
        true,
        { retryAfter }
      );
    }
  }

  async getRemainingPoints(key: string, identifier: string): Promise<number> {
    const limiter = this.limiters.get(key);
    if (!limiter) {
      throw new Error(`Rate limiter ${key} not found`);
    }

    const res = await limiter.get(identifier);
    return res ? limiter.points - res.consumedPoints : limiter.points;
  }
}

export const rateLimitManager = new RateLimitManager();

// Initialize rate limiters for AI services
rateLimitManager.createLimiter('openai-images', {
  points: 50,
  duration: 60, // 50 images per minute
  blockDuration: 300, // 5 minutes block
});

rateLimitManager.createLimiter('openai-tokens', {
  points: 150000,
  duration: 60, // 150k tokens per minute
  blockDuration: 300,
});

rateLimitManager.createLimiter('suno-requests', {
  points: 10,
  duration: 60, // 10 requests per minute
  blockDuration: 600, // 10 minutes block
});