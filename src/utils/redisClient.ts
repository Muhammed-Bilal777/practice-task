import { IRedisClient } from "./interfaces/IRedisClient";
import Redis from "ioredis";

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  db: 0,
});

export class RedisClient implements IRedisClient {
  generateUniqueCacheKey(
    queryParams: Record<string, string | undefined>
  ): string {
    const keys = Object.keys(queryParams)
      .filter((key) => queryParams[key])
      .sort();
    const queryString = keys
      .map((key) => `${key}:${queryParams[key]}`)
      .join("|");
    return `files:cache:${queryString}`;
  }

  // Cache data in Redis
  async cacheData(key: string, data: any): Promise<void> {
    try {
      await redisClient.set(key, JSON.stringify(data), "EX", 3600); // Cache expires in 1 hour
      console.log(`Cache set for key: ${key}`);
    } catch (err) {
      console.error(`Error setting cache for key: ${key}`, err);
    }
  }

  // Get cached data from Redis
  async getCachedData(key: string): Promise<any | null> {
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (err) {
      console.error(`Error fetching cache for key: ${key}`, err);
      return null;
    }
  }

  // Reset cache (either update or invalidate based on input)
  async resetCache(key?: string, data?: any): Promise<void> {
    try {
      if (key && data) {
        const cachedData = await redisClient.get("files:cache:");
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);

          // Filter out the item to be updated or replaced
          const filteredCache = parsedData.filter(
            (item: any) => item.fileName !== key
          );
          filteredCache.push(data);

          // Set the updated cache
          await redisClient.set(
            "files:cache:",
            JSON.stringify(filteredCache),
            "EX",
            3600
          );
          console.log("Cache updated after file upload");
        } else {
          // If no cache, set it with the new data
          await redisClient.set(
            "files:cache:",
            JSON.stringify([data]),
            "EX",
            3600
          );
          console.log("Cache set with new data for all files");
        }
      } else {
        // Invalidate cache for all files
        await redisClient.del("files:cache:");
        console.log("Cache invalidated for all files");
      }
    } catch (err) {
      console.error("Error resetting cache:", err);
    }
  }

  // Invalidate cache for a specific key
  async invalidateCache(key: string): Promise<void> {
    try {
      await redisClient.del(key);
      console.log(`Cache invalidated for key: ${key}`);
    } catch (err) {
      console.error(`Error invalidating cache for key: ${key}`, err);
    }
  }
}
