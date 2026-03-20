export const instruments = [
  "ALUMINI",
  "COPPER",
  "CRUDEOIL",
  "GOLD",
  "LEAD",
  "NATURALGAS",
  "NICKEL",
  "SILVER",
  "ZINC",
] as const;

export type Instrument = (typeof instruments)[number];
export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AccessibilitySeverity = "critical" | "serious" | "moderate" | "minor";
export type AlertStatus = "firing" | "resolved";
export type AccessibilityStatus = "open" | "resolved";
export type CorrelationPriority = "P1" | "P2" | "P3" | "P4";

export interface MarginBreakdown {
  initial: number;
  elm: number;
  tender: number;
  delivery: number;
  additionalLong: number;
  additionalShort: number;
  specialLong: number;
  specialShort: number;
  dailyVolatility: number;
  annualVolatility: number;
}

export interface StoredDailyMarginRecord {
  instrument: Instrument;
  asOf: string;
  previousTotal: number;
  breakdown: MarginBreakdown;
}

export interface DailyMarginSnapshot extends StoredDailyMarginRecord {
  componentTotals: {
    additionalSpread: number;
    specialSpread: number;
  };
  total: number;
  difference: number;
}

export interface MarketWatchEntry {
  instrument: Instrument;
  contract: string;
  nextContract: string;
  frontMonthPrice: number;
  nextMonthPrice: number;
  spread: number;
  changePercent: number;
  volume: number;
  openInterest: number;
  sentiment: "bullish" | "bearish" | "neutral";
}

export interface AccessibilityIssue {
  id: string;
  page: string;
  component: string;
  severity: AccessibilitySeverity;
  criterion: string;
  description: string;
  userImpact: string;
  status: AccessibilityStatus;
  tags?: string[];
}

export interface AccessibilityReport {
  id: string;
  source: string;
  environment: string;
  capturedAt: string;
  issues: AccessibilityIssue[];
}

export interface MonitoringAlert {
  id: string;
  source: string;
  service: string;
  metric: string;
  severity: AlertSeverity;
  status: AlertStatus;
  page: string;
  component?: string;
  message: string;
  startedAt: string;
  value?: number;
  threshold?: number;
  tags?: string[];
}

export interface CorrelatedIssue extends AccessibilityIssue {
  reportId: string;
  reportCapturedAt: string;
  reportSource: string;
  environment: string;
}

export interface CorrelatedAlert {
  id: string;
  priority: CorrelationPriority;
  score: number;
  summary: string;
  page: string;
  service: string;
  alert: MonitoringAlert;
  accessibilityIssues: CorrelatedIssue[];
  rationale: string[];
}

export interface CorrelationSnapshot {
  id: string;
  generatedAt: string;
  source?: string;
  topPriorityAlert: CorrelatedAlert | null;
  prioritizedAlerts: CorrelatedAlert[];
  stats: {
    rawAlertCount: number;
    openAccessibilityIssueCount: number;
    correlatedAlertCount: number;
    alertNoiseReduction: number;
  };
}

export interface CorrelationRequest {
  alerts: MonitoringAlert[];
  accessibilityReports: AccessibilityReport[];
  generatedAt?: string;
  source?: string;
}

const alertSeverityWeights: Record<AlertSeverity, number> = {
  critical: 60,
  high: 45,
  medium: 30,
  low: 18,
};

const accessibilitySeverityWeights: Record<AccessibilitySeverity, number> = {
  critical: 24,
  serious: 18,
  moderate: 12,
  minor: 7,
};

const servicePageHints: Record<string, string[]> = {
  "frontend-web": ["dashboard", "daily-margin", "market-watch"],
  "margin-api": ["daily-margin"],
  "market-watch-api": ["market-watch"],
};

export function calculateMarginSnapshot(record: StoredDailyMarginRecord): DailyMarginSnapshot {
  const componentTotals = {
    additionalSpread: record.breakdown.additionalLong + record.breakdown.additionalShort,
    specialSpread: record.breakdown.specialLong + record.breakdown.specialShort,
  };

  const total =
    record.breakdown.initial +
    record.breakdown.elm +
    record.breakdown.tender +
    record.breakdown.delivery +
    componentTotals.additionalSpread +
    componentTotals.specialSpread +
    record.breakdown.dailyVolatility +
    record.breakdown.annualVolatility;

  return {
    ...record,
    componentTotals,
    total,
    difference: total - record.previousTotal,
  };
}

