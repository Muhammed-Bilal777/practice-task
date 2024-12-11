import LokiTransport from "winston-loki";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/app.log" }),
    new LokiTransport({
      host: "http://loki:3100",
      labels: { job: "node-app" },
      json: true,
    }),
  ],
});

export default logger;
