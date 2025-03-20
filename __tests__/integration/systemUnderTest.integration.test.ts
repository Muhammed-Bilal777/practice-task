import { app } from "../../src/app";
import mongoose from "mongoose";
import path from "path";
import request from "supertest";

describe.only("Integration Test: System End-to-End Functionality", () => {
  it("should upload a file successfully and save metadata", async () => {
    const filename = "node.png";
    const filePath = path.join(__dirname, filename);

    const uploadResponse = await request(app)
      .post("/api/v1/binary")
      .attach("file", filePath, filename);

    expect(uploadResponse.status).toBe(201);
    expect(uploadResponse.body.message).toBe("File uploaded successfully");
    expect(uploadResponse.headers["content-type"]).toMatch(/application\/json/);
  });

  it("should return the uploaded file from database", async () => {
    const fileName = "node.png";

    const getFile = await request(app)
      .get("/api/v1/binary/files")
      .query({ fileName });

    expect(getFile.status).toBe(200);
    expect(getFile.headers["content-type"]).toMatch(/application\/json/);
  });

  it("should return the single file from database based on file name", async () => {
    const filename = "node.png";

    const getFile = await request(app).get(`/api/v1/binary/files/${filename}`);

    expect(getFile.status).toBe(200);
  });

  it("should return all the files from database", async () => {
    const getAllFiles = await request(app).get("/api/v1/binary/files");

    expect(getAllFiles.status).toBe(200);
    expect(getAllFiles.headers["content-type"]).toMatch(/application\/json/);
  });

  it("should update the file", async () => {
    const filename = "node.png";
    const filePath = path.join(__dirname, filename);

    const uploadResponse = await request(app)
      .put("/api/v1/binary")
      .attach("file", filePath, filename);

    expect(uploadResponse.status).toBe(200);
    expect(uploadResponse.headers["content-type"]).toMatch(/application\/json/);
  });

  it("should delete the file based on file name", async () => {
    const fileName = "node.png";

    const response = await request(app)
      .delete("/api/v1/binary")
      .query({ fileName });
    expect(response.status).toBe(200);
  });

  it("should check health status of the app", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("healthy");
  });
});
