import { Request, Response } from "express";

import FileMetadata from "../model/fileMetaData";
import logger from "../logger/logger";
import minioClient from "../minio/minioClient";
import mongoose from "mongoose";
import { storeCache } from "../utils/redisClient";

const fileUpdater = async (req: Request, res: Response): Promise<any> => {
  if (!req.file) {
    logger.error("No file to update");
    return res.status(400).send({ message: "No file to update" });
  }

  const { originalname, buffer, size } = req.file;
  const [filename, ...extensionParts] = originalname.split(".");
  const extension = extensionParts.join(".");
  const fileSize = size / 1024;
  const bucketName = process.env.MINIO_BUCKET_NAME as string;

  const session = await FileMetadata.startSession();
  session.startTransaction();

  try {
    const fileMetadata = await FileMetadata.findOne({ fileName: filename });
    if (!fileMetadata) {
      await session.abortTransaction();
      session.endSession(); //
      logger.error("File metadata not found");
      return res.status(404).send({ message: "File metadata not found" });
    }

    try {
      await minioClient.statObject(
        bucketName,
        `${fileMetadata.fileName}.${fileMetadata.fileExtension}`
      );
    } catch (err) {
      await session.abortTransaction();
      session.endSession(); //
      logger.error("File not found in MinIO");
      return res.status(404).send({ message: "File not found in MinIO" });
    }

    const obj = await minioClient.putObject(bucketName, originalname, buffer);
    if (!obj || !obj.etag) {
      await session.abortTransaction();
      session.endSession(); //
      logger.error("Failed to upload the file to MinIO");
      return res
        .status(500)
        .send({ message: "Failed to upload the file to MinIO" });
    }

    fileMetadata.fileName = filename;
    fileMetadata.fileExtension = extension;
    fileMetadata.fileSize = fileSize;
    await fileMetadata.save({ session });
    await session.commitTransaction();
    storeCache(filename, JSON.stringify(fileMetadata));
    session.endSession(); //
    logger.info("File updated successfully");
    return res.status(200).send({
      message: "File updated successfully",
      data: fileMetadata,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession(); //
    logger.error("Failed to update the file");
    return res.status(500).send({
      message: "Failed to update the file",
      error: error,
    });
  }
};

export default fileUpdater;
