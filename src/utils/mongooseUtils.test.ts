import FileMetadata from "../model/fileMetaData";
import { MongoDBClient } from "./mongooseUtils";
import mongoose from "mongoose";

jest.mock("../../model/fileMetaData");

describe("MongoDBClient", () => {
  let mongoDBClient: MongoDBClient;

  beforeEach(() => {
    mongoDBClient = new MongoDBClient();
    jest.clearAllMocks();
  });

  describe("saveFileMetadata", () => {
    it("should save file metadata successfully", async () => {
      const saveMock = jest.fn().mockResolvedValueOnce(null);
      (FileMetadata.prototype.save as jest.Mock) = saveMock;

      const session = {} as mongoose.ClientSession; // Mock session if needed
      await mongoDBClient.saveFileMetadata(session, "test.txt", ".txt", 1024);

      expect(saveMock).toHaveBeenCalled();
      expect(saveMock).toHaveBeenCalledWith({ session });
    });

    it("should throw an error if save fails", async () => {
      const saveMock = jest
        .fn()
        .mockRejectedValueOnce(new Error("Database error"));
      (FileMetadata.prototype.save as jest.Mock) = saveMock;

      const session = {} as mongoose.ClientSession;

      await expect(
        mongoDBClient.saveFileMetadata(session, "test.txt", ".txt", 1024)
      ).rejects.toThrow("Failed to save file metadata.");
    });
  });

  describe("getFileMetadataFromDB", () => {
    it("should fetch file metadata successfully", async () => {
      const mockFileMetadata = { fileName: "test.txt", fileSize: 1024 };
      const findOneMock = jest.fn().mockResolvedValueOnce(mockFileMetadata);
      (FileMetadata.findOne as jest.Mock) = findOneMock;

      const result = await mongoDBClient.getFileMetadataFromDB("test.txt");

      expect(findOneMock).toHaveBeenCalledWith({ fileName: "test.txt" });
      expect(result).toEqual(mockFileMetadata);
    });

    it("should return null if file metadata is not found", async () => {
      const findOneMock = jest.fn().mockResolvedValueOnce(null);
      (FileMetadata.findOne as jest.Mock) = findOneMock;

      const result = await mongoDBClient.getFileMetadataFromDB(
        "nonexistent.txt"
      );

      expect(result).toBeNull();
    });

    it("should log an error and return null if an error occurs", async () => {
      const findOneMock = jest
        .fn()
        .mockRejectedValueOnce(new Error("Database error"));
      (FileMetadata.findOne as jest.Mock) = findOneMock;

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await mongoDBClient.getFileMetadataFromDB("test.txt");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching file metadata for test.txt:",
        expect.any(Error)
      );

      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("findFilesInDB", () => {
    it("should find files based on search criteria", async () => {
      const mockFiles = [
        { fileName: "test1.txt", fileSize: 1024 },
        { fileName: "test2.txt", fileSize: 2048 },
      ];
      const findMock = jest.fn().mockResolvedValueOnce(mockFiles);
      (FileMetadata.find as jest.Mock) = findMock;

      const result = await mongoDBClient.findFilesInDB({
        fileSize: { $gt: 1000 },
      });
      expect(result).toEqual(mockFiles);
      expect(findMock).toHaveBeenCalledWith({ fileSize: { $gt: 1000 } });
    });

    it("should throw an error if an error occurs", async () => {
      const findMock = jest
        .fn()
        .mockRejectedValueOnce(new Error("Database error"));
      (FileMetadata.find as jest.Mock) = findMock;

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(
        mongoDBClient.findFilesInDB({ fileSize: { $gt: 1000 } })
      ).rejects.toThrow("Failed to find files.");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error searching files in the database:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("findAllFilesInDB", () => {
    it("should fetch all file metadata", async () => {
      const mockFiles = [
        { fileName: "test1.txt", fileSize: 1024 },
        { fileName: "test2.txt", fileSize: 2048 },
      ];
      const findMock = jest.fn().mockResolvedValueOnce(mockFiles);
      (FileMetadata.find as jest.Mock) = findMock;

      const result = await mongoDBClient.findAllFilesInDB();
      expect(result).toEqual(mockFiles);
      expect(findMock).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if an error occurs", async () => {
      const findMock = jest
        .fn()
        .mockRejectedValueOnce(new Error("Database error"));
      (FileMetadata.find as jest.Mock) = findMock;

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(mongoDBClient.findAllFilesInDB()).rejects.toThrow(
        "Failed to retrieve all files."
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching all files from the database:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("updateFileMetadataInDB", () => {
    it("should update file metadata successfully", async () => {
      const mockUpdatedMetadata = {
        fileName: "test.txt",
        fileExtension: ".txt",
        fileSize: 2048,
      };
      const findOneAndUpdateMock = jest
        .fn()
        .mockResolvedValueOnce(mockUpdatedMetadata);
      (FileMetadata.findOneAndUpdate as jest.Mock) = findOneAndUpdateMock;

      const result = await mongoDBClient.updateFileMetadataInDB(
        "test.txt",
        ".txt",
        2048
      );
      expect(result).toEqual(mockUpdatedMetadata);
      expect(findOneAndUpdateMock).toHaveBeenCalledWith(
        { fileName: "test.txt" },
        { fileExtension: ".txt", fileSize: 2048 },
        { new: true }
      );
    });

    it("should throw an error if update fails", async () => {
      const findOneAndUpdateMock = jest
        .fn()
        .mockRejectedValueOnce(new Error("Database error"));
      (FileMetadata.findOneAndUpdate as jest.Mock) = findOneAndUpdateMock;

      await expect(
        mongoDBClient.updateFileMetadataInDB("test.txt", ".txt", 2048)
      ).rejects.toThrow("Failed to update file metadata.");
    });
  });

  describe("deleteFileMetadataInDB", () => {
    it("should delete file metadata successfully", async () => {
      const deleteOneMock = jest.fn().mockResolvedValueOnce(null);
      (FileMetadata.deleteOne as jest.Mock) = deleteOneMock;

      await mongoDBClient.deleteFileMetadataInDB("test.txt");
      expect(deleteOneMock).toHaveBeenCalledWith({ fileName: "test.txt" });
    });

    it("should throw an error if delete fails", async () => {
      const deleteOneMock = jest
        .fn()
        .mockRejectedValueOnce(new Error("Database error"));
      (FileMetadata.deleteOne as jest.Mock) = deleteOneMock;

      await expect(
        mongoDBClient.deleteFileMetadataInDB("test.txt")
      ).rejects.toThrow("Failed to delete file metadata.");
    });

    it("should log a success message if delete is successful", async () => {
      const deleteOneMock = jest.fn().mockResolvedValueOnce(null);
      (FileMetadata.deleteOne as jest.Mock) = deleteOneMock;

      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      await mongoDBClient.deleteFileMetadataInDB("test.txt");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "File metadata for test.txt deleted successfully."
      );

      consoleLogSpy.mockRestore();
    });
  });
});
