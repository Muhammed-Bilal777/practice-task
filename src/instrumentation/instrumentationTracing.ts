import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";

import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import {
  ExpressInstrumentation,
  ExpressLayerType,
} from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { MongooseInstrumentation } from "@opentelemetry/instrumentation-mongoose";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { Resource } from "@opentelemetry/resources";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { IORedisInstrumentation } from "@opentelemetry/instrumentation-ioredis";
export const instrumentationInitializetion = () => {
  console.log("OpenTelemetry started here");

  const traceExporter = new ZipkinExporter({
    url: "http://zipkin:9411/api/v2/spans",
    serviceName: "node-app",
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: "node-app",
    }),
    traceExporter,
    instrumentations: [
      new ExpressInstrumentation({
        ignoreLayers: [
          /^\/_internal\//,
          /^\/binary$/,
          "/health",
          "/metrics",
          /^\/health$/,
          /^\/metrics$/,
        ],
        ignoreLayersType: [
          ExpressLayerType.MIDDLEWARE,
          ExpressLayerType.REQUEST_HANDLER,
          ExpressLayerType.ROUTER,
        ],

        requestHook: (span, req) => {
          console.log(span, "------------from EXPRESS--------------------");
          console.log(req, "--------------------from EXPRESS----------------");
          // Check if the HTTP request is a POST and if the service is 'node-app'
          const expressReq = req as any; // Cast to 'any' to access 'method' and 'url'

          if (expressReq.method === "POST" && expressReq.url === "/") {
            console.log("Ignoring POST request to /api/v1/binary");
            span.end(); // End the span to prevent it from being exported
            return; // Do not proceed with this span
          }
        },
      }),
      new HttpInstrumentation({
        ignoreIncomingRequestHook(req: any) {
          const isStaticAsset = !!req.url.match(/^\/static\/.*$/);
          const isMetricsEndpoint = !!req.url.match(/^\/metrics$/);
          return isStaticAsset || isMetricsEndpoint;
        },

        requestHook: (span, req) => {
          // Check if the HTTP request is a POST and if the service is 'node-app'
          const expressReq = req as any; // Cast to 'any' to access 'method' and 'url'
          console.log(
            span,
            "----------------from HTTTP ----------------------------"
          );
          console.log(req, "-----------------from HTTTP----------------------");
          if (expressReq.method === "POST" && expressReq.url === "/") {
            console.log("Ignoring POST request to /api/v1/binary");
            span.end(); // End the span to prevent it from being exported
            return; // Do not proceed with this span
          }
        },
      }),
      new MongooseInstrumentation({
        requireParentSpan: true,
        responseHook: (span: any) => {
          span.setAttribute("service.name", `mongo`);
          const dbOperation = span.attributes["db.operation"];

          if (dbOperation) {
            span.setAttribute("mongo.operation", dbOperation);
          }
        },
      }),
      new IORedisInstrumentation({
        requireParentSpan: true,
        requestHook: (span: any) => {
          span.setAttribute("service.name", "redis");
          const redisCommand = span.attributes["db.statement"]?.split(" ")[0];
          if (redisCommand) {
            span.setAttribute("redis.method", redisCommand);
          }
        },
      }),
    ],
  });

  sdk.start();

  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch((error) => console.error("Error terminating tracing:", error))
      .finally(() => process.exit(0));
  });

  console.log("OpenTelemetry ended here after initialization done");
};
