import * as promClient from "prom-client";

import { Express } from "express";

export function setupMetrics(app: Express): void {
  const httpRequestsTotal = new promClient.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "status_code", "path"],
  });

  promClient.register.registerMetric(httpRequestsTotal);

  app.use((req, res, next) => {
    res.on("finish", () => {
      httpRequestsTotal.inc({
        method: req.method,
        status_code: res.statusCode,
        path: req.path,
      });
    });
    next();
  });

  app.get("/metrics", async (req, res) => {
    res.set("Content-Type", promClient.register.contentType);
    res.end(await promClient.register.metrics());
  });
}
