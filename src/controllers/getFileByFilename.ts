import { Request, Response } from "express";

import logger from "../logger/logger";
import { mongoClientInstance } from "../utils/mongooseUtils";
import { redisClientInstance } from "../utils/redisClient";

const getFileByFilename = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { filename } = req.params;

  if (!filename) {
    res.status(400).send({ message: "Filename is required." });
    return;
  }

  const cachedFileMetadata = await redisClientInstance.getCache(filename);
  if (cachedFileMetadata) {
    logger.info(`Cache hit for file: ${filename}`);
    res.status(200).json({ fileMetadata: cachedFileMetadata });
    return;
  }

  try {
    const fileMetadata = await mongoClientInstance.getFileMetadataFromDB(
      filename
    );

    if (fileMetadata) {
      await redisClientInstance.setCache(filename, fileMetadata);
      logger.info(`Cache set for file: ${filename}`);
      res.status(200).json({ fileMetadata });
      return;
    } else {
      res.status(404).send({
        message: `File ${filename} not found in the database.`,
      });
      return;
    }
  } catch (error) {
    logger.error(`Error fetching file: ${filename}`, error);
    res.status(500).send({ message: "Error retrieving file metadata", error });
  }
};

export default getFileByFilename;
