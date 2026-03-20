import type { Express, Request, Response } from "express";

interface DemoRouteConfig {
  title: string;
  subtitle: string;
  endpoint: string;
  pageKey: "dashboard" | "health" | "correlation" | "monitoring" | "accessibility";
}

const demoPages: Record<string, DemoRouteConfig> = {
  "/demo/dashboard": {
    title: "Dashboard Overview",
    subtitle: "Executive summary of market, monitoring, and accessibility posture.",
    endpoint: "/api/dashboard",
    pageKey: "dashboard",
  },
  "/demo/health": {
    title: "Service Health",
    subtitle: "Operational status with live worker heartbeat telemetry.",
    endpoint: "/health",
    pageKey: "health",
  },
  "/demo/correlation": {
    title: "Latest Correlation Signal",
    subtitle: "Top-priority, user-impact-focused incident ranking.",
    endpoint: "/api/correlation/latest",
    pageKey: "correlation",
  },
  "/demo/monitoring": {
    title: "Monitoring Alerts",
    subtitle: "Production-style alerts powering the correlation pipeline.",
    endpoint: "/api/monitoring/alerts",
    pageKey: "monitoring",
  },
  "/demo/accessibility": {
    title: "Accessibility Issues",
    subtitle: "Open accessibility findings feeding impact prioritization.",
    endpoint: "/api/accessibility/issues",
    pageKey: "accessibility",
  },
};

export function registerDemoRoutes(app: Express): void {
  app.get("/demo", (_request, response) => {
    response.type("html").send(buildDemoHubPage());
  });

  for (const [route, config] of Object.entries(demoPages)) {
    app.get(route, (_request, response) => {
      response.type("html").send(buildDemoDataPage(config));
    });
  }

  app.get("/demo/devops", (_request, response) => {
    response.type("html").send(buildDevOpsPage());
  });
}

function buildDemoHubPage(): string {
  return createShell({
    pageTitle: "Aegis Demo Console",
    heading: "Aegis Visual Demo Console",
    subtitle:
      "Use these pages for a professional walkthrough of reliability, accessibility, and DevOps readiness.",
    body: `
      <section class="card-grid">
        ${Object.entries(demoPages)
          .map(
            ([route, config]) => `
          <a class="demo-card" href="${route}">
            <h3>${escapeHtml(config.title)}</h3>
            <p>${escapeHtml(config.subtitle)}</p>
            <span class="mono">${escapeHtml(config.endpoint)}</span>
          </a>
        `,
          )
          .join("")}
        <a class="demo-card" href="/demo/devops">
          <h3>DevOps And Docker</h3>
          <p>Local verification, CI checks, Lighthouse and container runbook.</p>
          <span class="mono">CI + Docker Integration</span>
        </a>
      </section>
      <section class="panel">
        <h2>Presentation Steps</h2>
        <ol>
          <li>API and worker health.</li>
          <li>Monitoring and accessibility data.</li>
          <li>Correlated top-priority incident.</li>
          <li>DevOps verification and Docker readiness.</li>
        </ol>
      </section>
    `,
  });
}

