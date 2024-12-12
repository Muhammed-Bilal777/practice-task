import Redis from "ioredis";

const redisClient = new Redis({
  host: "redis",
  port: 6379,
  db: 0,
});

export const generateCacheKey = (
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

export const invalidateCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
    console.log(`Cache invalidated for key: ${key}`);
  } catch (err) {
    console.error(`Error invalidating cache for key: ${key}`, err);
  }
};

export const invalidateAllCaches = async (): Promise<void> => {
  try {
    const keys = await redisClient.keys("files:cache:*");
    if (keys.length > 0) {
      await redisClient.del(...keys);
      console.log("All file-related caches invalidated.");
    }
  } catch (err) {
    console.error("Error invalidating all caches", err);
  }
};

export const storeFileMetadataInRedis = async (
  fileId: string,
  metadata: any
): Promise<void> => {
  try {
    await redisClient.set(
      `file:${fileId}`,
      JSON.stringify(metadata),
      "EX",
      3600
    );
    console.log(`File metadata cached for fileId: ${fileId}`);
  } catch (err) {
    console.error(`Error storing file metadata for fileId: ${fileId}`, err);
  }
};

export const getFileMetadataFromRedis = async (
  fileId: string
): Promise<any | null> => {
  try {
    const metadata = await redisClient.get(`file:${fileId}`);
    if (metadata) {
      return JSON.parse(metadata);
    }
    return null;
  } catch (err) {
    console.error(
      `Error fetching file metadata for fileId: ${fileId} from Redis`,
      err
    );
    return null;
  }
};

export default redisClient;
