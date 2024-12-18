import { Request, Response } from "express";

import { IMongoDBClient } from "../utils/interfaces/IMongoDBClient";
import { IRedisClient } from "../utils/interfaces/IRedisClient";
import { MongoDBClient } from "../utils/mongooseUtils";
import { RedisClient } from "../utils/redisClient";
import { buildSearchCriteria } from "../utils/seachCreteria";

const mongoDBClient: IMongoDBClient = new MongoDBClient();
const redisClient: IRedisClient = new RedisClient();

const findFiles = async (req: Request, res: Response): Promise<void> => {
  const queryStr: any = req.query;
  const cacheKey = redisClient.generateUniqueCacheKey(queryStr);

  const cachedData = await redisClient.getCachedData(cacheKey);
  if (cachedData) {
    res.status(200).json({
      itemsFound: cachedData.length,
      items: cachedData,
    });
    return;
  }

  if (Object.keys(req.query).length === 0) {
    const allFilesCache = await redisClient.getCachedData("files:cache:");
    if (allFilesCache) {
      res.status(200).json({
        itemsFound: allFilesCache.length,
        items: allFilesCache,
      });
      return;
    }

    const results = await mongoDBClient.findAllFilesInDB();
    if (results) {
      await redisClient.cacheData(cacheKey, results);
      res.status(200).json({
        itemsFound: results.length,
        items: results,
      });
      return;
    }
  }

  try {
    const searchCriteria = buildSearchCriteria(queryStr);

    const results = await mongoDBClient.findFilesInDB(searchCriteria);

    if (results && results.length > 0) {
      await redisClient.cacheData(cacheKey, results);
      res.status(200).json({
        itemsFound: results.length,
        items: results,
      });
      return;
    } else {
      res.status(404).json({
        message: "No files found matching the query",
      });
      return;
    }
  } catch (error) {
    console.error("Error retrieving files:", error);
    res.status(500).json({
      message: "Error retrieving files",
    });
    return;
  }
};

export default findFiles;
