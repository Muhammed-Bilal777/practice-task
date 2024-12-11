import Redis from "ioredis";
import logger from "../logger/logger";

const redis = new Redis({
  host: "redis",
  port: 6379,
  db: 0,
});
redis.on("connect", () => {
  console.log("Connected to Redis");
  logger.info("Connected to Redis");
});

redis.on("error", (err) => {
  console.error("Error connecting to Redis:", err);
  logger.error("Error connecting to Redis:");
});

const storeCache = async (
  key: string,
  value: string | Buffer,
  ttl: number = 3600
) => {
  try {
    await redis.setex(key, ttl, value);
    console.log(`Cache set for key: ${key}`);
    logger.info("cache set");
  } catch (err) {
    console.error(`Error storing cache for key: ${key}`, err);
    logger.info("Error storing cache");
  }
};

const getCache = async (key: string): Promise<string | null> => {
  try {
    const value = await redis.get(key);
    logger.info("fetched stored cache");
    return value;
  } catch (err) {
    console.error(`Error getting cache for key: ${key}`, err);
    logger.error("Error getting cache");
    return null;
  }
};

const deleteCache = async (key: string) => {
  try {
    await redis.del(key);
    console.log(`Cache deleted for key: ${key}`);
    logger.info("deleted cache");
  } catch (err) {
    console.error(`Error deleting cache for key: ${key}`, err);
    logger.error("error while deleting cache");
  }
};

export { storeCache, getCache, deleteCache };
