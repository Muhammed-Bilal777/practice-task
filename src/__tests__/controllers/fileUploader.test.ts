import { Request, Response } from "express";

import FileMetadata from "../../model/fileMetaData";
import fileUploader from "../../controllers/fileUploader";
import minioClient from "../../minio/minioClient";
import mongoose from "mongoose";

jest.mock("../../minio/minioClient");
jest.mock("../../model/fileMetaData");

describe("File Uploader Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

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
    const mockStartSession = jest.fn().mockReturnValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    });
    mongoose.startSession = mockStartSession;

    (minioClient.statObject as jest.Mock).mockResolvedValueOnce(true);

    await fileUploader(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith({
      message: "File already exists in the bucket.",
    });
  });

  it("should return 500 if file upload fails in MinIO", async () => {
    const mockStartSession = jest.fn().mockReturnValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    });
    mongoose.startSession = mockStartSession;

    (minioClient.statObject as jest.Mock).mockRejectedValueOnce(
      new Error("File does not exist")
    );

    (minioClient.putObject as jest.Mock).mockRejectedValueOnce(
      new Error("MinIO upload failed")
    );

    await fileUploader(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Failed to upload the file or save the data into the database",
      error: expect.any(Error),
    });
  });

  it("should return 500 if database save fails after MinIO upload", async () => {
    const mockStartSession = jest.fn().mockReturnValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    });
    mongoose.startSession = mockStartSession;

    (minioClient.statObject as jest.Mock).mockRejectedValueOnce(
      new Error("File does not exist")
    );
    (minioClient.putObject as jest.Mock).mockResolvedValueOnce({
      etag: "12345",
    });

    (FileMetadata.prototype.save as jest.Mock).mockRejectedValueOnce(
      new Error("Database save failed")
    );

    await fileUploader(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Failed to upload the file or save the data into the database",
      error: expect.any(Error),
    });
  });

  it("should return 201 if file is uploaded successfully and saved to database", async () => {
    const mockStartSession = jest.fn().mockReturnValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    });
    mongoose.startSession = mockStartSession;

    (minioClient.statObject as jest.Mock).mockRejectedValueOnce(
      new Error("File does not exist")
    );
    (minioClient.putObject as jest.Mock).mockResolvedValueOnce({
      etag: "12345",
    });

    const mockFileMetadata = {
      fileName: "test-file",
      fileExtension: "txt",
      fileSize: 1, // in KB
    };

    (FileMetadata.prototype.save as jest.Mock).mockResolvedValueOnce(
      mockFileMetadata
    );

    await fileUploader(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      message: "File uploaded successfully",
    });
  });
});