export function flattenOpenAccessibilityIssues(
  reports: AccessibilityReport[],
): CorrelatedIssue[] {
  return reports
    .flatMap((report) =>
      report.issues
        .filter((issue) => issue.status === "open")
        .map((issue) => ({
          ...issue,
          reportId: report.id,
          reportCapturedAt: report.capturedAt,
          reportSource: report.source,
          environment: report.environment,
        })),
    )
    .sort((left, right) => right.reportCapturedAt.localeCompare(left.reportCapturedAt));
}

export function correlateAlerts({
  alerts,
  accessibilityReports,
  generatedAt = new Date().toISOString(),
  source = "engine",
}: CorrelationRequest): CorrelationSnapshot {
  const activeAlerts = alerts.filter((alert) => alert.status === "firing");
  const openIssues = flattenOpenAccessibilityIssues(accessibilityReports);

  const prioritizedAlerts = activeAlerts
    .map((alert) => buildCorrelatedAlert(alert, openIssues))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.alert.startedAt.localeCompare(left.alert.startedAt);
    });

  const topPriorityAlert = prioritizedAlerts[0] ?? null;

  return {
    id: createCorrelationId(generatedAt),
    generatedAt,
    source,
    topPriorityAlert,
    prioritizedAlerts,
    stats: {
      rawAlertCount: activeAlerts.length,
      openAccessibilityIssueCount: openIssues.length,
      correlatedAlertCount: prioritizedAlerts.filter(
        (alert) => alert.accessibilityIssues.length > 0,
      ).length,
      alertNoiseReduction:
        activeAlerts.length === 0
          ? 0
          : roundToTwo(((activeAlerts.length - (topPriorityAlert ? 1 : 0)) / activeAlerts.length) * 100),
    },
  };
}

export function correlate(input: CorrelationRequest): CorrelationSnapshot {
  return correlateAlerts(input);
}

function buildCorrelatedAlert(
  alert: MonitoringAlert,
  openIssues: CorrelatedIssue[],
): CorrelatedAlert {
  const relatedIssues = openIssues.filter((issue) => isIssueRelatedToAlert(issue, alert));
  const score = calculateAlertScore(alert, relatedIssues);
  const priority = getPriority(score);
  const summary = buildSummary(alert, relatedIssues, priority);
  const rationale = buildRationale(alert, relatedIssues);

  return {
    id: `${alert.id}-corr`,
    priority,
    score,
    summary,
    page: alert.page,
    service: alert.service,
    alert,
    accessibilityIssues: relatedIssues,
    rationale,
  };
}

function calculateAlertScore(alert: MonitoringAlert, issues: CorrelatedIssue[]): number {
  let score = alertSeverityWeights[alert.severity];

  if (issues.length === 0) {
    return score;
  }

  const uniqueCriteria = new Set(issues.map((issue) => normalizeToken(issue.criterion)));
  const issueSeverityTotal = issues.reduce(
    (total, issue) => total + accessibilitySeverityWeights[issue.severity],
    0,
  );
  const matchBonus = issues.reduce((total, issue) => total + getMatchBonus(issue, alert), 0);
  const freshnessBonus = issues.reduce(
    (best, issue) => Math.max(best, getFreshnessBonus(issue.reportCapturedAt, alert.startedAt)),
    0,
  );

  score += Math.min(28, issueSeverityTotal);
  score += Math.min(22, matchBonus);
  score += Math.min(10, uniqueCriteria.size * 3);
  score += Math.min(8, Math.max(0, issues.length - 1) * 2);
  score += freshnessBonus;

  return score;
}

function buildSummary(
  alert: MonitoringAlert,
  issues: CorrelatedIssue[],
  priority: CorrelationPriority,
): string {
  if (issues.length === 0) {
    return `${priority} ${humanize(alert.service)} ${humanize(alert.metric)} alert has no linked accessibility impact yet.`;
  }

  const criteria = Array.from(
    new Set(issues.map((issue) => humanize(issue.criterion))),
  ).join(", ");

  return `${priority} ${humanize(alert.service)} ${humanize(alert.metric)} is impacting ${issues.length} accessibility issue(s) on ${humanize(alert.page)} across ${criteria}.`;
}

