import { instrumentationInitializetion } from "./instrumentation/instrumentationTracing";
//Open Telemetry Initialization
instrumentationInitializetion();

import { connectToDatabase } from "./dbConnection/dbConnection";
import dotenv from "dotenv";
import express from "express";
import fileRoutes from "./routes/fileRouters";
import logger from "./logger/logger";
import path from "path";
import { setupMetrics } from "./containers-monitoring/metrics";

export const app = express();
const router = express.Router();

dotenv.config({
  path: path.join(__dirname, "../config/config.env"),
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

connectToDatabase();

app.use("/api/v1", fileRoutes(router));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  logger.info(`Server is running on http://localhost:${port}`);
});
