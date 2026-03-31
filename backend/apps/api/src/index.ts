import { randomUUID } from "crypto";

import {
  calculateMarginSnapshot,
  correlateAlerts,
  flattenOpenAccessibilityIssues,
  instruments,
  type AccessibilityIssue,
  type AccessibilityReport,
  type AccessibilitySeverity,
  type AlertSeverity,
  type AlertStatus,
  type CorrelationSnapshot,
  type Instrument,
  type MonitoringAlert,
} from "../../../packages/correlation/src";
import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

import {
  appendAccessibilityReports,
  appendMonitoringAlerts,
  prepareStorage,
  readAccessibilityReports,
  readCorrelationSnapshots,
  readDailyMargins,
  readLatestCorrelationSnapshot,
  readMarketWatch,
  readMonitoringAlerts,
  readWorkerState,
  resetRuntimeFromSeed,
  saveCorrelationSnapshot,
  storagePaths,
  updateWorkerState,
  type WorkerState,
} from "./store";
import { startScraperPolling, getCachedPrices } from "./mcxScraper";
import {
  metricsMiddleware,
  getMetrics,
  activeAlertCount,
  accessibilityIssueCount,
  alertProcessedCount,
  accessibilityReportCount,
  correlationSnapshotCount,
  alertNoiseReduction,
  correlationDuration,
  workerHealthStatus,
  workerConsecutiveFailures,
  workerHeartbeatCount,
} from "./metrics";

type JsonRecord = Record<string, unknown>;
type AsyncRouteHandler = (request: Request, response: Response) => Promise<void>;

const app = express();
const port = Number(process.env.PORT ?? 3000);
const knownInstruments = new Set<string>(instruments);
const validAlertSeverities = new Set<AlertSeverity>(["critical", "high", "medium", "low"]);
const validAlertStatuses = new Set<AlertStatus>(["firing", "resolved"]);
const validAccessibilitySeverities = new Set<AccessibilitySeverity>([
  "critical",
  "serious",
  "moderate",
  "minor",
]);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use((_request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  next();
});
app.use(metricsMiddleware);

app.get(
  "/metrics",
  asyncRoute(async (_request, response) => {
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    const metrics = await getMetrics();
    response.send(metrics);
  }),
);

app.get(
  "/health",
  asyncRoute(async (_request, response) => {
    const [workerState, latestSnapshot, reports, alerts] = await Promise.all([
      readWorkerState(),
      readLatestCorrelationSnapshot(),
      readAccessibilityReports(),
      readMonitoringAlerts(),
    ]);

    const firingAlerts = alerts.filter((alert) => alert.status === "firing");
    const openIssues = flattenOpenAccessibilityIssues(reports);

    // Update metrics
    activeAlertCount.set(firingAlerts.length);
    accessibilityIssueCount.set(openIssues.length);
    if (latestSnapshot) {
      alertNoiseReduction.set(latestSnapshot.stats.alertNoiseReduction);
    }
    if (workerState.status === "healthy") {
      workerHealthStatus.set(1);
      workerConsecutiveFailures.set(0);
    } else if (workerState.status === "degraded") {
      workerHealthStatus.set(0.5);
    } else {
      workerHealthStatus.set(0);
    }

    response.json({
      status: "ok",
      runtimeStorage: storagePaths.runtimeRoot,
      activeAlerts: firingAlerts.length,
      openAccessibilityIssues: openIssues.length,
      latestCorrelationGeneratedAt: latestSnapshot?.generatedAt ?? null,
      worker: workerState,
    });
  }),
);