function buildRationale(alert: MonitoringAlert, issues: CorrelatedIssue[]): string[] {
  const rationale = [
    `${humanize(alert.service)} reported a ${alert.severity} ${humanize(alert.metric)} alert.`,
  ];

  if (issues.length === 0) {
    rationale.push(
      "No open accessibility findings matched the affected page or component, so this alert stays visible but lower priority.",
    );
    return rationale;
  }

  const criteria = Array.from(new Set(issues.map((issue) => humanize(issue.criterion))));
  const pages = Array.from(new Set(issues.map((issue) => humanize(issue.page))));

  rationale.push(
    `${issues.length} open accessibility issue(s) are active on ${pages.join(", ")}.`,
  );
  rationale.push(`Affected criteria: ${criteria.join(", ")}.`);

  if (issues.some((issue) => normalizeToken(issue.component) === normalizeToken(alert.component ?? ""))) {
    rationale.push("The alert and accessibility issue touch the same UI component, increasing user impact.");
  }

  return rationale;
}

function getPriority(score: number): CorrelationPriority {
  if (score >= 95) {
    return "P1";
  }

  if (score >= 72) {
    return "P2";
  }

  if (score >= 48) {
    return "P3";
  }

  return "P4";
}

function isIssueRelatedToAlert(issue: CorrelatedIssue, alert: MonitoringAlert): boolean {
  const issuePage = normalizeToken(issue.page);
  const alertPage = normalizeToken(alert.page);
  const issueComponent = normalizeToken(issue.component);
  const alertComponent = normalizeToken(alert.component ?? "");
  const issueTags = new Set((issue.tags ?? []).map(normalizeToken));
  const alertSignals = [
    normalizeToken(alert.service),
    normalizeToken(alert.metric),
    alertPage,
    alertComponent,
    ...(alert.tags ?? []).map(normalizeToken),
  ].filter(Boolean);

  if (issuePage && alertPage && issuePage === alertPage) {
    return true;
  }

  if (issueComponent && alertComponent && issueComponent === alertComponent) {
    return true;
  }

  if (alertSignals.some((signal) => issueTags.has(signal))) {
    return true;
  }

  const hintedPages = servicePageHints[normalizeToken(alert.service)] ?? [];
  return hintedPages.some((hint) => issuePage === normalizeToken(hint));
}

function getMatchBonus(issue: CorrelatedIssue, alert: MonitoringAlert): number {
  let bonus = 0;

  if (normalizeToken(issue.page) === normalizeToken(alert.page)) {
    bonus += 10;
  }

  if (normalizeToken(issue.component) === normalizeToken(alert.component ?? "")) {
    bonus += 7;
  }

  const issueTags = new Set((issue.tags ?? []).map(normalizeToken));
  const alertSignals = [
    normalizeToken(alert.service),
    normalizeToken(alert.metric),
    ...(alert.tags ?? []).map(normalizeToken),
  ].filter(Boolean);

  if (alertSignals.some((signal) => issueTags.has(signal))) {
    bonus += 5;
  }

  const hintedPages = servicePageHints[normalizeToken(alert.service)] ?? [];
  if (hintedPages.some((hint) => normalizeToken(hint) === normalizeToken(issue.page))) {
    bonus += 4;
  }

  return bonus;
}

function getFreshnessBonus(issueCapturedAt: string, alertStartedAt: string): number {
  const issueTime = Date.parse(issueCapturedAt);
  const alertTime = Date.parse(alertStartedAt);

  if (Number.isNaN(issueTime) || Number.isNaN(alertTime)) {
    return 0;
  }

  const differenceInHours = Math.abs(issueTime - alertTime) / (1000 * 60 * 60);

  if (differenceInHours <= 24) {
    return 6;
  }

  if (differenceInHours <= 72) {
    return 3;
  }

  return 0;
}

function createCorrelationId(timestamp: string): string {
  return `corr-${timestamp.replace(/[^0-9]/g, "").slice(0, 14)}`;
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function humanize(value: string): string {
  const normalized = value.replace(/[-_]+/g, " ").trim();
  if (!normalized) {
    return "unknown";
  }

  return normalized
    .split(/\s+/)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
