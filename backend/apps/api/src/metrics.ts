import { Request, Response, NextFunction } from "express";
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";

const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// HTTP metrics
export const httpRequestDuration = new Histogram({
  name: "aegis_http_request_duration_seconds",
  help: "HTTP request latency in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const httpRequestCount = new Counter({
  name: "aegis_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// Alert metrics
export const activeAlertCount = new Gauge({
  name: "aegis_active_alerts",
  help: "Current number of firing alerts",
  registers: [register],
});

export const alertProcessedCount = new Counter({
  name: "aegis_alerts_processed_total",
  help: "Total alerts processed",
  labelNames: ["severity"],
  registers: [register],
});

// Accessibility metrics
export const accessibilityIssueCount = new Gauge({
  name: "aegis_accessibility_issues",
  help: "Current number of open accessibility issues",
  registers: [register],
});

export const accessibilityReportCount = new Counter({
  name: "aegis_accessibility_reports_ingested_total",
  help: "Total accessibility reports ingested",
  registers: [register],
});

// Correlation metrics
export const correlationSnapshotCount = new Counter({
  name: "aegis_correlation_snapshots_generated_total",
  help: "Total correlation snapshots generated",
  labelNames: ["source"],
  registers: [register],
});

export const alertNoiseReduction = new Gauge({
  name: "aegis_alert_noise_reduction_percent",
  help: "Percentage of alert noise reduction through correlation",
  registers: [register],
});

export const correlationDuration = new Histogram({
  name: "aegis_correlation_duration_seconds",
  help: "Time taken to correlate alerts",
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// Worker metrics
export const workerHealthStatus = new Gauge({
  name: "aegis_worker_health",
  help: "Worker health status (1=healthy, 0.5=degraded, 0=unknown)",
  registers: [register],
});

export const workerConsecutiveFailures = new Gauge({
  name: "aegis_worker_consecutive_failures",
  help: "Number of consecutive worker failures",
  registers: [register],
});

export const workerHeartbeatCount = new Counter({
  name: "aegis_worker_heartbeats_total",
  help: "Total worker heartbeats received",
  labelNames: ["status"],
  registers: [register],
});

// Middleware to track HTTP metrics
export function metricsMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  const route = request.route?.path ?? request.path;

  // Capture response finish
  response.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(request.method, route, String(response.statusCode)).observe(duration);
    httpRequestCount.labels(request.method, route, String(response.statusCode)).inc();
  });

  next();
}

// Utility to get metrics in Prometheus format
export async function getMetrics(): Promise<string> {
  return await register.metrics();
}

// Utility to get registry
export function getRegistry(): Registry {
  return register;
}
