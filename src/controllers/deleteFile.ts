import { Request, Response } from "express";

import FileMetadata from "../model/fileMetaData";
import { deleteCache } from "../utils/redisClient";
import logger from "../logger/logger";
import minioClient from "../minio/minioClient";
import mongoose from "mongoose";

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
    const fileMetadata = await FileMetadata.findOne({ fileName });

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

    await minioClient.removeObject(
      bucketName,
      `${fileMetadata.fileName}.${fileMetadata.fileExtension}`
    );
    await fileMetadata.deleteOne({ session });

    await session.commitTransaction();
    deleteCache(fileName as string);
    logger.info("File deleted successfully from both MinIO and database.");
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