function buildDemoDataPage(config: DemoRouteConfig): string {
  return createShell({
    pageTitle: `Aegis | ${config.title}`,
    heading: config.title,
    subtitle: config.subtitle,
    body: `
      <section class="panel toolbar">
        <div>
          <span class="label">Data Source</span>
          <div class="mono">${escapeHtml(config.endpoint)}</div>
        </div>
        <div class="toolbar-actions">
          <button id="refreshButton" type="button">Refresh Data</button>
          <a class="button-link" href="${escapeHtml(config.endpoint)}" target="_blank" rel="noreferrer">Open Raw JSON</a>
        </div>
      </section>
      <section class="metric-grid" id="metrics"></section>
      <section class="panel">
        <h2>Structured View</h2>
        <div id="structured" class="stack"></div>
      </section>
      <section class="panel">
        <h2>Raw Payload</h2>
        <pre id="rawJson" class="json-block">Loading...</pre>
      </section>
      <script>
        const endpoint = ${JSON.stringify(config.endpoint)};
        const pageKey = ${JSON.stringify(config.pageKey)};

        const rawJsonElement = document.getElementById("rawJson");
        const metricsElement = document.getElementById("metrics");
        const structuredElement = document.getElementById("structured");
        const refreshButton = document.getElementById("refreshButton");

        refreshButton.addEventListener("click", () => {
          void render();
        });

        void render();

        async function render() {
          metricsElement.innerHTML = "";
          structuredElement.innerHTML = "";
          rawJsonElement.textContent = "Loading...";

          try {
            const response = await fetch(endpoint, { headers: { "Accept": "application/json" } });
            if (!response.ok) {
              throw new Error("Request failed with status " + response.status);
            }

            const data = await response.json();
            rawJsonElement.textContent = JSON.stringify(data, null, 2);

            if (pageKey === "health") {
              renderHealth(data);
            } else if (pageKey === "dashboard") {
              renderDashboard(data);
            } else if (pageKey === "correlation") {
              renderCorrelation(data);
            } else if (pageKey === "monitoring") {
              renderMonitoring(data);
            } else if (pageKey === "accessibility") {
              renderAccessibility(data);
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            rawJsonElement.textContent = "Error: " + message;
            appendMetric("Status", "Error", "bad");
          }
        }

        function renderHealth(data) {
          appendMetric("Service", data.status || "unknown", data.status === "ok" ? "good" : "bad");
          appendMetric("Active Alerts", String(data.activeAlerts ?? 0), "neutral");
          appendMetric("Open Accessibility Issues", String(data.openAccessibilityIssues ?? 0), "neutral");
          appendMetric("Worker Status", data.worker?.status || "unknown", data.worker?.status === "healthy" ? "good" : "warn");

          const worker = data.worker || {};
          appendStructuredCard("Worker Runtime", [
            ["API Base URL", worker.apiBaseUrl || "n/a"],
            ["Poll Interval", String(worker.pollIntervalMs || "n/a")],
            ["Last Heartbeat", worker.lastHeartbeatAt || "n/a"],
            ["Last Correlation ID", worker.lastCorrelationId || "n/a"],
          ]);
        }

        function renderDashboard(data) {
          appendMetric("Generated At", data.generatedAt || "n/a", "neutral");
          appendMetric("Market Rows", String(data.market?.dailyMargins?.length || 0), "neutral");
          appendMetric("Active Alerts", String(data.monitoring?.activeAlertCount || 0), "warn");
          appendMetric("Open Issues", String(data.accessibility?.openIssueCount || 0), "warn");

          const top = data.correlation?.topPriorityAlert;
          if (top) {
            appendStructuredCard("Top Priority Incident", [
              ["Priority", top.priority],
              ["Service", top.service],
              ["Summary", top.summary],
              ["Score", String(top.score)],
            ]);
          }

          appendStructuredCard("Quick Links", Object.entries(data.links || {}).map(([key, value]) => [key, String(value)]));
        }

        function renderCorrelation(data) {
          const item = data.item;
          const top = item?.topPriorityAlert;
          const stats = item?.stats || {};

          appendMetric("Snapshot ID", item?.id || "n/a", "neutral");
          appendMetric("Top Priority", top?.priority || "n/a", top?.priority === "P1" ? "bad" : "warn");
          appendMetric("Correlated Alerts", String(stats.correlatedAlertCount || 0), "neutral");
          appendMetric("Noise Reduction", String(stats.alertNoiseReduction ?? 0) + "%", "good");

          if (top) {
            appendStructuredCard("Top Alert", [
              ["Summary", top.summary],
              ["Service", top.service],
              ["Page", top.page],
              ["Accessibility Links", String(top.accessibilityIssues?.length || 0)],
            ]);
          }

          const prioritized = item?.prioritizedAlerts || [];
          appendListSection("Prioritized Alerts", prioritized.map((alert) => {
            return (alert.priority || "n/a") + " | " + (alert.service || "service") + " | " + (alert.summary || "no summary");
          }));
        }

        function renderMonitoring(data) {
          appendMetric("Alert Count", String(data.count || 0), "warn");
          const alerts = data.items || [];

          appendListSection("Active Monitoring Alerts", alerts.map((alert) => {
            return (alert.severity || "unknown") + " | " + (alert.service || "service") + " | " + (alert.message || "no message");
          }));
        }

        function renderAccessibility(data) {
          appendMetric("Open Issue Count", String(data.count || 0), "warn");
          const issues = data.items || [];

          appendListSection("Open Accessibility Issues", issues.map((issue) => {
            return (issue.severity || "unknown") + " | " + (issue.page || "page") + " | " + (issue.criterion || "criterion") + " | " + (issue.description || "no description");
          }));
        }

        function appendMetric(label, value, tone) {
          const card = document.createElement("article");
          card.className = "metric " + tone;

          const title = document.createElement("span");
          title.className = "label";
          title.textContent = label;

          const amount = document.createElement("strong");
          amount.textContent = value;

          card.appendChild(title);
          card.appendChild(amount);
          metricsElement.appendChild(card);
        }

        function appendStructuredCard(title, rows) {
          const block = document.createElement("article");
          block.className = "mini-card";

          const heading = document.createElement("h3");
          heading.textContent = title;
          block.appendChild(heading);

          const list = document.createElement("dl");
          for (const [label, value] of rows) {
            const dt = document.createElement("dt");
            dt.textContent = label;
            const dd = document.createElement("dd");
            dd.textContent = value;
            list.appendChild(dt);
            list.appendChild(dd);
          }

          block.appendChild(list);
          structuredElement.appendChild(block);
        }

        function appendListSection(title, items) {
          const block = document.createElement("article");
          block.className = "mini-card";

          const heading = document.createElement("h3");
          heading.textContent = title;
          block.appendChild(heading);

          const list = document.createElement("ul");
          for (const item of items) {
            const li = document.createElement("li");
            li.textContent = item;
            list.appendChild(li);
          }

          block.appendChild(list);
          structuredElement.appendChild(block);
        }
      </script>
    `,
  });
}