app.get(
  "/api/dashboard",
  asyncRoute(async (_request, response) => {
    const [
      marginRecords,
      marketWatch,
      accessibilityReports,
      monitoringAlerts,
      workerState,
      latestSnapshot,
    ] = await Promise.all([
      readDailyMargins(),
      readMarketWatch(),
      readAccessibilityReports(),
      readMonitoringAlerts(),
      readWorkerState(),
      readLatestCorrelationSnapshot(),
    ]);

    const dailyMargins = marginRecords.map(calculateMarginSnapshot);
    const openIssues = flattenOpenAccessibilityIssues(accessibilityReports);
    const activeAlerts = monitoringAlerts.filter((alert) => alert.status === "firing");

    response.json({
      generatedAt: new Date().toISOString(),
      marginFormula:
        "Total = Initial + ELM + Tender + Delivery + Add L/S + Spec L/S + Daily Vol + Annual Vol",
      market: {
        dailyMargins,
        marketWatch,
      },
      accessibility: {
        reportCount: accessibilityReports.length,
        latestReport: accessibilityReports[0] ?? null,
        openIssueCount: openIssues.length,
        openIssues,
      },
      monitoring: {
        activeAlertCount: activeAlerts.length,
        alerts: activeAlerts,
      },
      correlation: latestSnapshot,
      worker: workerState,
      links: {
        health: "/health",
        dailyMargins: "/api/market/daily-margins",
        marketWatch: "/api/market/watch",
        accessibilityReports: "/api/accessibility/reports",
        monitoringAlerts: "/api/monitoring/alerts",
        latestCorrelation: "/api/correlation/latest",
      },
    });
  }),
);

app.get(
  "/api/market/daily-margins",
  asyncRoute(async (request, response) => {
    const instrument = parseInstrument(request.query.instrument);
    const dailyMargins = (await readDailyMargins()).map(calculateMarginSnapshot);
    const filteredMargins = instrument
      ? dailyMargins.filter((margin) => margin.instrument === instrument)
      : dailyMargins;

    response.json({
      count: filteredMargins.length,
      items: filteredMargins,
    });
  }),
);

app.get(
  "/api/market/watch",
  asyncRoute(async (request, response) => {
    const instrument = parseInstrument(request.query.instrument);
    const marketWatch = await readMarketWatch();
    const filteredEntries = instrument
      ? marketWatch.filter((entry) => entry.instrument === instrument)
      : marketWatch;

    response.json({
      count: filteredEntries.length,
      items: filteredEntries,
    });
  }),
);

app.get(
  "/api/accessibility/reports",
  asyncRoute(async (request, response) => {
    const reports = await readAccessibilityReports();
    const latestOnly = request.query.latest === "true";

    response.json({
      count: latestOnly ? Math.min(reports.length, 1) : reports.length,
      items: latestOnly ? reports.slice(0, 1) : reports,
    });
  }),
);

app.get(
  "/api/accessibility/issues",
  asyncRoute(async (_request, response) => {
    const reports = await readAccessibilityReports();
    const openIssues = flattenOpenAccessibilityIssues(reports);

    response.json({
      count: openIssues.length,
      items: openIssues,
    });
  }),
);

app.post(
  "/api/accessibility/reports",
  asyncRoute(async (request, response) => {
    const reports = arrayify(request.body).map((entry, index) =>
      normalizeAccessibilityReport(entry, index),
    );

    if (reports.length === 0) {
      throw new Error("At least one accessibility report is required.");
    }

    await appendAccessibilityReports(reports);
    accessibilityReportCount.inc();
    const latestSnapshot = await computeAndPersistSnapshot("api-ingest");

    response.status(201).json({
      ingested: reports.length,
      items: reports,
      latestCorrelation: latestSnapshot,
    });
  }),
);

app.get(
  "/api/monitoring/alerts",
  asyncRoute(async (request, response) => {
    const statusFilter = parseAlertStatusFilter(request.query.status);
    const alerts = await readMonitoringAlerts();
    const filteredAlerts = statusFilter
      ? alerts.filter((alert) => alert.status === statusFilter)
      : alerts;

    response.json({
      count: filteredAlerts.length,
      items: filteredAlerts,
    });
  }),
);

