import { Request, Response } from "express";

import FileMetadata from "../../model/fileMetaData";
import findFiles from "../../controllers/searchFiles";

jest.mock("../../model/fileMetaData");

describe("findFiles Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return all files when no query is provided", async () => {
    const req: Partial<Request> = { query: {} };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (FileMetadata.find as jest.Mock).mockResolvedValueOnce([
      { fileName: "file1.txt", fileSize: 100 },
      { fileName: "file2.txt", fileSize: 200 },
    ]);

    await findFiles(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      result: [
        { fileName: "file1.txt", fileSize: 100 },
        { fileName: "file2.txt", fileSize: 200 },
      ],
    });
  });

  it("should return filtered files based on fileName query", async () => {
    const req: Partial<Request> = { query: { fileName: "file1.txt" } };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (FileMetadata.find as jest.Mock).mockResolvedValueOnce([
      { fileName: "file1.txt", fileSize: 100 },
    ]);

    await findFiles(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      itemsFound: 1,
      items: [{ fileName: "file1.txt", fileSize: 100 }],
    });
  });

  it("should return filtered files based on fileExtension query", async () => {
    const req: Partial<Request> = { query: { fileExtension: "txt" } };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (FileMetadata.find as jest.Mock).mockResolvedValueOnce([
      { fileName: "file1.txt", fileExtension: "txt", fileSize: 100 },
    ]);

    await findFiles(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      itemsFound: 1,
      items: [{ fileName: "file1.txt", fileExtension: "txt", fileSize: 100 }],
    });
  });

  it("should return filtered files based on fileSize query", async () => {
    const req: Partial<Request> = { query: { fileSize: "100" } };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (FileMetadata.find as jest.Mock).mockResolvedValueOnce([
      { fileName: "file1.txt", fileSize: 100 },
    ]);

    await findFiles(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      itemsFound: 1,
      items: [{ fileName: "file1.txt", fileSize: 100 }],
    });
  });

  it("should return filtered files based on minSize query", async () => {
    const req: Partial<Request> = { query: { minSize: "100" } };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (FileMetadata.find as jest.Mock).mockResolvedValueOnce([
      { fileName: "file1.txt", fileSize: 100 },
    ]);

    await findFiles(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      itemsFound: 1,
      items: [{ fileName: "file1.txt", fileSize: 100 }],
    });
  });

  it("should return filtered files based on maxSize query", async () => {
    const req: Partial<Request> = { query: { maxSize: "200" } };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (FileMetadata.find as jest.Mock).mockResolvedValueOnce([
      { fileName: "file1.txt", fileSize: 200 },
    ]);

    await findFiles(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      itemsFound: 1,
      items: [{ fileName: "file1.txt", fileSize: 200 }],
    });
  });

  it("should return filtered files based on multiple query parameters", async () => {
    const req: Partial<Request> = {
      query: { fileName: "file1.txt", fileSize: "100" },
    };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (FileMetadata.find as jest.Mock).mockResolvedValueOnce([
      { fileName: "file1.txt", fileSize: 100 },
    ]);

    await findFiles(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      itemsFound: 1,
      items: [{ fileName: "file1.txt", fileSize: 100 }],
    });
  });

  it("should return 404 if no items match the search criteria", async () => {
    const req: Partial<Request> = { query: { fileName: "nonexistent.txt" } };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (FileMetadata.find as jest.Mock).mockResolvedValueOnce([]);

    await findFiles(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "items not found" });
  });

  it("should return 404 if an error occurs during the database query", async () => {
    const req: Partial<Request> = { query: { fileName: "errorFile.txt" } };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (FileMetadata.find as jest.Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    await findFiles(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      "An error occurred while searching for files."
    );
  });
});
