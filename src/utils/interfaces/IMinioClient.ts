export interface IMinioClient {
  checkFileExists(bucketName: string, filename: string): Promise<boolean>;
  uploadFileToMinio(
    bucketName: string,
    filename: string,
    fileBuffer: Buffer
  ): Promise<void>;
  getFileFromMinio(
    bucketName: string,
    objectName: string
  ): Promise<NodeJS.ReadableStream | null>;
}