app.post(
  "/api/monitoring/alerts",
  asyncRoute(async (request, response) => {
    const alerts = arrayify(request.body).map((entry, index) =>
      normalizeMonitoringAlert(entry, index),
    );

    if (alerts.length === 0) {
      throw new Error("At least one monitoring alert is required.");
    }

    await appendMonitoringAlerts(alerts);
    
    // Track metrics for each severity
    for (const alert of alerts) {
      alertProcessedCount.labels(alert.severity).inc();
    }
    
    const latestSnapshot = await computeAndPersistSnapshot("api-ingest");

    response.status(201).json({
      ingested: alerts.length,
      items: alerts,
      latestCorrelation: latestSnapshot,
    });
  }),
);

app.get(
  "/api/correlation/snapshots",
  asyncRoute(async (_request, response) => {
    const snapshots = await readCorrelationSnapshots();
    response.json({
      count: snapshots.length,
      items: snapshots,
    });
  }),
);

app.get(
  "/api/correlation/latest",
  asyncRoute(async (_request, response) => {
    const latestSnapshot = await readLatestCorrelationSnapshot();
    response.json({
      item: latestSnapshot,
    });
  }),
);

app.post(
  "/api/correlation/recompute",
  asyncRoute(async (_request, response) => {
    const snapshot = await computeAndPersistSnapshot("manual-recompute");
    response.status(201).json(snapshot);
  }),
);

app.post(
  "/api/correlation/snapshots",
  asyncRoute(async (request, response) => {
    const snapshot = normalizeCorrelationSnapshot(request.body);
    await saveCorrelationSnapshot(snapshot);

    response.status(201).json(snapshot);
  }),
);

app.post(
  "/api/worker/heartbeat",
  asyncRoute(async (request, response) => {
    const payload = asRecord(request.body, "worker heartbeat");
    const status = parseWorkerStatus(payload.status);
    const nextWorkerState = await updateWorkerState({
      status,
      apiBaseUrl: readOptionalString(payload.apiBaseUrl),
      pollIntervalMs: readOptionalNumber(payload.pollIntervalMs),
      lastHeartbeatAt: new Date().toISOString(),
      lastRunAt: readOptionalString(payload.lastRunAt),
      lastCorrelationId: readOptionalString(payload.lastCorrelationId),
      lastError: readOptionalString(payload.lastError),
    });

    // Track worker metrics
    workerHeartbeatCount.labels(status).inc();
    if (status === "healthy") {
      workerHealthStatus.set(1);
      workerConsecutiveFailures.set(0);
    } else if (status === "degraded") {
      workerHealthStatus.set(0.5);
    }

    response.json(nextWorkerState);
  }),
);

app.post(
  "/api/demo/reseed",
  asyncRoute(async (_request, response) => {
    await resetRuntimeFromSeed();
    const workerState = await updateWorkerState({
      status: "idle",
      apiBaseUrl: null,
      pollIntervalMs: null,
      lastHeartbeatAt: null,
      lastRunAt: null,
      lastCorrelationId: null,
      lastError: null,
    });
    const snapshot = await computeAndPersistSnapshot("bootstrap");

    response.status(201).json({
      message: "Runtime storage reset from seed data.",
      worker: workerState,
      latestCorrelation: snapshot,
    });
  }),
);



