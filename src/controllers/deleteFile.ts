import { Request, Response } from "express";
import { mongoClientInstance } from "../utils/mongooseUtils";
import { redisClientInstance } from "../utils/redisClient";
import { minioClientInstance } from "../utils/minioUtils";
import logger from "../logger/logger";

const generateCacheKey = (query: Record<string, any>): string => {
  const sortedKeys = Object.keys(query).sort();
  const keyParts = sortedKeys.map((key) => `${key}=${query[key]}`);

  if (query["fileName"]) {
    keyParts.push(`fileName=${query["fileName"]}`);
  }

  return `files:cache:query:${keyParts.join("&")}`;
};

const fileDeleter = async (req: Request, res: Response): Promise<void> => {
  const { fileName } = req.query;
  const bucketName = process.env.MINIO_BUCKET_NAME as string;

  if (!fileName) {
    res.status(400).send({ message: "File name is required." });
    return;
  }

  const fileExists = await mongoClientInstance.getFileMetadataFromDB(
    fileName as string
  );
  if (!fileExists) {
    res.status(404).send({ message: "File not found." });
    return;
  }

  try {
    await mongoClientInstance.deleteFileMetadataInDB(fileName as string);
    await minioClientInstance.removeFileFromMinio(
      bucketName,
      fileName as string
    );

    const cacheKeyForFile = generateCacheKey({ fileName: fileName as string });
    await redisClientInstance.deleteCache(cacheKeyForFile);

    const allKeys = await redisClientInstance.keys("files:cache:query:*");
    for (const key of allKeys) {
      const cachedData = await redisClientInstance.getCache(key);
      if (
        cachedData &&
        cachedData.some((file: any) => file.fileName === fileName)
      ) {
        const updatedCache = cachedData.filter(
          (file: any) => file.fileName !== fileName
        );
        await redisClientInstance.setCache(key, updatedCache);
      }
    }

    const allFilesCache = await redisClientInstance.getCache("files:cache:all");
    if (allFilesCache) {
      const updatedCache = allFilesCache.filter(
        (file: any) => file.fileName !== fileName
      );
      await redisClientInstance.setCache("files:cache:all", updatedCache);
    }
    logger.info("File deleted successfully.");
    res.status(200).send({ message: "File deleted successfully." });
  } catch (error) {
    console.error("Failed to delete the file:", error);
    res.status(500).send({ message: "Failed to delete the file." });
  }
};

export default fileDeleter;
