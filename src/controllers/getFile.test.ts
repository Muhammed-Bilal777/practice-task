import { Request, Response } from "express";

import getFile from "./getFile";
import logger from "../logger/logger";
import mime from "mime-types";
import { minioClientInstance } from "../utils/minioUtils";

jest.mock("../../utils/minioUtils");
jest.mock("mime-types");
jest.mock("../../logger/logger");

describe("getFile Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockStream: any;

  beforeEach(() => {
    req = {
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      setHeader: jest.fn(),
      pipe: jest.fn(),
    };

    mime.lookup = jest.fn().mockReturnValue("application/octet-stream");

    mockStream = {
      pipe: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it("should return 400 if filename is not provided", async () => {
    req.query = {}; // No filename in query

    await getFile(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Filename is required.");
    expect(logger.error).toHaveBeenCalledWith("Filename is required.");
  });

  it("should return the file and pipe it to the response if the file exists", async () => {
    req.query = { filename: "testfile.txt" };

    minioClientInstance.getFileFromMinio = jest
      .fn()
      .mockResolvedValue(mockStream);

    await getFile(req as Request, res as Response);

    expect(minioClientInstance.getFileFromMinio).toHaveBeenCalledWith(
      process.env.MINIO_BUCKET_NAME,
      "testfile.txt"
    );

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/octet-stream"
    );

    expect(mockStream.pipe).toHaveBeenCalledWith(res);

    expect(logger.info).toHaveBeenCalledWith("Sending file to client");
  });

  it("should return 404 if the file is not found", async () => {
    req.query = { filename: "nonexistentfile.txt" };

    minioClientInstance.getFileFromMinio = jest
      .fn()
      .mockRejectedValue(new Error("File not found"));

    await getFile(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("File not found.");

    expect(logger.error).toHaveBeenCalledWith(
      "Error fetching file:",
      expect.any(Error)
    );
  });

  it("should return 404 if there is an error fetching the file", async () => {
    req.query = { filename: "errorfile.txt" };

    minioClientInstance.getFileFromMinio = jest
      .fn()
      .mockRejectedValue(new Error("Error fetching file"));

    await getFile(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("File not found.");

    expect(logger.error).toHaveBeenCalledWith(
      "Error fetching file:",
      expect.any(Error)
    );
  });
  it("should return 404 if the file is not found", async () => {
    req.query = { filename: "nonexistentfile.txt" };

    minioClientInstance.getFileFromMinio = jest.fn().mockResolvedValue(null); // Simulate file not found by returning null

    await getFile(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("File not found.");

    expect(logger.error).toHaveBeenCalledWith(
      `File "nonexistentfile.txt" not found in bucket "${process.env.MINIO_BUCKET_NAME}".`
    );
  });
});
