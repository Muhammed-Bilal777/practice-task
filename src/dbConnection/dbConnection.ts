import dotenv from "dotenv";
import mongoose from "mongoose";
import { ReadPreference } from "mongodb"; // Import ReadPreference

dotenv.config({
  path: "config/config.env",
});

const options = {
  maxPoolSize: 100, // Set the maximum number of connections in the pool
  minPoolSize: 50, // Ensure at least 5 connections are maintained
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Timeout for idle sockets
  connectTimeoutMS: 10000, // Timeout for initial connection
};

console.log("starting mongo db");
export async function connectToDatabase() {
  const uri = process.env.MONGO_URI;

  console.log("starting mongo db server function", uri);

  console.log("starting mongo db server function");
  if (!uri) {
    throw new Error("Mongo URI is not defined in the environment variables");
  }
  try {
    await mongoose
      .connect(uri, options)
      .then(() => {
        const client = mongoose.connection.getClient();
      })
      .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
      });
    console.log("Connected to MongoDB");
  } catch (e: any) {
    console.error("Error connecting to MongoDB:", e);
    console.log(e.message);
  }
}
