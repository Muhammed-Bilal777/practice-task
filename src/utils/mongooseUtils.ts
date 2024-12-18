import FileMetadata from "../model/fileMetaData";
import { IMongoDBClient } from "./interfaces/IMongoDBClient";
import mongoose from "mongoose";

export class MongoDBClient implements IMongoDBClient {
  async buildSearchCriteria(query: any) {
    const { fileName, fileExtension, fileSize, minSize, maxSize } = query;

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
    return searchCriteria;
  }

  async saveFileMetadata(
    session: mongoose.ClientSession,
    filename: string,
    extension: string,
    fileSize: number
  ): Promise<void> {
    try {
      const newFileMetadata = new FileMetadata({
        fileName: filename,
        fileExtension: extension,
        fileSize,
      });

      await newFileMetadata.save({ session });
      console.log(`File metadata saved for ${filename}`);
    } catch (error) {
      console.error(`Error saving file metadata for ${filename}:`, error);
      throw new Error("Failed to save file metadata.");
    }
  }

  async getFileMetadataFromDB(filename: string): Promise<any | null> {
    try {
      const fileMetadata = await FileMetadata.findOne({ fileName: filename });
      return fileMetadata;
    } catch (error) {
      console.error(`Error fetching file metadata for ${filename}:`, error);
      return null;
    }
  }

  async findFilesInDB(searchCriteria: any): Promise<any[]> {
    try {
      const files = await FileMetadata.find(searchCriteria);
      return files;
    } catch (error) {
      console.error("Error searching files in the database:", error);
      throw new Error("Failed to find files.");
    }
  }

  async findAllFilesInDB(): Promise<any[]> {
    try {
      const allFiles = await FileMetadata.find();
      return allFiles;
    } catch (error) {
      console.error("Error fetching all files from the database:", error);
      throw new Error("Failed to retrieve all files.");
    }
  }

  async updateFileMetadataInDB(
    filename: string,
    extension: string,
    fileSize: number
  ): Promise<any> {
    try {
      const updatedFileMetadata = await FileMetadata.findOneAndUpdate(
        { fileName: filename },
        { fileExtension: extension, fileSize },
        { new: true }
      );
      return updatedFileMetadata;
    } catch (error) {
      console.error(`Error updating metadata for ${filename}:`, error);
      throw new Error("Failed to update file metadata.");
    }
  }

  async deleteFileMetadataInDB(filename: string): Promise<void> {
    try {
      await FileMetadata.deleteOne({ fileName: filename });
      console.log(`File metadata for ${filename} deleted successfully.`);
    } catch (error) {
      console.error(`Error deleting metadata for ${filename}:`, error);
      throw new Error("Failed to delete file metadata.");
    }
  }
}
