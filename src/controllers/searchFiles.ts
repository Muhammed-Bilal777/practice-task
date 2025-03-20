import { Request, Response } from "express";
import { buildSearchCriteria } from "../utils/seachCreteria";
import { mongoClientInstance } from "../utils/mongooseUtils";
import { redisClientInstance } from "../utils/redisClient";

const generateCacheKey = (query: Record<string, any>): string => {
  const sortedKeys = Object.keys(query).sort();
  const keyParts = sortedKeys.map((key) => `${key}=${query[key]}`);

  if (query["fileName"]) {
    keyParts.push(`fileName=${query["fileName"]}`);
  }

  return `files:cache:query:${keyParts.join("&")}`;
};

const findFiles = async (req: Request, res: Response): Promise<void> => {
  const queryStr: Record<string, any> = req.query;

  // If no query parameters, return all files from cache or database
  if (Object.keys(queryStr).length === 0) {
    const allFilesCache = await redisClientInstance.getCache("files:cache:all");

    if (allFilesCache !== null) {
      res.status(200).json({
        itemsFound: allFilesCache.length,
        items: allFilesCache,
      });
      return;
    }

    const results = await mongoClientInstance.findAllFilesInDB();
    if (results) {
      await redisClientInstance.setCache("files:cache:all", results);
      res.status(200).json({
        itemsFound: results.length,
        items: results,
      });
      return;
    }
  }

  const cacheKey = generateCacheKey(queryStr);

  try {
    const cachedData = await redisClientInstance.getCache(cacheKey);
    if (cachedData) {
      res.status(200).json({
        itemsFound: cachedData.length,
        items: cachedData,
      });
      return;
    }

    const searchCriteria = buildSearchCriteria(queryStr);
    const results = await mongoClientInstance.findFilesInDB(searchCriteria);

    if (results && results.length > 0) {
      await redisClientInstance.setCache(cacheKey, results);
      res.status(200).json({
        itemsFound: results.length,
        items: results,
      });
    } else {
      await redisClientInstance.deleteCache(cacheKey);
      res.status(404).json({
        message: "No files found matching the query",
      });
    }
  } catch (error) {
    console.error("Error retrieving files:", error);
    res.status(500).json({
      message: "Error retrieving files",
    });
  }
};

export default findFiles;
