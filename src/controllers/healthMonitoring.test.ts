import { app } from "../app";
import request from "supertest";

describe("health monitoring", () => {
  it("should return status of health", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.status).toBe(200);
  });
});
