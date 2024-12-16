import { Request, Response } from "express";
import {
  cacheData,
  generateUniqueCacheKey,
  getCachedData,
} from "../utils/redisClient";

import FileMetadata from "../model/fileMetaData";

const findFiles = async (req: Request, res: Response): Promise<void> => {
  const { fileName, fileExtension, fileSize, minSize, maxSize } = req.query;

  const searchCriteria: { $and: Array<{ [key: string]: any }> } = {
    $and: [],
  };

  if (fileName) {
    searchCriteria.$and.push({ fileName });
  }
  if (fileExtension) {
    searchCriteria.$and.push({ fileExtension });
  }
  if (fileSize) {
    searchCriteria.$and.push({ fileSize: Number(fileSize) });
  }
  if (minSize) {
    searchCriteria.$and.push({ fileSize: { $gte: Number(minSize) } });
  }
  if (maxSize) {
    searchCriteria.$and.push({ fileSize: { $lte: Number(maxSize) } });
  }

  const queryStr: any = req.query;
  const cacheKey = generateUniqueCacheKey(queryStr);

  if (Object.keys(req.query).length === 0) {
    const cachedData = await getCachedData("files:cache:");

    if (cachedData) {
      res.status(200).json({
        itemsFound: cachedData.length,
        items: cachedData,
      });
      return;
    }

    try {
      const results = await FileMetadata.find();

      if (results.length === 0) {
        res.status(404).json({
          message: "No files found in the database",
        });
        return;
      }
      const uniqueCashKey = "files:cache:";
      await cacheData(uniqueCashKey, results);

      res.status(200).json({
        itemsFound: results.length,
        items: results,
      });
      return;
    } catch (error) {
      console.error("Error retrieving all files:", error);
      res.status(500).json({
        message: "Error retrieving all files",
      });
      return;
    }
  }

  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    res.status(200).json({
      itemsFound: cachedData.length,
      items: cachedData,
    });
    return;
  }

  try {
    const results = await FileMetadata.find(searchCriteria);

    if (results.length === 0) {
      res.status(404).json({
        message: "No files found matching the query",
      });
      return;
    }

    await cacheData(cacheKey, results);

    res.status(200).json({
      itemsFound: results.length,
      items: results,
    });
    return;
  } catch (error) {
    console.error("Error retrieving files:", error);
    res.status(500).json({
      message: "Error retrieving files",
    });
    return;
  }
};

export default findFiles;
