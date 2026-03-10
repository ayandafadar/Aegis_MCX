import {
  correlateAlerts,
  type AccessibilityReport,
  type CorrelationSnapshot,
  type MonitoringAlert,
} from "../../../packages/correlation/src";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";
const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS ?? 15000);
const maxRetries = Number(process.env.MAX_RETRIES ?? 3);
const retryDelayMs = Number(process.env.RETRY_DELAY_MS ?? 5000);

let runInProgress = false;
let consecutiveFailures = 0;

void runCycle();
setInterval(() => {
  void runCycle();
}, pollIntervalMs);

async function runCycle(): Promise<void> {
  if (runInProgress) {
    return;
  }

  runInProgress = true;
  const cycleStartedAt = new Date().toISOString();

  try {
    const [alertsResponse, reportsResponse] = await Promise.all([
      fetchJson<{ items: MonitoringAlert[] }>(`${apiBaseUrl}/api/monitoring/alerts?status=firing`),
      fetchJson<{ items: AccessibilityReport[] }>(`${apiBaseUrl}/api/accessibility/reports`),
    ]);

    const snapshot = correlateAlerts({
      alerts: alertsResponse.items,
      accessibilityReports: reportsResponse.items,
      generatedAt: cycleStartedAt,
      source: "worker",
    });

    await postJson<CorrelationSnapshot>(`${apiBaseUrl}/api/correlation/snapshots`, snapshot);
    await sendHeartbeat({
      status: "healthy",
      lastRunAt: cycleStartedAt,
      lastCorrelationId: snapshot.id,
      lastError: null,
    });

    const topPriority = snapshot.topPriorityAlert?.summary ?? "No active alerts to prioritize.";
    console.log(`[worker] ${cycleStartedAt} ${topPriority}`);
    consecutiveFailures = 0;
  } catch (error) {
    consecutiveFailures++;
    const message = error instanceof Error ? error.message : "Unknown worker error";
    await sendHeartbeat({
      status: "degraded",
      lastRunAt: cycleStartedAt,
      lastError: message,
    });
    console.error(`[worker] ${cycleStartedAt} ${message} (consecutive failures: ${consecutiveFailures})`);

    if (consecutiveFailures >= 5) {
      console.error(`[worker] Critical: ${consecutiveFailures} consecutive failures detected. Service may need attention.`);
    }
  } finally {
    runInProgress = false;
  }
}

async function sendHeartbeat(payload: {
  status: "healthy" | "degraded";
  lastRunAt: string;
  lastCorrelationId?: string;
  lastError: string | null;
}): Promise<void> {
  try {
    await postJson(`${apiBaseUrl}/api/worker/heartbeat`, {
      ...payload,
      apiBaseUrl,
      pollIntervalMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown heartbeat error";
    console.error(`[worker] heartbeat failed: ${message}`);
  }
}

async function fetchJson<T>(url: string, retries = maxRetries): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`GET ${url} failed with status ${response.status}.`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        console.warn(`[worker] Fetch attempt ${attempt}/${retries} failed: ${lastError.message}. Retrying in ${retryDelayMs}ms...`);
        await sleep(retryDelayMs);
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

async function postJson<TResponse = unknown>(
  url: string,
  body: unknown,
  retries = maxRetries,
): Promise<TResponse> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`POST ${url} failed with status ${response.status}.`);
      }

      return (await response.json()) as TResponse;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        console.warn(`[worker] Post attempt ${attempt}/${retries} failed: ${lastError.message}. Retrying in ${retryDelayMs}ms...`);
        await sleep(retryDelayMs);
      }
    }
  }

  throw lastError ?? new Error(`Failed to post to ${url} after ${retries} attempts`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
