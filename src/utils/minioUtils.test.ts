import { MinioClient } from "./minioUtils";
import minioClient from "../minio/minioClient";

jest.mock("../../minio/minioClient", () => ({
  statObject: jest.fn(),
  putObject: jest.fn(),
  getObject: jest.fn(),
  removeObject: jest.fn(),
}));

describe("MinioClient", () => {
  let minioClientInstance: MinioClient;

  beforeEach(() => {
    minioClientInstance = new MinioClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("checkFileExists", () => {
    it("should return true if the file exists", async () => {
      (minioClient.statObject as jest.Mock).mockResolvedValueOnce(true);

      const result = await minioClientInstance.checkFileExists(
        "bucket",
        "file.txt"
      );

      expect(result).toBe(true);
      expect(minioClient.statObject).toHaveBeenCalledWith("bucket", "file.txt");
    });

    it("should return false if the file does not exist", async () => {
      (minioClient.statObject as jest.Mock).mockRejectedValueOnce(
        new Error("File not found")
      );

      const result = await minioClientInstance.checkFileExists(
        "bucket",
        "file.txt"
      );

      expect(result).toBe(false);
      expect(minioClient.statObject).toHaveBeenCalledWith("bucket", "file.txt");
    });
  });

  describe("uploadFileToMinio", () => {
    it("should upload file successfully", async () => {
      (minioClient.putObject as jest.Mock).mockResolvedValueOnce(true);

      const buffer = Buffer.from("Test file content");

      await minioClientInstance.uploadFileToMinio("bucket", "file.txt", buffer);

      expect(minioClient.putObject).toHaveBeenCalledWith(
        "bucket",
        "file.txt",
        buffer
      );
    });

    it("should throw error if file upload fails", async () => {
      (minioClient.putObject as jest.Mock).mockRejectedValueOnce(
        new Error("Upload failed")
      );

      const buffer = Buffer.from("Test file content");

      await expect(
        minioClientInstance.uploadFileToMinio("bucket", "file.txt", buffer)
      ).rejects.toThrow('Failed to upload file "file.txt"');
    });
  });

  describe("getFileFromMinio", () => {
    it("should return file stream if file exists", async () => {
      const mockStream = {} as NodeJS.ReadableStream;
      (minioClient.getObject as jest.Mock).mockResolvedValueOnce(mockStream);

      const result = await minioClientInstance.getFileFromMinio(
        "bucket",
        "file.txt"
      );

      expect(result).toBe(mockStream);
      expect(minioClient.getObject).toHaveBeenCalledWith("bucket", "file.txt");
    });

    it("should throw error if file does not exist", async () => {
      (minioClient.getObject as jest.Mock).mockRejectedValueOnce(
        new Error("File not found")
      );

      await expect(
        minioClientInstance.getFileFromMinio("bucket", "file.txt")
      ).rejects.toThrow("File not found.");
    });
  });

  describe("removeFileFromMinio", () => {
    it("should remove file successfully", async () => {
      (minioClient.removeObject as jest.Mock).mockResolvedValueOnce(true);

      await minioClientInstance.removeFileFromMinio("bucket", "file.txt");

      expect(minioClient.removeObject).toHaveBeenCalledWith(
        "bucket",
        "file.txt"
      );
    });

    it("should throw error if file removal fails", async () => {
      (minioClient.removeObject as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to remove file")
      );

      await expect(
        minioClientInstance.removeFileFromMinio("bucket", "file.txt")
      ).rejects.toThrow("Failed to remove file: file.txt from Minio");
    });
  });
});
