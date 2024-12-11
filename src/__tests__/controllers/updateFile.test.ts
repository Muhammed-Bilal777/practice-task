import { Request, Response } from "express";

import FileMetadata from "../../model/fileMetaData";
import fileUpdater from "../../controllers/updateFile";
import minioClient from "../../minio/minioClient";
import mongoose from "mongoose";

jest.mock("../../minio/minioClient");
jest.mock("../../model/fileMetaData");

describe("fileUpdater Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockSession: mongoose.ClientSession;

  beforeEach(() => {
    let fileData: any = {
      originalname: "test-file.txt",
      buffer: Buffer.from("test content"),
      size: 1024,
    };
    req = {
      file: fileData,
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

    (FileMetadata.startSession as jest.Mock) = jest
      .fn()
      .mockResolvedValue(mockSession);

    (FileMetadata.findOne as jest.Mock) = jest.fn();
    (FileMetadata.prototype.save as jest.Mock) = jest.fn();

    (minioClient.statObject as jest.Mock) = jest.fn();
    (minioClient.putObject as jest.Mock) = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if no file to update", async () => {
    req.file = undefined;

    await fileUpdater(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "No file to update",
    });
  });

  it("should return 404 if file metadata not found", async () => {
    (FileMetadata.findOne as jest.Mock).mockResolvedValueOnce(null);

    await fileUpdater(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      message: "File metadata not found",
    });
  });

  it("should return 404 if file not found in MinIO", async () => {
    const mockFileMetadata = {
      fileName: "test-file",
      fileExtension: "txt",
      fileSize: 1,
    };

    // Mock the metadata retrieval to return the mockFileMetadata.
    (FileMetadata.findOne as jest.Mock).mockResolvedValueOnce(mockFileMetadata);

    // Simulate an error from MinIO (i.e., the file does not exist).
    (minioClient.statObject as jest.Mock).mockRejectedValueOnce(
      new Error("File not found")
    );

    // Call the controller function
    await fileUpdater(req as Request, res as Response);

    // Verify that the response is correct (404 with the correct error message).
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      message: "File not found in MinIO",
    });

    // Ensure that the session's abortTransaction method is called.
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });

  it("should return 200 if file is updated successfully", async () => {
    const mockFileMetadata = {
      fileName: "test-file",
      fileExtension: "txt",
      fileSize: 1,
      save: jest.fn().mockResolvedValue({}),
    };

    (FileMetadata.findOne as jest.Mock).mockResolvedValueOnce(mockFileMetadata);

    (minioClient.statObject as jest.Mock).mockResolvedValueOnce({});

    (minioClient.putObject as jest.Mock).mockResolvedValueOnce({
      etag: "some-etag",
    });

    await fileUpdater(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      message: "File updated successfully",
      data: mockFileMetadata,
    });
  });
  it("should return 500 if an error occurs during file metadata retrieval", async () => {
    // Mock an error during FileMetadata.findOne
    (FileMetadata.findOne as jest.Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    await fileUpdater(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Failed to update the file",
      error: expect.any(Error),
    });

   });

  it("should return 500 if the file upload fails in MinIO (no etag)", async () => {
    const mockFileMetadata = {
      fileName: "test-file",
      fileExtension: "txt",
      fileSize: 1,
      save: jest.fn().mockResolvedValue({}),
    };

     (FileMetadata.findOne as jest.Mock).mockResolvedValueOnce(mockFileMetadata);

     (minioClient.statObject as jest.Mock).mockResolvedValueOnce({});

     (minioClient.putObject as jest.Mock).mockResolvedValueOnce({}); // No etag

     await fileUpdater(req as Request, res as Response);

     expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Failed to upload the file to MinIO",
    });

     expect(mockSession.abortTransaction).toHaveBeenCalled();
  });
});
