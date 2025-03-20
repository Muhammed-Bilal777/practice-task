import { Request, Response } from "express";
import { minioClientInstance } from "../utils/minioUtils";
import { mongoClientInstance } from "../utils/mongooseUtils";
import mongoose from "mongoose";
import { redisClientInstance } from "../utils/redisClient";
import logger from "../logger/logger";

const fileUploader = async (req: any, res: Response): Promise<void> => {
  const file = req.file;
  console.log;
  if (!file) {
    res.status(400).send({
      message: "File not found",
    });
    return;
  }

  const { originalname, buffer, size } = file;

  const [filename, ...extensionParts] = originalname.split(".");
  const extension = extensionParts.join(".");
  const fileBuffer = buffer;
  const fileSize = size / 1024; // KB

  const bucketName = process.env.MINIO_BUCKET_NAME as string;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fileExists = await minioClientInstance.checkFileExists(
      bucketName,
      originalname
    );

    if (fileExists) {
      logger.error("File Already Exists in the Bucket");
      res.status(409).send({
        message: "File already exists in the bucket.",
      });
      return;
    }

    // Upload the file to MinIO
    await minioClientInstance.uploadFileToMinio(
      bucketName,
      originalname,
      fileBuffer
    );

    // Save file metadata in MongoDB
    const fileMetaData = await mongoClientInstance.saveFileMetadata(
      session,
      originalname,
      extension,
      fileSize
    );

    // Cache the file metadata in Redis
    await redisClientInstance.setCache(
      fileMetaData.fileName,
      fileMetaData,
      3600
    ); // Cache for 1 hour

    // Update the cache for all files
    const allFilesCache =
      (await redisClientInstance.getCache("files:cache:all")) || [];
    allFilesCache.push(fileMetaData); // Add the new file metadata to the cache
    await redisClientInstance.setCache("files:cache:all", allFilesCache); // Update the cache

    await session.commitTransaction();
    logger.info("File Uploaded successfully");
    res.status(201).send({
      message: "File uploaded successfully",
      fileMetaData,
    });
  } catch (error: unknown) {
    await session.abortTransaction();
    console.error("Failed to upload file:", error);
    logger.error("failed to upload the file");
    res.status(500).send({
      message: "Failed to upload the file or save the data.",
      error,
    });
  } finally {
    session.endSession();
  }
};

export default fileUploader;
