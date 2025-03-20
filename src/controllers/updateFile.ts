import { Request, Response } from "express";
import logger from "../logger/logger";
import { minioClientInstance } from "../utils/minioUtils";
import { mongoClientInstance } from "../utils/mongooseUtils";
import { redisClientInstance } from "../utils/redisClient";

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

  try {
    // Check if the file metadata exists in the database
    const fileMetadata = await mongoClientInstance.getFileMetadataFromDB(
      originalname
    );
    if (!fileMetadata) {
      logger.error(`File metadata not found for: ${filename}`);
      return res
        .status(404)
        .send({ message: `File ${filename} not found in the database.` });
    }

    // Upload the updated file to MinIO
    await minioClientInstance.uploadFileToMinio(
      bucketName,
      originalname,
      buffer
    );

    // Update the file metadata in MongoDB
    const updatedData = await mongoClientInstance.updateFileMetadataInDB(
      originalname,
      extension,
      fileSize
    );

    // Update the cache for the specific file
    await redisClientInstance.setCache(updatedData.fileName, updatedData, 3600); // Cache for 1 hour

    // Update the cache for all files
    const allFilesCache =
      (await redisClientInstance.getCache("files:cache:all")) || [];

    // Find the index of the file to update
    const fileIndex = allFilesCache.findIndex(
      (file: any) => file.fileName === originalname
    );

    if (fileIndex !== -1) {
      // Update the specific file in the cache
      allFilesCache[fileIndex] = updatedData; // Replace with updated data
      await redisClientInstance.setCache("files:cache:all", allFilesCache); // Update the cache
    }

    logger.info("File updated successfully");
    return res.status(200).send({
      message: "File updated successfully",
      updatedData,
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
