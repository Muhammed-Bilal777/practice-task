import { Client } from "minio";
import dotenv from "dotenv";

jest.mock("minio", () => ({
  Client: jest.fn().mockImplementation(() => ({
    someMethod: jest.fn(),
  })),
}));

jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

describe("Minio Client Initialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MINIO_END_POINT = "localhost";
    process.env.MINIO_PORT = "9000";
    process.env.MINIO_ACCESS_KEY = "test-access-key";
    process.env.MINIO_SECRET_KEY = "test-secret-key";
  });

  it("should correctly initialize the minioClient with the environment variables", () => {
    require("../../minio/minioClient");

    expect(dotenv.config).toHaveBeenCalledWith({
      path: "./config/config.env",
    });

    expect(Client).toHaveBeenCalledWith({
      endPoint: "localhost",
      port: 9000,
      useSSL: false,
      accessKey: "test-access-key",
      secretKey: "test-secret-key",
    });
  });
});
