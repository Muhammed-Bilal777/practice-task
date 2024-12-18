import { Request, Response } from "express";

import { MongoDBClient } from "../utils/mongooseUtils";
import { RedisClient } from "../utils/redisClient";
import logger from "../logger/logger";
import { minioClientInstance } from "../utils/minioUtils";

const redisClient = new RedisClient();
const mongoDBClient = new MongoDBClient();

const fileUpdater = async (req: Request, res: Response): Promise<any> => {
  if (!req.file) {
    logger.error("No file to update");
    return res.status(400).send({ message: "No file to update" });
  }

  const { originalname, buffer, size } = req.file;
  const [filename, ...extensionParts] = originalname.split(".");
  const extension = extensionParts.join(".");
  const fileSize = size / 1024; // KB
  const bucketName = process.env.MINIO_BUCKET_NAME as string;

  const uniqueCacheKey = redisClient.generateUniqueCacheKey({ filename });

  try {
    const fileMetadata = await mongoDBClient.getFileMetadataFromDB(filename);
    if (!fileMetadata) {
      logger.error(`File metadata not found for: ${filename}`);
      return res
        .status(404)
        .send({ message: `File ${filename} not found in the database.` });
    }

    await minioClientInstance.uploadFileToMinio(
      bucketName,
      originalname,
      buffer
    );

    await mongoDBClient.updateFileMetadataInDB(filename, extension, fileSize);

    await redisClient.resetCache(uniqueCacheKey, {
      fileName: filename,
      fileExtension: extension,
      fileSize,
    });

    logger.info("File updated successfully");

    return res.status(200).send({
      message: "File updated successfully",
      data: { filename, fileSize, fileExtension: extension },
    });
  } catch (error) {
    logger.error("Failed to update the file", error);
    return res.status(500).send({
      message: "Failed to update the file",
      error: error,
    });
  }
};

export default fileUpdater;
