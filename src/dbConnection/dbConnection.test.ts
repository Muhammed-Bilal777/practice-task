import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({
  path: "config/config.env",
});
const MONGO_URI = process.env.MONGO_URI;

beforeAll(async () => {
  await mongoose.connect(MONGO_URI as string);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("mongoDB database", () => {
  it("should connect to mongoDB database server", async () => {
    const connectionState = mongoose.connection.readyState;
    expect(connectionState).toBe(1);
  });
});
