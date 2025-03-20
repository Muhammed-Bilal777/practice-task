import { IMinioClient } from "./interfaces/IMinioClient";
import minioClient from "../minio/minioClient";
import { trace } from "@opentelemetry/api";

export class MinioClient implements IMinioClient {
  async checkFileExists(
    bucketName: string,
    filename: string
  ): Promise<boolean> {
    const tracer = trace.getTracer("node-app");
    const span = tracer.startSpan("minio.checkFileExists");

    try {
      span.setAttribute("minio.bucketName", bucketName);
      span.setAttribute("minio.filename", filename);
      await minioClient.statObject(bucketName, filename);
      return true;
    } catch (err) {
      return false;
    } finally {
      span.setAttribute("service.name", "minio"); // Set service name attribute
      span.end(); // End the span
    }
  }

  async uploadFileToMinio(
    bucketName: string,
    filename: string,
    fileBuffer: Buffer
  ): Promise<void> {
    const tracer = trace.getTracer("node-app");
    const span = tracer.startSpan("minio.uploadFile");

    try {
      span.setAttribute("minio.bucketName", bucketName);
      span.setAttribute("minio.filename", filename);
      await minioClient.putObject(bucketName, filename, fileBuffer);
      console.log(`File "${filename}" uploaded successfully.`);
    } catch (error: unknown) {
      console.error(error);
      console.error(`Error uploading file "${filename}":`, error);
      throw new Error(`Failed to upload file ${filename}`);
    } finally {
      span.setAttribute("service.name", "minio"); // Set service name attribute
      span.end(); // End the span
    }
  }

  async getFileFromMinio(
    bucketName: string,
    objectName: string
  ): Promise<NodeJS.ReadableStream | null> {
    const tracer = trace.getTracer("node-app");
    const span = tracer.startSpan("minio.getFile");

    try {
      span.setAttribute("minio.bucketName", bucketName);
      span.setAttribute("minio.objectName", objectName);
      const stream = await minioClient.getObject(bucketName, objectName);
      return stream;
    } catch (error) {
      console.error(`Error fetching file "${objectName}":`, error);
      throw new Error("File not found.");
    } finally {
      span.setAttribute("service.name", "minio"); // Set service name attribute
      span.end(); // End the span
    }
  }

  async removeFileFromMinio(
    bucketName: string,
    filename: string
  ): Promise<void> {
    const tracer = trace.getTracer("node-app");
    const span = tracer.startSpan("minio.removeFile");

    try {
      span.setAttribute("minio.bucketName", bucketName);
      span.setAttribute("minio.filename", filename);
      await minioClient.removeObject(bucketName, filename);
      console.log(`File "${filename}" removed from MinIO`);
    } catch (error) {
      console.error(`Error removing file: ${filename} from MinIO`, error);
      throw error;
    } finally {
      span.setAttribute("service.name", "minio"); // Set service name attribute
      span.end(); // End the span
    }
  }
}

export const minioClientInstance = new MinioClient();
// import { IMinioClient } from "./interfaces/IMinioClient";
// import minioClient from "../minio/minioClient";

// export class MinioClient implements IMinioClient {
//   async checkFileExists(
//     bucketName: string,
//     filename: string
//   ): Promise<boolean> {
//     try {
//       await minioClient.statObject(bucketName, filename);
//       return true;
//     } catch (err) {
//       return false;
//     }
//   }

//   async uploadFileToMinio(
//     bucketName: string,
//     filename: string,
//     fileBuffer: Buffer
//   ): Promise<void> {
//     try {
//       await minioClient.putObject(bucketName, filename, fileBuffer);
//       console.log(`File "${filename}" uploaded successfully.`);
//     } catch (error: unknown) {
//       console.error(error);
//       console.error(`Error uploading file "${filename}":`, error);
//       throw new Error(`Failed to upload file ${filename}`);
//     }
//   }

//   async getFileFromMinio(
//     bucketName: string,
//     objectName: string
//   ): Promise<NodeJS.ReadableStream | null> {
//     try {
//       const stream = await minioClient.getObject(bucketName, objectName);
//       return stream;
//     } catch (error) {
//       console.error(`Error fetching file "${objectName}":`, error);
//       throw new Error("File not found.");
//     }
//   }
//   async removeFileFromMinio(
//     bucketName: string,
//     filename: string
//   ): Promise<void> {
//     try {
//       await minioClient.removeObject(bucketName, filename);
//       console.log(`File "${filename}" removed from Minio`);
//     } catch (error) {
//       console.error(`Error removing file: ${filename} from Minio`, error);
//       throw error;
//     }
//   }
// }
// export const minioClientInstance = new MinioClient();
