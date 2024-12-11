import { Request, Response } from "express";

import logger from "../logger/logger";

const monitoringHealth = async (req: Request, res: Response): Promise<void> => {
  logger.info("healthy");
  res.status(200).json({ status: "healthy" });
};
export default monitoringHealth;
