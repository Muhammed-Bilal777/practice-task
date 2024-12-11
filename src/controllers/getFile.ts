import { Request, Response } from "express";

import logger from "../logger/logger";
import mime from "mime-types";
import minioClient from "../minio/minioClient";

const getFile = async (req: Request, res: Response): Promise<void> => {
  const bucketName = process.env.MINIO_BUCKET_NAME as string;
  const objectName = req.query.filename as string;

  if (!objectName) {
    res.status(400).send("Filename is required.");
    logger.error("Filename is required.");
    return;
  }
  try {
    const stream = await minioClient.getObject(bucketName, objectName);

    const contentType: any = mime.lookup(objectName);

    res.setHeader("Content-Type", contentType);

    stream.pipe(res);
    logger.info("sending file");
  } catch (err) {
    res.status(404).send("File not found.");
    logger.error("File not found.");
    return;
  }
};
export default getFile;
