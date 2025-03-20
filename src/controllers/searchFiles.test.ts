import { Request, Response } from "express";

import findFiles from "./searchFiles";
import { mongoClientInstance } from "../utils/mongooseUtils";
import { redisClientInstance } from "../utils/redisClient";

jest.mock("../../utils/mongooseUtils", () => ({
  mongoClientInstance: {
    findAllFilesInDB: jest.fn(),
    findFilesInDB: jest.fn(),
  },
}));

jest.mock("../../utils/redisClient", () => ({
  redisClientInstance: {
    getCachedData: jest.fn(),
    cacheData: jest.fn(),
    generateUniqueCacheKey: jest.fn(),
  },
}));

describe("findFiles Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return all files when no query is provided and cache is available", async () => {
    const req: Partial<Request> = { query: {} };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const allFilesCache = [
      { fileName: "file1.txt", fileSize: 100 },
      { fileName: "file2.txt", fileSize: 200 },
    ];

    (redisClientInstance.getCachedData as jest.Mock).mockResolvedValueOnce(
      allFilesCache
    );

    (
      redisClientInstance.generateUniqueCacheKey as jest.Mock
    ).mockReturnValueOnce("files:cache:");

    await findFiles(req as Request, res as Response);

    expect(redisClientInstance.getCachedData).toHaveBeenCalledWith(
      "files:cache:"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      itemsFound: allFilesCache.length,
      items: allFilesCache,
    });
  });

  it("should return all files when no query is provided and cache is empty", async () => {
    const req: Partial<Request> = { query: {} };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const results = [
      { fileName: "file1.txt", fileSize: 100 },
      { fileName: "file2.txt", fileSize: 200 },
    ];

    (redisClientInstance.getCachedData as jest.Mock).mockResolvedValueOnce(
      null
    );
    (mongoClientInstance.findAllFilesInDB as jest.Mock).mockResolvedValueOnce(
      results
    );

    (redisClientInstance.cacheData as jest.Mock).mockResolvedValueOnce(true);

    (
      redisClientInstance.generateUniqueCacheKey as jest.Mock
    ).mockReturnValueOnce("files:cache:");

    await findFiles(req as Request, res as Response);

    expect(redisClientInstance.cacheData).toHaveBeenCalledWith(
      "files:cache:",
      results
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      itemsFound: results.length,
      items: results,
    });
  });

  it("should return filtered files based on query parameters", async () => {
    const req: Partial<Request> = { query: { fileName: "file1.txt" } };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const results = [{ fileName: "file1.txt", fileSize: 100 }];
    const cacheKey = "some-unique-cache-key";

    (redisClientInstance.getCachedData as jest.Mock).mockResolvedValueOnce(
      null
    );
    (mongoClientInstance.findFilesInDB as jest.Mock).mockResolvedValueOnce(
      results
    );

    (redisClientInstance.cacheData as jest.Mock).mockResolvedValueOnce(true);

    (
      redisClientInstance.generateUniqueCacheKey as jest.Mock
    ).mockReturnValueOnce(cacheKey);

    await findFiles(req as Request, res as Response);

    expect(redisClientInstance.cacheData).toHaveBeenCalledWith(
      cacheKey,
      results
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      itemsFound: results.length,
      items: results,
    });
  });

  it("should return 404 if no files match the search criteria", async () => {
    const req: Partial<Request> = { query: { fileName: "nonexistent.txt" } };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (redisClientInstance.getCachedData as jest.Mock).mockResolvedValueOnce(
      null
    );
    (mongoClientInstance.findFilesInDB as jest.Mock).mockResolvedValueOnce([]);

    await findFiles(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "No files found matching the query",
    });
  });

  it("should return 500 if an error occurs during the database query", async () => {
    const req: Partial<Request> = { query: { fileName: "file1.txt" } };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (redisClientInstance.getCachedData as jest.Mock).mockResolvedValueOnce(
      null
    );
    (mongoClientInstance.findFilesInDB as jest.Mock).mockRejectedValueOnce(
      new Error("DB error")
    );

    await findFiles(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Error retrieving files",
    });
  });
  it("should return all files when no query is provided and cache is available", async () => {
    const req: Partial<Request> = { query: {} }; // No query parameters
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const allFilesCache = [
      { fileName: "file1.txt", fileSize: 100 },
      { fileName: "file2.txt", fileSize: 200 },
    ];

    (redisClientInstance.getCachedData as jest.Mock).mockResolvedValueOnce(
      allFilesCache
    );

    (
      redisClientInstance.generateUniqueCacheKey as jest.Mock
    ).mockReturnValueOnce("files:cache:");

    await findFiles(req as Request, res as Response);

    expect(redisClientInstance.getCachedData).toHaveBeenCalledWith(
      "files:cache:"
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      itemsFound: allFilesCache.length,
      items: allFilesCache,
    });

    expect(redisClientInstance.cacheData).not.toHaveBeenCalled();
  });
});
