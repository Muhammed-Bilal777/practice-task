import { Request, Response } from "express";

import getFile from "../../controllers/getFile";
import mime from "mime-types";
import minioClient from "../../minio/minioClient";

jest.mock("../../minio/minioClient");
jest.mock("mime-types");

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
    req.query = {};

    await getFile(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Filename is required.");
  });

  it("should return the file and pipe it to the response if the file exists", async () => {
    req.query = { filename: "testfile.txt" };

    minioClient.getObject = jest.fn().mockResolvedValue(mockStream);

    await getFile(req as Request, res as Response);

    expect(minioClient.getObject).toHaveBeenCalledWith(
      process.env.MINIO_BUCKET_NAME,
      "testfile.txt"
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/octet-stream"
    );
    expect(mockStream.pipe).toHaveBeenCalledWith(res);
  });

  it("should return 404 if the file is not found", async () => {
    req.query = { filename: "nonexistentfile.txt" };

    minioClient.getObject = jest
      .fn()
      .mockRejectedValue(new Error("File not found"));

    await getFile(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("File not found.");
  });
});
