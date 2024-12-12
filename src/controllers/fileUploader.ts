import { Request, Response } from "express";
import redisClient, {
  generateCacheKey,
  invalidateAllCaches,
  storeFileMetadataInRedis,
} from "../utils/redisClient";

import FileMetadata from "../model/fileMetaData";
import minioClient from "../minio/minioClient";
import mongoose from "mongoose";

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
    // Check if the file already exists in MinIO
    try {
      await minioClient.statObject(bucketName, originalname);
      res.status(409).send({
        message: "File already exists in the bucket.",
      });
      return;
    } catch (err) {
      console.log(err);
    }

    // Upload the file to MinIO
    await minioClient.putObject(bucketName, originalname, fileBuffer);

    // Save file metadata in MongoDB
    const fileDetails = new FileMetadata({
      fileName: filename,
      fileExtension: extension,
      fileSize,
    });

    await fileDetails.save({ session });
    await session.commitTransaction();
    // Store the metadata in Redis
    await storeFileMetadataInRedis(fileDetails._id.toString(), fileDetails);

    // Invalidate the cache related to file uploads (based on file name)
    const cacheKey = generateCacheKey({ fileName: filename });
    console.log(cacheKey, "Uploader controller");
    await redisClient.del(cacheKey);

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
