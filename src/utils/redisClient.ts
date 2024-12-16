import Redis from "ioredis";

const redisClient = new Redis({
  host: "redis",
  port: 6379,
  db: 0,
});

export const generateUniqueCacheKey = (
  queryParams: Record<string, string | undefined>
) => {
  const keys = Object.keys(queryParams)
    .filter((key) => queryParams[key])
    .sort();
  const queryString = keys.map((key) => `${key}:${queryParams[key]}`).join("|");
  return `files:cache:${queryString}`;
};

export const cacheData = async (key: string, data: any): Promise<void> => {
  try {
    await redisClient.set(key, JSON.stringify(data), "EX", 3600);
    console.log(`Cache set for key: ${key}`);
  } catch (err) {
    console.error(`Error setting cache for key: ${key}`, err);
  }
};

export const getCachedData = async (key: string): Promise<any | null> => {
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
};

export const resetCache = async (key?: string, data?: any): Promise<void> => {
  try {
    if (key && data) {
      const cachedData = await redisClient.get("files:cache:");
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);

        const filteredCache = parsedData.filter(
          (item: any) => item.fileName !== key
        );

        filteredCache.push(data);

        await redisClient.set(
          "files:cache:",
          JSON.stringify(filteredCache),
          "EX",
          3600
        );
        console.log("Cache updated after file upload");
      } else {
        await redisClient.set(
          "files:cache:",
          JSON.stringify([data]),
          "EX",
          3600
        );
        console.log("Cache set with new data for all files");
      }
    } else {
      await redisClient.del("files:cache:");
      console.log("Cache invalidated for all files");
    }
  } catch (err) {
    console.error("Error resetting cache:", err);
  }
};

export const invalidateCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
    console.log(`Cache invalidated for key: ${key}`);
  } catch (err) {
    console.error(`Error invalidating cache for key: ${key}`, err);
  }
};
