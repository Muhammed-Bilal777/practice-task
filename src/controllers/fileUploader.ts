import { Request, Response } from "express";

import { IMongoDBClient } from "../utils/interfaces/IMongoDBClient";
import { IRedisClient } from "../utils/interfaces/IRedisClient";
import { MongoDBClient } from "../utils/mongooseUtils";
import { RedisClient } from "../utils/redisClient";
import { minioClientInstance } from "../utils/minioUtils";
import mongoose from "mongoose";

const mongoDBClient: IMongoDBClient = new MongoDBClient();
const redisClient: IRedisClient = new RedisClient();

const fileUploader = async (req: any, res: Response): Promise<void> => {
  const file = req.file;

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
      res.status(409).send({
        message: "File already exists in the bucket.",
      });
      return;
    }

    await minioClientInstance.uploadFileToMinio(
      bucketName,
      originalname,
      fileBuffer
    );

    await mongoDBClient.saveFileMetadata(
      session,
      filename,
      extension,
      fileSize
    );

    const uniqueCacheKey = redisClient.generateUniqueCacheKey({
      fileName: filename,
      fileExtension: extension,
    });
    await redisClient.resetCache(uniqueCacheKey, {
      fileName: filename,
      fileExtension: extension,
      fileSize,
    });

    await session.commitTransaction();
    res.status(201).send({
      message: "File uploaded successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Failed to upload file:", error);
    res.status(500).send({
      message: "Failed to upload the file or save the data.",
      error,
    });
  } finally {
    session.endSession();
  }
};

export default fileUploader;
