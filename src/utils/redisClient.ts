import { IRedisClient } from "./interfaces/IRedisClient";
import Redis from "ioredis";

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  db: 0,
});

export class RedisClient implements IRedisClient {
  async setCache(
    key: string,
    value: any,
    expirationInSeconds?: number
  ): Promise<void> {
    await redisClient.set(key, JSON.stringify(value));
    if (expirationInSeconds) {
      await redisClient.expire(key, expirationInSeconds);
    }
  }

  async getCache(key: string): Promise<any | null> {
    const cachedValue = await redisClient.get(key);
    return cachedValue ? JSON.parse(cachedValue) : null;
  }

  async deleteCache(key: string): Promise<void> {
    await redisClient.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await redisClient.keys(pattern);
  }

  async clearCache(): Promise<void> {
    const keys = await redisClient.keys("files:cache:*");
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  }
}

export const redisClientInstance = new RedisClient();
