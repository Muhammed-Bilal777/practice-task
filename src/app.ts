import express, { Request, Response } from "express";

import connectDB from "./dbConnection/dbConnection";
import dotenv from "dotenv";
import fileRoutes from "./routes/fileRouters";
import logger from "./logger/logger";
import { setupMetrics } from "./containers-monitoring/metrics";

const app = express();
const router = express.Router();

dotenv.config({
  path: "./config/config.env",
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});

const port = process.env.EXPRESS_SERVER_PORT;

//health monitoring
setupMetrics(app);

//database connection
connectDB();

//Routes
app.use("/api/v1", fileRoutes(router));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  logger.info(`Server is running on http://localhost:${port}`);
});
