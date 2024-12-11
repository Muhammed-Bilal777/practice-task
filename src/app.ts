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

const port = process.env.EXPRESS_SERVER_PORT;

//health monitoring
setupMetrics(app);

connectDB();

app.use("/api/v1", fileRoutes(router));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  logger.info(`Server is running on http://localhost:${port}`);
});
