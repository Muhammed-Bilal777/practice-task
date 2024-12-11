import { Request, Response } from "express";

import FileMetadata from "../model/fileMetaData";
import logger from "../logger/logger";

const findFiles = async (req: Request, res: Response): Promise<void> => {
  const { fileName, fileExtension, dimension, fileSize, minSize, maxSize } =
    req.query;

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
    searchCriteria.$and.push({ fileSize: { $lte: Number(minSize) } });
  }
  if (maxSize) {
    searchCriteria.$and.push({ fileSize: { $gte: Number(maxSize) } });
  }

  if (searchCriteria.$and.length === 0) {
    const result = await FileMetadata.find();

    res.status(200).json({
      result,
    });
    return;
  }

  try {
    const results = await FileMetadata.find(searchCriteria);

    if (results.length <= 0) {
      logger.info("items not found");
      res.status(404).json({
        message: "items not found",
      });
      return;
    }
    logger.info("successsfully fetched data");
    res.status(200).json({
      itemsFound: results.length,
      items: results,
    });
  } catch (error) {
    logger.error("An error occurred while searching for files.");
    res.status(404).json("An error occurred while searching for files.");
  }
};

export default findFiles;
