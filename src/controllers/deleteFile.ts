import { Request, Response } from "express";
import {
  cacheData,
  generateUniqueCacheKey,
  getCachedData,
  invalidateCache,
} from "../utils/redisClient";

import FileMetadata from "../model/fileMetaData";
import logger from "../logger/logger";
import minioClient from "../minio/minioClient";
import mongoose from "mongoose";

const fileDeleter = async (req: Request, res: Response): Promise<any> => {
  const { fileName } = req.query;

  if (!fileName) {
    logger.error("File name is required.");
    return res.status(400).send({
      message: "File name is required.",
    });
  }

  const session = await FileMetadata.startSession();
  session.startTransaction();

  try {
    const fileMetadata = await FileMetadata.findOne({ fileName }).session(
      session
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
      await minioClient.statObject(
        bucketName,
        `${fileMetadata.fileName}.${fileMetadata.fileExtension}`
      );

      await minioClient.removeObject(
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

    await FileMetadata.deleteOne({ fileName });

    const uniqueCashKey = "files:cache:";

    const cachedData = await getCachedData(uniqueCashKey);

    if (cachedData) {
      const filteredCache = cachedData.filter(
        (item: any) => item.fileName !== fileName
      );
      console.log(filteredCache, "filtered data from delete controller");

      await cacheData(uniqueCashKey, filteredCache);
      logger.info("Cache updated after file deletion.");
    } else {
      logger.warn("No cache found for all files, nothing to invalidate.");
    }

    const query: Record<string, string | undefined> = {
      filename: fileName as string,
    };

    //deleting cache if its present on FILENAME based
    const fileNameBasedCacheKey = generateUniqueCacheKey(query);

    const fileNameBasedCacheData = await getCachedData(fileNameBasedCacheKey);

    if (fileNameBasedCacheData) {
      await invalidateCache(fileNameBasedCacheKey);
      console.log(
        "file name based cahche has been cleared with key ",
        fileName
      );
    } else {
      console.log("no cache found for file name based cache");
    }

    await session.commitTransaction();
    //fileMetadata.save({ session });

    logger.info(
      "File deleted successfully from both MinIO and database, cache invalidated."
    );
    return res.status(200).send({
      message: "File deleted successfully from both MinIO and database.",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error("Failed to delete the file.");
    return res.status(500).send({
      message: "Failed to delete the file.",
      error: error,
    });
  } finally {
    session.endSession();
  }
};

export default fileDeleter;
