import { Request, Response } from "express";

import FileMetadata from "../../model/fileMetaData";
import fileDeleter from "../../controllers/deleteFile";
import minioClient from "../../minio/minioClient";
import mongoose from "mongoose";

jest.mock("../../minio/minioClient");

jest.mock("../../model/fileMetaData");

describe("fileDeleter Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockSession: mongoose.ClientSession;

  beforeEach(() => {
    req = {
      query: {
        fileName: "test-file", 
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

     mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    } as any;

     (FileMetadata.startSession as jest.Mock)
      .mockResolvedValue(mockSession);

     (FileMetadata.findOne as jest.Mock)
  });

  afterEach(() => {
    jest.clearAllMocks();  
  });

  it("should return 400 if fileName is not provided", async () => {
    req.query = {}; 

    await fileDeleter(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "File name is required.",
    });
  });

  it("should return 404 if file not found in the database", async () => {
     (FileMetadata.findOne as jest.Mock).mockResolvedValue(null);

    await fileDeleter(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      message: "File not found in the database.",
    });
  });

  it("should return 404 if file not found in MinIO", async () => {
     const mockFileMetadata = {
      fileName: "test-file",
      fileExtension: "txt",
      fileSize: 1234,
    };
    (FileMetadata.findOne as jest.Mock).mockResolvedValueOnce(mockFileMetadata);

     (minioClient.statObject as jest.Mock).mockRejectedValueOnce(
      new Error("File not found")
    );

    await fileDeleter(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      message: "File not found in MinIO.",
    });
  });

  it("should return 200 if file is successfully deleted from both MinIO and database", async () => {
    const mockFileMetadata = {
      fileName: "test-file",
      fileExtension: "txt",
      fileSize: 1234,
      deleteOne: jest.fn().mockResolvedValue({}), 
    };

     (FileMetadata.findOne as jest.Mock).mockResolvedValueOnce(mockFileMetadata);

     (minioClient.statObject as jest.Mock).mockResolvedValueOnce({});

     (minioClient.removeObject as jest.Mock).mockResolvedValueOnce({});

     mockSession.commitTransaction = jest.fn().mockResolvedValueOnce(undefined);

    await fileDeleter(req as Request, res as Response);

     expect(mockSession.commitTransaction).toHaveBeenCalled();

     expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      message: "File deleted successfully from both MinIO and database.",
    });
  });

  it("should return 500 if an error occurs during the deletion process", async () => {
    const mockFileMetadata = {
      fileName: "test-file",
      fileExtension: "txt",
      fileSize: 1234,
      deleteOne: jest.fn().mockResolvedValue({}),
    };

     (FileMetadata.findOne as jest.Mock).mockResolvedValueOnce(mockFileMetadata);

     (minioClient.statObject as jest.Mock).mockResolvedValueOnce({});

     (minioClient.removeObject as jest.Mock).mockRejectedValueOnce(
      new Error("MinIO delete failed")
    );

     mockSession.abortTransaction = jest.fn().mockResolvedValueOnce(undefined);

    await fileDeleter(req as Request, res as Response);

     expect(mockSession.abortTransaction).toHaveBeenCalled();

     expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Failed to delete the file.",
      error: expect.any(Error),
    });
  });
});
