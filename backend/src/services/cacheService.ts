import Redis from 'ioredis';

export class CacheService {
  private redis: Redis | null = null;
  private ttl: number = 3600; // 1 hour default TTL

  constructor() {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
      
      this.redis.on('error', (err) => {
        console.error('Redis connection error:', err);
      });

      this.redis.on('connect', () => {
        console.log('Connected to Redis');
      });
    }
  }

  private isEnabled(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled()) return null;

    try {
      const data = await this.redis!.get(key);
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      const serialized = JSON.stringify(value);
      await this.redis!.setex(key, ttl || this.ttl, serialized);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string | string[]): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length > 0) {
        await this.redis!.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      const keys = await this.redis!.keys(pattern);
      if (keys.length > 0) {
        await this.redis!.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.deletePattern(`user:${userId}:*`);
  }

  async invalidateAssetCache(userId: string, assetId?: string): Promise<void> {
    if (assetId) {
      await this.delete([
        `asset:${assetId}`,
        `user:${userId}:assets`,
        `user:${userId}:assets:*`,
      ]);
    } else {
      await this.deletePattern(`user:${userId}:assets*`);
    }
  }

  async invalidatePromptCache(userId: string, promptId?: string): Promise<void> {
    if (promptId) {
      await this.delete([
        `prompt:${promptId}`,
        `user:${userId}:prompts`,
        `user:${userId}:prompts:*`,
      ]);
    } else {
      await this.deletePattern(`user:${userId}:prompts*`);
    }
  }

  async invalidateProjectCache(userId: string, projectId?: string): Promise<void> {
    if (projectId) {
      await this.delete([
        `project:${projectId}`,
        `project:${projectId}:assets`,
        `user:${userId}:projects`,
        `user:${userId}:projects:*`,
      ]);
    } else {
      await this.deletePattern(`user:${userId}:projects*`);
    }
  }

  generateKey(namespace: string, ...parts: string[]): string {
    return [namespace, ...parts].join(':');
  }

  // Cache decorators
  async withCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const data = await fetchFn();
    await this.set(key, data, ttl);
    
    return data;
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();