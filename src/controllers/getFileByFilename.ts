import { Request, Response } from "express";

import { IMongoDBClient } from "../utils/interfaces/IMongoDBClient";
import { IRedisClient } from "../utils/interfaces/IRedisClient";
import { MongoDBClient } from "../utils/mongooseUtils";
import { RedisClient } from "../utils/redisClient";
import logger from "../logger/logger";

const redisClient: IRedisClient = new RedisClient();
const mongoDBClient: IMongoDBClient = new MongoDBClient();

const getFileByFilename = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { filename } = req.params;

  if (!filename) {
    res.status(400).send({ message: "Filename is required." });
    return;
  }

  const uniqueCacheKey = redisClient.generateUniqueCacheKey({ filename });

  const cachedFileMetadata = await redisClient.getCachedData(uniqueCacheKey);
  if (cachedFileMetadata) {
    logger.info(`Cache hit for file: ${filename}`);
    res.status(200).json({ fileMetadata: cachedFileMetadata });
    return;
  }

  try {
    const fileMetadata = await mongoDBClient.getFileMetadataFromDB(filename);

    if (fileMetadata) {
      await redisClient.cacheData(uniqueCacheKey, fileMetadata);
      logger.info(`Cache set for file: ${filename}`);
      res.status(200).json({ fileMetadata });
      return;
    } else {
      res.status(404).send({
        message: `File ${filename} not found in the database.`,
      });
      return;
    }
  } catch (error) {
    logger.error(`Error fetching file: ${filename}`, error);
    res.status(500).send({ message: "Error retrieving file metadata", error });
  }
};

export default getFileByFilename;
