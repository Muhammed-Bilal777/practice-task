import { Request, Response } from "express";
import redisClient, {
  generateCacheKey,
  invalidateAllCaches,
} from "../utils/redisClient";

import FileMetadata from "../model/fileMetaData";
import logger from "../logger/logger";
import minioClient from "../minio/minioClient";

const fileDeleter = async (req: Request, res: Response): Promise<any> => {
  const { fileName } = req.query;

  if (!fileName) {
    logger.error("File name is required.");
    res.status(400).send({
      message: "File name is required.",
    });
    return;
  }

  let session = await FileMetadata.startSession();
  session.startTransaction();

  try {
    const fileMetadata = await FileMetadata.findOne({ fileName }).session(
      session
    );

    if (!fileMetadata) {
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
    } catch (err) {
      logger.error("File not found in MinIO.");
      return res.status(404).send({
        message: "File not found in MinIO.",
      });
    }

    // Remove the file from MinIO
    await minioClient.removeObject(
      bucketName,
      `${fileMetadata.fileName}.${fileMetadata.fileExtension}`
    );

    await fileMetadata.deleteOne({ session });

    const cacheKey = generateCacheKey({ fileName: fileMetadata.fileName });
    console.log(cacheKey, "deleted controller");
    await redisClient.del(cacheKey);
    await invalidateAllCaches();

    await session.commitTransaction();

    logger.info(
      "File deleted successfully from both MinIO and database, cache invalidated."
    );
    res.status(200).send({
      message: "File deleted successfully from both MinIO and database.",
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Failed to delete the file.");
    res.status(500).send({
      message: "Failed to delete the file.",
      error: error,
    });
  } finally {
    session.endSession();
  }
};

export default fileDeleter;
