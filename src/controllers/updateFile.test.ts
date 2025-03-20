import { Request, Response } from "express";

import fileUpdater from "./updateFile";
import { minioClientInstance } from "../utils/minioUtils";
import { mocked } from "jest-mock";
import { mongoClientInstance } from "../utils/mongooseUtils";
import { redisClientInstance } from "../utils/redisClient";

jest.mock("../../utils/minioUtils");
jest.mock("../../utils/mongooseUtils");
jest.mock("../../utils/redisClient");

describe("fileUpdater Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    const file: any = {
      originalname: "test-file.txt",
      buffer: Buffer.from("test file content"),
      size: 1024,
    };
    req = {
      file: file,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  it("should return 400 if no file to update", async () => {
    req.file = undefined;

    await fileUpdater(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "No file to update" });
  });

  it("should return 404 if file metadata not found in the database", async () => {
    mocked(mongoClientInstance.getFileMetadataFromDB).mockResolvedValue(null);

    await fileUpdater(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      message: "File test-file not found in the database.",
    });
  });

  it("should return 200 if file is updated successfully", async () => {
    mocked(mongoClientInstance.getFileMetadataFromDB).mockResolvedValue({
      fileName: "test-file",
      fileExtension: "txt",
      fileSize: 1,
    });

    mocked(minioClientInstance.uploadFileToMinio).mockResolvedValue(undefined);
    mocked(mongoClientInstance.updateFileMetadataInDB).mockResolvedValue(
      undefined
    );
    mocked(redisClientInstance.resetCache).mockResolvedValue(undefined);

    await fileUpdater(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      message: "File updated successfully",
      data: { filename: "test-file", fileSize: 1, fileExtension: "txt" },
    });
  });

  it("should return 500 if an error occurs during file metadata retrieval", async () => {
    mocked(mongoClientInstance.getFileMetadataFromDB).mockRejectedValue(
      new Error("DB error")
    );

    await fileUpdater(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Failed to update the file",
      error: expect.any(Error),
    });
  });

  it("should return 500 if file upload fails in MinIO", async () => {
    mocked(mongoClientInstance.getFileMetadataFromDB).mockResolvedValue({
      fileName: "test-file",
      fileExtension: "txt",
      fileSize: 1,
    });
    mocked(minioClientInstance.uploadFileToMinio).mockRejectedValue(
      new Error("MinIO upload error")
    );

    await fileUpdater(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Failed to update the file",
      error: expect.any(Error),
    });
  });

  it("should reset Redis cache when file is updated", async () => {
    mocked(mongoClientInstance.getFileMetadataFromDB).mockResolvedValue({
      fileName: "test-file",
      fileExtension: "txt",
      fileSize: 1,
    });
    mocked(minioClientInstance.uploadFileToMinio).mockResolvedValue(undefined);
    mocked(mongoClientInstance.updateFileMetadataInDB).mockResolvedValue(
      undefined
    );
    mocked(redisClientInstance.resetCache).mockResolvedValue(undefined);

    await fileUpdater(req as Request, res as Response);

    expect(redisClientInstance.resetCache).toHaveBeenCalled();
  });

  it("should handle cases when file metadata cannot be updated in the database", async () => {
    mocked(mongoClientInstance.getFileMetadataFromDB).mockResolvedValue({
      fileName: "test-file",
      fileExtension: "txt",
      fileSize: 1,
    });
    mocked(minioClientInstance.uploadFileToMinio).mockResolvedValue(undefined);
    mocked(mongoClientInstance.updateFileMetadataInDB).mockRejectedValue(
      new Error("Update DB error")
    );

    await fileUpdater(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Failed to update the file",
      error: expect.any(Error),
    });
  });
});
