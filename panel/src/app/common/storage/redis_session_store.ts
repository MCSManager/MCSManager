import session from 'koa-session';
import Redis from 'ioredis';

interface RedisStoreOptions {
  url?: string;
  prefix?: string;
}

interface SessionData {
  [key: string]: any;
}

export default class RedisStore implements session.stores {
  private redis: Redis;
  private prefix: string;

  constructor(options: RedisStoreOptions = {}) {
    this.redis = new Redis(String(options.url), {
      connectTimeout: 5000,
      maxRetriesPerRequest: 3
    });
    this.prefix = options.prefix || 'koa:sess:';
  }

  async get(key: string): Promise<SessionData | null> {
    try {
      const data = await this.redis.get(`${this.prefix}${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(
    key: string,
    sess: SessionData,
    maxAge?: number
  ): Promise<void> {
    try {
      const redisKey = `${this.prefix}${key}`;
      const ms = maxAge || 86400000; // 默认24小时

      await this.redis.set(
        redisKey,
        JSON.stringify(sess),
        'PX',
        ms
      );
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async destroy(key: string): Promise<void> {
    try {
      await this.redis.del(`${this.prefix}${key}`);
    } catch (error) {
      console.error('Redis destroy error:', error);
    }
  }
}