function buildDevOpsPage(): string {
  return createShell({
    pageTitle: "Aegis | DevOps And Docker",
    heading: "DevOps And Docker Runbook",
    subtitle: "Presentation-friendly operational checks and container workflow.",
    body: `
      <section class="panel">
        <h2>Local Verification</h2>
        <ol class="mono-list">
          <li>npm run dev</li>
          <li>npm run typecheck</li>
          <li>npx @lhci/cli autorun --config=.github/lighthouserc.json</li>
          <li>curl http://127.0.0.1:3000/demo</li>
        </ol>
      </section>
      <section class="panel">
        <h2>Docker Demo</h2>
        <ol class="mono-list">
          <li>npm run docker:up</li>
          <li>npm run docker:logs</li>
          <li>Open /demo pages on port 3000</li>
          <li>npm run docker:down</li>
        </ol>
      </section>
      <section class="panel">
        <h2>CI Pipeline</h2>
        <p>The CI workflow runs install, typecheck, API readiness, demo page render checks, correlation recompute, and Lighthouse accessibility checks.</p>
        <a class="button-link" href="/api/correlation/latest" target="_blank" rel="noreferrer">Open Correlation Output</a>
      </section>
    `,
  });
}

function createShell(input: {
  pageTitle: string;
  heading: string;
  subtitle: string;
  body: string;
}): string {
  const navLinks = [
    ["Demo Home", "/demo"],
    ["Dashboard", "/demo/dashboard"],
    ["Health", "/demo/health"],
    ["Correlation", "/demo/correlation"],
    ["Monitoring", "/demo/monitoring"],
    ["Accessibility", "/demo/accessibility"],
    ["DevOps", "/demo/devops"],
  ] as const;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.pageTitle)}</title>
    <style>
      :root {
        --bg: #d7d7db;
        --shell: #f4f3e9;
        --surface: #faf8f1;
        --surface-strong: #f1eedf;
        --text: #23252b;
        --muted: #74756d;
        --line: #ddd9c8;
        --accent: #e6cf68;
        --accent-strong: #d4bb4f;
        --charcoal: #2f3137;
        --charcoal-soft: #3e4148;
        --good: #276f52;
        --warn: #a06a0c;
        --bad: #a62e2e;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Avenir Next", "Trebuchet MS", "Segoe UI", sans-serif;
        color: var(--text);
        background: radial-gradient(circle at 0% 0%, #ecebe0 0%, transparent 42%),
          radial-gradient(circle at 100% 0%, #efe0aa 0%, transparent 36%),
          linear-gradient(180deg, #dbdadf, #d2d2d8);
      }

      .stage {
        width: min(1280px, 96vw);
        margin: 1rem auto;
        padding: 1rem;
      }

      .shell {
        background: linear-gradient(145deg, #f8f6ec 0%, #f2efdf 100%);
        border: 1px solid #e2dece;
        border-radius: 1.8rem;
        padding: 1.1rem;
        box-shadow: 0 26px 50px -40px rgba(15, 19, 27, 0.85);
      }

      .wrap {
        width: 100%;
        margin: 0;
        padding: 0;
      }

      .top-row {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.8rem;
        margin-bottom: 1rem;
      }

      .brand {
        text-decoration: none;
        color: var(--charcoal);
        font-weight: 700;
        background: #f1f0e8;
        border: 1px solid #cfc9b9;
        border-radius: 999px;
        padding: 0.46rem 1rem;
        letter-spacing: 0.01em;
      }

      .topbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        background: rgba(255, 255, 255, 0.58);
        border: 1px solid #d9d4c3;
        border-radius: 999px;
        padding: 0.3rem;
        justify-content: center;
      }

      .topbar a,
      .quick-action {
        text-decoration: none;
        border: 1px solid transparent;
        border-radius: 999px;
        padding: 0.38rem 0.8rem;
        color: var(--muted);
        background: transparent;
        font-size: 0.84rem;
        font-weight: 600;
      }

      .topbar a:hover {
        border-color: #d3c992;
        color: var(--charcoal);
        background: #f8f6e8;
      }

      .topbar a.active {
        background: var(--charcoal);
        color: #fff;
      }

      .quick-action {
        border-color: #d3ceb9;
        background: #fbfaf3;
      }

      .quick-action:hover {
        color: var(--charcoal);
        border-color: #bdb39a;
      }

      header {
        background: linear-gradient(130deg, #f8f6eb 0%, #efe8c3 62%, #e9da8f 100%);
        color: var(--text);
        border: 1px solid #ddd6ba;
        border-radius: 1.2rem;
        padding: 1.2rem 1.3rem;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
        margin-bottom: 1rem;
      }

      h1 {
        margin: 0;
        letter-spacing: 0.01em;
        font-weight: 700;
      }

      header p {
        margin: 0.45rem 0 0;
        color: #4f5148;
      }

      .panel {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 1.1rem;
        padding: 1rem;
        margin-top: 1rem;
        box-shadow: 0 14px 28px -26px rgba(22, 26, 32, 0.8);
      }

      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.8rem;
        flex-wrap: wrap;
      }

      .toolbar-actions {
        display: flex;
        gap: 0.6rem;
        align-items: center;
      }

      button,
      .button-link {
        border-radius: 999px;
        border: 1px solid #d7be5a;
        background: var(--accent);
        color: #25272d;
        font-weight: 700;
        padding: 0.5rem 0.95rem;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
      }

      button:hover,
      .button-link:hover {
        background: var(--accent-strong);
        border-color: #bda447;
      }

      .label {
        color: var(--muted);
        font-size: 0.8rem;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        font-weight: 600;
      }

      .mono,
      .mono-list {
        font-family: "Consolas", "Courier New", monospace;
      }

      .metric-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.7rem;
        margin-top: 1rem;
      }

      .metric {
        border: 1px solid var(--line);
        background: linear-gradient(180deg, #fbfaf2 0%, #f4f1e4 100%);
        border-radius: 1rem;
        padding: 0.8rem;
        display: grid;
        gap: 0.4rem;
        min-height: 86px;
      }

      .metric strong {
        font-size: 1.18rem;
      }

      .metric.good {
        border-color: rgba(39, 111, 82, 0.4);
      }

      .metric.warn {
        border-color: rgba(160, 106, 12, 0.42);
      }

      .metric.bad {
        border-color: rgba(166, 46, 46, 0.42);
      }

      .metric.neutral {
        border-color: #d9d3ba;
      }

      .stack {
        display: grid;
        gap: 0.8rem;
      }

      .mini-card {
        border: 1px solid var(--line);
        border-radius: 1rem;
        padding: 0.9rem;
        background: linear-gradient(180deg, #fbfaf2 0%, #f5f2e8 100%);
      }

      .mini-card h3 {
        margin: 0 0 0.55rem;
        font-size: 1rem;
      }

      .mini-card ul {
        margin: 0;
        padding-left: 1.1rem;
        display: grid;
        gap: 0.35rem;
      }

      .mini-card li {
        color: #3e4038;
      }

      .mini-card dl {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 0.4rem 0.8rem;
        margin: 0;
      }

      .mini-card dt {
        color: var(--muted);
      }

      .mini-card dd {
        margin: 0;
      }

      .json-block {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 360px;
        overflow: auto;
        background: var(--charcoal);
        color: #eceef1;
        border: 1px solid #4c505a;
        border-radius: 0.95rem;
        padding: 0.85rem;
      }

      .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 0.8rem;
      }

      .demo-card {
        text-decoration: none;
        color: inherit;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, #fcfbf4 0%, #f3efdf 100%);
        border-radius: 1.05rem;
        padding: 1rem;
        display: grid;
        gap: 0.55rem;
      }

      .demo-card:hover {
        border-color: #bfb181;
        transform: translateY(-2px);
        box-shadow: 0 14px 28px -24px rgba(40, 41, 35, 0.65);
        transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .demo-card h3 {
        margin: 0;
        font-size: 1.03rem;
      }

      .demo-card p {
        margin: 0;
        color: #585b51;
      }

      .mono {
        color: var(--charcoal-soft);
        background: rgba(233, 226, 196, 0.52);
        border-radius: 999px;
        width: fit-content;
        padding: 0.2rem 0.55rem;
        border: 1px solid #d5cda8;
      }

      ol li {
        margin: 0.36rem 0;
      }

      @media (max-width: 760px) {
        .stage {
          width: 96vw;
          margin: 0.35rem auto;
          padding: 0.45rem;
        }

        .shell {
          border-radius: 1.25rem;
          padding: 0.8rem;
        }

        .top-row {
          grid-template-columns: 1fr;
          justify-items: start;
        }

        .topbar {
          justify-content: flex-start;
          border-radius: 0.9rem;
        }

        .toolbar-actions {
          width: 100%;
          justify-content: flex-start;
        }
      }
    </style>
  </head>
  <body>
    <main class="stage">
      <section class="shell">
        <section class="wrap">
          <div class="top-row">
            <a href="/demo" class="brand">Aegis Console</a>
            <nav class="topbar">
              ${navLinks
                .map(([label, href]) => `<a class="nav-link" href="${href}">${label}</a>`)
                .join("")}
            </nav>
            <a class="quick-action" href="/demo/devops">Runbook</a>
          </div>
          <header>
            <h1>${escapeHtml(input.heading)}</h1>
            <p>${escapeHtml(input.subtitle)}</p>
          </header>
          ${input.body}
        </section>
      </section>
    </main>
    <script>
      const links = document.querySelectorAll(".nav-link");
      const currentPath = window.location.pathname;
      links.forEach((link) => {
        if (link.getAttribute("href") === currentPath) {
          link.classList.add("active");
        }
      });
    </script>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