app.get(
  "/api/mcx/live",
  asyncRoute(async (_request, response) => {
    const cached = getCachedPrices();
    if (Object.keys(cached).length > 0) {
      response.json(cached);
      return;
    }

    const watch = await readMarketWatch();
    const symbolMap: Record<string, string> = {
      ALUMINI: "ALUMINIUM",
    };
    const fallback: Record<string, unknown> = {};
    const now = new Date().toISOString();

    for (const entry of watch) {
      const baseSymbol = symbolMap[entry.instrument] ?? entry.instrument;
      const normalizedSymbol = baseSymbol.toUpperCase();
      const rawPrice = Number(entry.frontMonthPrice ?? 0);
      if (!Number.isFinite(rawPrice) || rawPrice <= 0) {
        continue;
      }

      // Keep units aligned with UI: GOLD/SILVER should always be INR per gram.
      let normalizedLtp = rawPrice;
      let normalizedUnit = "exchange-quoted";
      if (normalizedSymbol === "GOLD") {
        normalizedLtp = rawPrice / 10;
        normalizedUnit = "INR/g";
      } else if (normalizedSymbol === "SILVER") {
        normalizedLtp = rawPrice / 1000;
        normalizedUnit = "INR/g";
      }

      fallback[normalizedSymbol] = {
        symbol: normalizedSymbol,
        ltp: normalizedLtp,
        normalizedUnit,
        changePercent: Number(entry.changePercent ?? 0),
        volume: Number(entry.volume ?? 0),
        updatedAt: now,
        source: "market-watch-fallback",
      };
    }

    response.json(fallback);
  }),
);

app.get("/", (_request, response) => {
  response.json({
    message: "Aegis-MCX API. Use /api/* endpoints or run React frontend separately at http://localhost:5173",
    health: "/health",
    metrics: "/metrics",
  });
});

app.use(
  (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    response.status(400).json({ error: message });
  },
);

void startServer();

async function startServer(): Promise<void> {
  await prepareStorage();

  if (!(await readLatestCorrelationSnapshot())) {
    await computeAndPersistSnapshot("bootstrap");
  }

  // Start background MCX web scraper
  startScraperPolling();

  app.listen(port, () => {
    console.log(`API running on port ${port}`);
  });
}

async function computeAndPersistSnapshot(source: string): Promise<CorrelationSnapshot> {
  const correlationStart = Date.now();
  const [alerts, reports] = await Promise.all([
    readMonitoringAlerts(),
    readAccessibilityReports(),
  ]);

  const snapshot = correlateAlerts({
    alerts,
    accessibilityReports: reports,
    generatedAt: new Date().toISOString(),
    source,
  });

  await saveCorrelationSnapshot(snapshot);
  
  // Track correlation metrics
  const correlationTime = (Date.now() - correlationStart) / 1000;
  correlationDuration.observe(correlationTime);
  correlationSnapshotCount.labels(source).inc();
  alertNoiseReduction.set(snapshot.stats.alertNoiseReduction);
  
  return snapshot;
}

function asyncRoute(handler: AsyncRouteHandler) {
  return (request: Request, response: Response, next: NextFunction): void => {
    void handler(request, response).catch(next);
  };
}

function normalizeAccessibilityReport(value: unknown, index: number): AccessibilityReport {
  const payload = asRecord(value, `accessibility report ${index + 1}`);
  const reportId = readOptionalString(payload.id) ?? `a11y-${randomUUID()}`;
  const issues = arrayify(payload.issues).map((issue, issueIndex) =>
    normalizeAccessibilityIssue(issue, reportId, issueIndex),
  );

  if (issues.length === 0) {
    throw new Error(`Accessibility report ${reportId} must include at least one issue.`);
  }

  return {
    id: reportId,
    source: readOptionalString(payload.source) ?? "lighthouse",
    environment: readOptionalString(payload.environment) ?? "production",
    capturedAt: readOptionalString(payload.capturedAt) ?? new Date().toISOString(),
    issues,
  };
}

function normalizeAccessibilityIssue(
  value: unknown,
  reportId: string,
  index: number,
): AccessibilityIssue {
  const payload = asRecord(value, `accessibility issue ${index + 1} in ${reportId}`);
  const severity = readOptionalString(payload.severity) ?? "moderate";

  if (!validAccessibilitySeverities.has(severity as AccessibilitySeverity)) {
    throw new Error(`Unsupported accessibility severity "${severity}" in ${reportId}.`);
  }

  return {
    id: readOptionalString(payload.id) ?? `${reportId}-issue-${index + 1}`,
    page: readRequiredString(payload.page, "page"),
    component: readRequiredString(payload.component, "component"),
    severity: severity as AccessibilitySeverity,
    criterion: readRequiredString(payload.criterion, "criterion"),
    description: readRequiredString(payload.description, "description"),
    userImpact: readRequiredString(payload.userImpact, "userImpact"),
    status: readOptionalString(payload.status) === "resolved" ? "resolved" : "open",
    tags: readStringArray(payload.tags),
  };
}

