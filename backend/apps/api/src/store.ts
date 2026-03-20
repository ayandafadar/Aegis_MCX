import { promises as fs } from "fs";
import path from "path";

import type {
  AccessibilityReport,
  CorrelationSnapshot,
  MarketWatchEntry,
  MonitoringAlert,
  StoredDailyMarginRecord,
} from "../../../packages/correlation/src";

export interface WorkerState {
  status: "idle" | "healthy" | "degraded";
  apiBaseUrl: string | null;
  pollIntervalMs: number | null;
  lastHeartbeatAt: string | null;
  lastRunAt: string | null;
  lastCorrelationId: string | null;
  lastError: string | null;
}

type StorageKey =
  | "dailyMargins"
  | "marketWatch"
  | "accessibilityReports"
  | "monitoringAlerts"
  | "correlationSnapshots"
  | "workerState";

const storageRoot = path.resolve(__dirname, "../../../storage");
const seedRoot = path.join(storageRoot, "seed");
const runtimeRoot = path.join(storageRoot, "runtime");

const files: Record<StorageKey, string> = {
  dailyMargins: "daily-margins.json",
  marketWatch: "market-watch.json",
  accessibilityReports: "accessibility-reports.json",
  monitoringAlerts: "monitoring-alerts.json",
  correlationSnapshots: "correlation-snapshots.json",
  workerState: "worker-state.json",
};

const defaultWorkerState: WorkerState = {
  status: "idle",
  apiBaseUrl: null,
  pollIntervalMs: null,
  lastHeartbeatAt: null,
  lastRunAt: null,
  lastCorrelationId: null,
  lastError: null,
};

export const storagePaths = {
  root: storageRoot,
  seedRoot,
  runtimeRoot,
};

export async function prepareStorage(): Promise<void> {
  await fs.mkdir(seedRoot, { recursive: true });
  await fs.mkdir(runtimeRoot, { recursive: true });

  await ensureRuntimeFile("dailyMargins", []);
  await ensureRuntimeFile("marketWatch", []);
  await ensureRuntimeFile("accessibilityReports", []);
  await ensureRuntimeFile("monitoringAlerts", []);
  await ensureRuntimeFile("correlationSnapshots", []);
  await ensureRuntimeFile("workerState", defaultWorkerState);
}

export async function resetRuntimeFromSeed(): Promise<void> {
  await fs.mkdir(runtimeRoot, { recursive: true });

  await overwriteRuntimeFile("dailyMargins", []);
  await overwriteRuntimeFile("marketWatch", []);
  await overwriteRuntimeFile("accessibilityReports", []);
  await overwriteRuntimeFile("monitoringAlerts", []);
  await overwriteRuntimeFile("correlationSnapshots", []);
  await overwriteRuntimeFile("workerState", defaultWorkerState);
}

export function readDailyMargins(): Promise<StoredDailyMarginRecord[]> {
  return readRuntimeJson<StoredDailyMarginRecord[]>("dailyMargins");
}

export function readMarketWatch(): Promise<MarketWatchEntry[]> {
  return readRuntimeJson<MarketWatchEntry[]>("marketWatch");
}

export function readAccessibilityReports(): Promise<AccessibilityReport[]> {
  return readRuntimeJson<AccessibilityReport[]>("accessibilityReports").then((reports) =>
    reports.sort((left, right) => right.capturedAt.localeCompare(left.capturedAt)),
  );
}

export function readMonitoringAlerts(): Promise<MonitoringAlert[]> {
  return readRuntimeJson<MonitoringAlert[]>("monitoringAlerts").then((alerts) =>
    alerts.sort((left, right) => right.startedAt.localeCompare(left.startedAt)),
  );
}

export function readCorrelationSnapshots(): Promise<CorrelationSnapshot[]> {
  return readRuntimeJson<CorrelationSnapshot[]>("correlationSnapshots").then((snapshots) =>
    snapshots.sort((left, right) => right.generatedAt.localeCompare(left.generatedAt)),
  );
}

export function readWorkerState(): Promise<WorkerState> {
  return readRuntimeJson<WorkerState>("workerState");
}

export async function appendAccessibilityReports(
  incomingReports: AccessibilityReport[],
): Promise<AccessibilityReport[]> {
  const existingReports = await readAccessibilityReports();
  const mergedReports = [...incomingReports, ...existingReports].sort((left, right) =>
    right.capturedAt.localeCompare(left.capturedAt),
  );

  await writeRuntimeJson("accessibilityReports", mergedReports);
  return mergedReports;
}

export async function appendMonitoringAlerts(
  incomingAlerts: MonitoringAlert[],
): Promise<MonitoringAlert[]> {
  const existingAlerts = await readMonitoringAlerts();
  const mergedAlerts = [...incomingAlerts, ...existingAlerts].sort((left, right) =>
    right.startedAt.localeCompare(left.startedAt),
  );

  await writeRuntimeJson("monitoringAlerts", mergedAlerts);
  return mergedAlerts;
}

export async function saveCorrelationSnapshot(
  snapshot: CorrelationSnapshot,
): Promise<CorrelationSnapshot[]> {
  const existingSnapshots = await readCorrelationSnapshots();
  const mergedSnapshots = [snapshot, ...existingSnapshots].sort((left, right) =>
    right.generatedAt.localeCompare(left.generatedAt),
  );

  await writeRuntimeJson("correlationSnapshots", mergedSnapshots);
  return mergedSnapshots;
}

export async function readLatestCorrelationSnapshot(): Promise<CorrelationSnapshot | null> {
  const snapshots = await readCorrelationSnapshots();
  return snapshots[0] ?? null;
}

export async function updateWorkerState(
  patch: Partial<WorkerState>,
): Promise<WorkerState> {
  const currentState = await readWorkerState();
  const nextState: WorkerState = {
    ...currentState,
    ...patch,
  };

  await writeRuntimeJson("workerState", nextState);
  return nextState;
}

async function ensureRuntimeFile<T>(key: StorageKey, fallbackValue: T): Promise<void> {
  const runtimePath = getRuntimePath(key);
  if (await fileExists(runtimePath)) {
    return;
  }

  const seedPath = getSeedPath(key);
  if (await fileExists(seedPath)) {
    await fs.copyFile(seedPath, runtimePath);
    return;
  }

  await writeJsonFile(runtimePath, fallbackValue);
}

async function overwriteRuntimeFile<T>(key: StorageKey, fallbackValue: T): Promise<void> {
  const seedPath = getSeedPath(key);
  const runtimePath = getRuntimePath(key);

  if (await fileExists(seedPath)) {
    await fs.copyFile(seedPath, runtimePath);
    return;
  }

  await writeJsonFile(runtimePath, fallbackValue);
}

function readRuntimeJson<T>(key: StorageKey): Promise<T> {
  return readJsonFile<T>(getRuntimePath(key));
}

function writeRuntimeJson<T>(key: StorageKey, data: T): Promise<void> {
  return writeJsonFile(getRuntimePath(key), data);
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function getSeedPath(key: StorageKey): string {
  return path.join(seedRoot, files[key]);
}

function getRuntimePath(key: StorageKey): string {
  return path.join(runtimeRoot, files[key]);
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}
