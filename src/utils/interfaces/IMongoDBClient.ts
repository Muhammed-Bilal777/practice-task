import mongoose from "mongoose";

export interface IMongoDBClient {
  saveFileMetadata(
    session: mongoose.ClientSession,
    filename: string,
    extension: string,
    fileSize: number
  ): Promise<void>;

  getFileMetadataFromDB(filename: string): Promise<any | null>;

  findFilesInDB(searchCriteria: any): Promise<any[]>;

  findAllFilesInDB(): Promise<any[]>;

  updateFileMetadataInDB(
    filename: string,
    extension: string,
    fileSize: number
  ): Promise<any>;

  deleteFileMetadataInDB(filename: string): Promise<void>;
}
