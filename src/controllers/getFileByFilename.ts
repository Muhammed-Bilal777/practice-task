import { Request, Response, query } from "express";
import {
  cacheData,
  generateUniqueCacheKey,
  getCachedData,
} from "../utils/redisClient";

import FileMetadata from "../model/fileMetaData";

const getFileByFilename = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { filename } = req.params;

  if (!filename) {
    res.status(400).send({ message: "Filename is required." });
    return;
  }

  const uniqueCashKey = generateUniqueCacheKey({ filename });

  const cachedFileMetadata = await getCachedData(uniqueCashKey);

  if (cachedFileMetadata) {
    console.log(`Cache hit for file: ${filename}`);
    res.status(200).json({ fileMetadata: cachedFileMetadata });
    return;
  }

  try {
    const fileMetadata = await FileMetadata.findOne({ fileName: filename });

    if (!fileMetadata) {
      res
        .status(404)
        .send({ message: `File ${filename} not found in the database.` });
      return;
    }

    await cacheData(uniqueCashKey, fileMetadata);

    console.log(`Cache set for file: ${filename}`);

    res.status(200).json({ fileMetadata });
  } catch (error) {
    console.error(`Error fetching file: ${filename}`, error);
    res.status(500).send({ message: "Error retrieving file metadata", error });
  }
};

export default getFileByFilename;
