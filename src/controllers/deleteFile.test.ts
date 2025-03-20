import { Request, Response } from "express";

import fileDeleter from "./deleteFile";
import logger from "../logger/logger";
import { minioClientInstance } from "../utils/minioUtils";
import { mongoClientInstance } from "../utils/mongooseUtils";
import mongoose from "mongoose";
import { redisClientInstance } from "../utils/redisClient";

jest.mock("../../utils/minioUtils");
jest.mock("../../utils/mongooseUtils");
jest.mock("../../utils/redisClient");
jest.mock("../../logger/logger");

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

    mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

    (mongoClientInstance.getFileMetadataFromDB as jest.Mock).mockResolvedValue(
      null
    );
    (minioClientInstance.removeFileFromMinio as jest.Mock).mockResolvedValue(
      {}
    );
    (redisClientInstance.getCachedData as jest.Mock).mockResolvedValue([]);
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
    (
      mongoClientInstance.getFileMetadataFromDB as jest.Mock
    ).mockResolvedValueOnce(null);

    await fileDeleter(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      message: "File not found in the database.",
    });
  });

  it("should return 500 if file not found in MinIO", async () => {
    const mockFileMetadata = {
      fileName: "test-file",
      fileExtension: "txt",
    };
    (
      mongoClientInstance.getFileMetadataFromDB as jest.Mock
    ).mockResolvedValueOnce(mockFileMetadata);

    (
      minioClientInstance.removeFileFromMinio as jest.Mock
    ).mockRejectedValueOnce(new Error("MinIO delete failed"));

    await fileDeleter(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Failed to delete file from MinIO: MinIO delete failed",
    });
  });

  it("should return 200 if file is successfully deleted from both MinIO and database", async () => {
    const mockFileMetadata = {
      fileName: "test-file",
      fileExtension: "txt",
    };

    (
      mongoClientInstance.getFileMetadataFromDB as jest.Mock
    ).mockResolvedValueOnce(mockFileMetadata);
    (
      minioClientInstance.removeFileFromMinio as jest.Mock
    ).mockResolvedValueOnce({});

    (
      mongoClientInstance.deleteFileMetadataInDB as jest.Mock
    ).mockResolvedValueOnce({});
    (redisClientInstance.getCachedData as jest.Mock).mockResolvedValueOnce([]);
    (redisClientInstance.cacheData as jest.Mock).mockResolvedValueOnce({});
    (redisClientInstance.generateUniqueCacheKey as jest.Mock).mockReturnValue(
      "files:cache:test-file"
    );
    (redisClientInstance.getCachedData as jest.Mock).mockResolvedValueOnce(
      null
    );

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
    };

    (
      mongoClientInstance.getFileMetadataFromDB as jest.Mock
    ).mockResolvedValueOnce(mockFileMetadata);
    (
      minioClientInstance.removeFileFromMinio as jest.Mock
    ).mockResolvedValueOnce({});

    (
      mongoClientInstance.deleteFileMetadataInDB as jest.Mock
    ).mockRejectedValueOnce(new Error("MongoDB delete failed"));

    await fileDeleter(req as Request, res as Response);

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Failed to delete the file.",
      error: expect.any(Error),
    });
  });

  it("should return 500 if an error occurs during the session commit/abort", async () => {
    const mockFileMetadata = {
      fileName: "test-file",
      fileExtension: "txt",
    };

    (
      mongoClientInstance.getFileMetadataFromDB as jest.Mock
    ).mockResolvedValueOnce(mockFileMetadata);
    (
      minioClientInstance.removeFileFromMinio as jest.Mock
    ).mockResolvedValueOnce({});

    mockSession.commitTransaction = jest
      .fn()
      .mockRejectedValueOnce(new Error("Session commit failed"));

    await fileDeleter(req as Request, res as Response);

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Failed to delete the file.",
      error: expect.any(Error),
    });
  });
  it("should log a warning if no cache is found for all files", async () => {
    const mockFileMetadata = {
      fileName: "test-file",
      fileExtension: "txt",
    };

    (
      mongoClientInstance.getFileMetadataFromDB as jest.Mock
    ).mockResolvedValueOnce(mockFileMetadata);
    (
      minioClientInstance.removeFileFromMinio as jest.Mock
    ).mockResolvedValueOnce({});

    (redisClientInstance.getCachedData as jest.Mock).mockResolvedValueOnce(
      null
    );

    await fileDeleter(req as Request, res as Response);

    expect(logger.warn).toHaveBeenCalledWith(
      "No cache found for all files, nothing to invalidate."
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      message: "File deleted successfully from both MinIO and database.",
    });
  });
});