function normalizeMonitoringAlert(value: unknown, index: number): MonitoringAlert {
  const payload = asRecord(value, `monitoring alert ${index + 1}`);
  const severity = readOptionalString(payload.severity) ?? "medium";
  const status = readOptionalString(payload.status) ?? "firing";

  if (!validAlertSeverities.has(severity as AlertSeverity)) {
    throw new Error(`Unsupported alert severity "${severity}".`);
  }

  if (!validAlertStatuses.has(status as AlertStatus)) {
    throw new Error(`Unsupported alert status "${status}".`);
  }

  return {
    id: readOptionalString(payload.id) ?? `alert-${randomUUID()}`,
    source: readOptionalString(payload.source) ?? "prometheus",
    service: readRequiredString(payload.service, "service"),
    metric: readRequiredString(payload.metric, "metric"),
    severity: severity as AlertSeverity,
    status: status as AlertStatus,
    page: readRequiredString(payload.page, "page"),
    component: readOptionalString(payload.component) ?? undefined,
    message: readRequiredString(payload.message, "message"),
    startedAt: readOptionalString(payload.startedAt) ?? new Date().toISOString(),
    value: readOptionalNumber(payload.value) ?? undefined,
    threshold: readOptionalNumber(payload.threshold) ?? undefined,
    tags: readStringArray(payload.tags),
  };
}

function normalizeCorrelationSnapshot(value: unknown): CorrelationSnapshot {
  const payload = asRecord(value, "correlation snapshot");
  const prioritizedAlerts = Array.isArray(payload.prioritizedAlerts)
    ? (payload.prioritizedAlerts as CorrelationSnapshot["prioritizedAlerts"])
    : [];

  return {
    id: readOptionalString(payload.id) ?? `corr-${randomUUID()}`,
    generatedAt: readOptionalString(payload.generatedAt) ?? new Date().toISOString(),
    source: readOptionalString(payload.source) ?? "worker",
    topPriorityAlert:
      (payload.topPriorityAlert as CorrelationSnapshot["topPriorityAlert"] | undefined) ??
      prioritizedAlerts[0] ??
      null,
    prioritizedAlerts,
    stats:
      (payload.stats as CorrelationSnapshot["stats"] | undefined) ?? {
        rawAlertCount: prioritizedAlerts.length,
        openAccessibilityIssueCount: 0,
        correlatedAlertCount: prioritizedAlerts.filter(
          (alert) => alert.accessibilityIssues.length > 0,
        ).length,
        alertNoiseReduction: 0,
      },
  };
}

function parseInstrument(value: unknown): Instrument | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const candidate = value.trim().toUpperCase();
  if (!knownInstruments.has(candidate)) {
    throw new Error(`Unknown instrument "${value}".`);
  }

  return candidate as Instrument;
}

function parseAlertStatusFilter(value: unknown): AlertStatus | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  if (!validAlertStatuses.has(value as AlertStatus)) {
    throw new Error(`Unknown alert status "${value}".`);
  }

  return value as AlertStatus;
}

function parseWorkerStatus(value: unknown): WorkerState["status"] {
  if (value === "healthy" || value === "degraded" || value === "idle") {
    return value;
  }

  return "healthy";
}

function asRecord(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid ${label} payload.`);
  }

  return value as JsonRecord;
}

function arrayify(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [value];
}

function readRequiredString(value: unknown, fieldName: string): string {
  const nextValue = readOptionalString(value);
  if (!nextValue) {
    throw new Error(`"${fieldName}" is required.`);
  }

  return nextValue;
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function readOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}
