import { Client } from "minio";
import dotenv from "dotenv";

dotenv.config({
  path: "./config/config.env",
});

const minioClient = new Client({
  endPoint: (process.env.MINIO_END_POINT as string) || "minio",
  port: Number(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY as string,
  secretKey: process.env.MINIO_SECRET_KEY as string,
});

export default minioClient;
