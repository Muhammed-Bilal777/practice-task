import * as promClient from "prom-client";
import { Express } from "express";
import * as os from "os";
import * as fs from "fs";
import * as si from "systeminformation";
export function setupMetrics(app: Express): void {
  const httpRequestsTotal = new promClient.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "status_code", "path"],
  });

  promClient.register.registerMetric(httpRequestsTotal);

  const memoryUsageGauge = new promClient.Gauge({
    name: "node_memory_usage_mb",
    help: "Memory usage in MB",
  });

  const cpuUsageGauge = new promClient.Gauge({
    name: "node_cpu_usage_percentage",
    help: "CPU usage percentage",
  });

  const diskUsageGauge = new promClient.Gauge({
    name: "node_disk_usage_percentage",
    help: "Disk usage percentage",
  });

  // Middleware to count HTTP requests
  app.use((req, res, next) => {
    res.on("finish", () => {
      httpRequestsTotal.inc({
        method: req.method,
        status_code: res.statusCode.toString(),
        path: req.path,
      });
    });
    next();
  });

  //Function to update memory, CPU, and disk metrics
  const updateMetrics = () => {
    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageInMB = memoryUsage.heapUsed / (1024 * 1024);

    // Update the gauge with memory usage in MB
    memoryUsageGauge.set(memoryUsageInMB);

    // CPU usage
    const cpuUsage = os.loadavg()[0];
    cpuUsageGauge.set(cpuUsage);

    // Disk usage
    const diskUsage = getDiskUsage();
    diskUsageGauge.set(diskUsage);
  };

  // Function to get disk usage percentage
  const getDiskUsage = () => {
    const { execSync } = require("child_process");
    try {
      const output = execSync("df / --output=pcent").toString();
      const percentage = parseInt(
        output.split("\n")[1].trim().replace("%", "")
      );
      return percentage;
    } catch (error) {
      console.error("Error getting disk usage:", error);
      return 0;
    }
  };

  // Update metrics every 1 seconds
  setInterval(updateMetrics, 1000);

  // Metrics endpoint
  app.get("/metrics", async (req, res) => {
    res.set("Content-Type", promClient.register.contentType);
    res.end(await promClient.register.metrics());
  });
}
