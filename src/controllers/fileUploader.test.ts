import { Request, Response } from "express";

import fileUploader from "./fileUploader";
import { minioClientInstance } from "../utils/minioUtils";
import { mongoClientInstance } from "../utils/mongooseUtils";
import mongoose from "mongoose";
import { redisClientInstance } from "../utils/redisClient";

// Mocks
jest.mock("../../utils/minioUtils");
jest.mock("../../utils/mongooseUtils");
jest.mock("../../utils/redisClient");

describe("File Uploader Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockSession: mongoose.ClientSession;

  beforeEach(() => {
    const file: any = {
      originalname: "test-file.txt",
      buffer: Buffer.from("file content"),
      size: 1000,
    };
    req = {
      file: file,
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if file is not found", async () => {
    req.file = undefined;
    await fileUploader(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "File not found",
    });
  });

  it("should return 409 if file already exists in MinIO", async () => {
    (minioClientInstance.checkFileExists as jest.Mock).mockResolvedValueOnce(
      true
    );

    await fileUploader(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith({
      message: "File already exists in the bucket.",
    });
  });

  it("should return 500 if file upload fails in MinIO", async () => {
    (minioClientInstance.checkFileExists as jest.Mock).mockResolvedValueOnce(
      false
    );
    (minioClientInstance.uploadFileToMinio as jest.Mock).mockRejectedValueOnce(
      new Error("MinIO upload failed")
    );

    await fileUploader(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Failed to upload the file or save the data.",
      error: expect.any(Error),
    });
  });

  it("should return 500 if saving file metadata fails in MongoDB after successful MinIO upload", async () => {
    (minioClientInstance.checkFileExists as jest.Mock).mockResolvedValueOnce(
      false
    );
    (minioClientInstance.uploadFileToMinio as jest.Mock).mockResolvedValueOnce({
      etag: "12345",
    });

    (mongoClientInstance.saveFileMetadata as jest.Mock).mockRejectedValueOnce(
      new Error("MongoDB save failed")
    );

    await fileUploader(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Failed to upload the file or save the data.",
      error: expect.any(Error),
    });
  });

  it("should return 201 if file is uploaded and saved to database successfully", async () => {
    (minioClientInstance.checkFileExists as jest.Mock).mockResolvedValueOnce(
      false
    );
    (minioClientInstance.uploadFileToMinio as jest.Mock).mockResolvedValueOnce({
      etag: "12345",
    });

    const mockFileMetadata = {
      fileName: "test-file",
      fileExtension: "txt",
      fileSize: 1,
    };
    (mongoClientInstance.saveFileMetadata as jest.Mock).mockResolvedValueOnce(
      mockFileMetadata
    );

    await fileUploader(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      message: "File uploaded successfully",
    });
  });
});
