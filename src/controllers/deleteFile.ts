import { Request, Response } from "express";

import { MongoDBClient } from "../utils/mongooseUtils";
import { RedisClient } from "../utils/redisClient";
import logger from "../logger/logger";
import { minioClientInstance } from "../utils/minioUtils";
import mongoose from "mongoose";

const redisClient = new RedisClient();
const mongoDBClient = new MongoDBClient();

const fileDeleter = async (req: Request, res: Response): Promise<any> => {
  const { fileName } = req.query;

  if (!fileName) {
    logger.error("File name is required.");
    return res.status(400).send({
      message: "File name is required.",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fileMetadata = await mongoDBClient.getFileMetadataFromDB(
      fileName as string
    );
    if (!fileMetadata) {
      await session.abortTransaction();
      session.endSession();
      logger.error("File not found in the database.");
      return res.status(404).send({
        message: "File not found in the database.",
      });
    }

    const bucketName = process.env.MINIO_BUCKET_NAME as string;

    try {
      await minioClientInstance.removeFileFromMinio(
        bucketName,
        `${fileMetadata.fileName}.${fileMetadata.fileExtension}`
      );
      logger.info(`File ${fileMetadata.fileName} removed from MinIO.`);
    } catch (err: any) {
      logger.error(
        `MinIO error while removing file ${fileMetadata.fileName}:`,
        err
      );
      await session.abortTransaction();
      session.endSession();
      return res.status(500).send({
        message: `Failed to delete file from MinIO: ${err.message}`,
      });
    }

    await mongoDBClient.deleteFileMetadataInDB(fileName as string);

    const uniqueCacheKey = "files:cache:";

    const cachedData = await redisClient.getCachedData(uniqueCacheKey);
    if (cachedData) {
      const filteredCache = cachedData.filter(
        (item: any) => item.fileName !== fileName
      );
      await redisClient.cacheData(uniqueCacheKey, filteredCache);
      logger.info("Cache updated after file deletion.");
    } else {
      logger.warn("No cache found for all files, nothing to invalidate.");
    }

    const fileNameBasedCacheKey = redisClient.generateUniqueCacheKey({
      filename: fileName as string,
    });
    const fileNameBasedCacheData = await redisClient.getCachedData(
      fileNameBasedCacheKey
    );

    if (fileNameBasedCacheData) {
      await redisClient.invalidateCache(fileNameBasedCacheKey);
      logger.info(`File name based cache cleared for: ${fileName}`);
    } else {
      logger.info("No cache found for file name based cache.");
    }

    await session.commitTransaction();
    session.endSession();

    logger.info(
      "File deleted successfully from both MinIO and database, cache invalidated."
    );
    return res.status(200).send({
      message: "File deleted successfully from both MinIO and database.",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error("Failed to delete the file.", error);
    return res.status(500).send({
      message: "Failed to delete the file.",
      error: error,
    });
  }
};

export default fileDeleter;
