import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config({
  path: "config/config.env",
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;