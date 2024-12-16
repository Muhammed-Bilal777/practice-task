import { Request, Response } from "express";

import FileMetadata from "../model/fileMetaData";
import minioClient from "../minio/minioClient";
import mongoose from "mongoose";
import { resetCache } from "../utils/redisClient";

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
    try {
      await minioClient.statObject(bucketName, originalname);
      res.status(409).send({
        message: "File already exists in the bucket.",
      });
      return;
    } catch (err) {
      console.log(err);
    }

    await minioClient.putObject(bucketName, originalname, fileBuffer);

    const fileDetails = new FileMetadata({
      fileName: filename,
      fileExtension: extension,
      fileSize,
    });

    await fileDetails.save({ session });
    await session.commitTransaction();

    //const uniqueKey = generateUniqueKey({ fileName: filename });
    const uniqueCashKey = "files:cache:";
    await resetCache(uniqueCashKey, fileDetails);
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
