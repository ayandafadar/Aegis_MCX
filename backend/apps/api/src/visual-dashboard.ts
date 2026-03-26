export function buildVisualDashboard(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Aegis MCX - Visual Dashboard</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      :root {
        --background: #f8fafc;
        --foreground: #0f172a;
        --card: #ffffff;
        --card-foreground: #0f172a;
        --muted: #f1f5f9;
        --muted-foreground: #64748b;
        --border: #e2e8f0;
        --ring: #facc15;
        --accent: #facc15;
        --accent-foreground: #1f2937;
        --success: #16a34a;
        --warning: #ca8a04;
      }

      html, body {
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at 0% 0%, #eef2ff 0%, transparent 30%),
          radial-gradient(circle at 100% 0%, #fff9db 0%, transparent 32%),
          var(--background);
        color: var(--foreground);
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.5;
        overflow-x: hidden;
      }

      .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 24px 20px 40px;
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 16px;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(6px);
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
      }

      .header-title h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--foreground);
        margin: 0 0 4px 0;
        letter-spacing: -0.015em;
      }

      .header-title p {
        font-size: 0.875rem;
        color: var(--muted-foreground);
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      button {
        background: var(--accent);
        color: var(--accent-foreground);
        border: 1px solid #eab308;
        padding: 8px 14px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
      }

      button:hover {
        background: #fbbf24;
        box-shadow: 0 4px 16px rgba(250, 204, 21, 0.25);
      }

      button:active {
        transform: translateY(1px) scale(0.98);
      }

      button:focus-visible {
        outline: 2px solid var(--ring);
        outline-offset: 2px;
      }

      button.is-refreshing {
        pointer-events: none;
        opacity: 0.9;
      }

      button .spin {
        display: inline-block;
        margin-right: 6px;
      }

      button.is-refreshing .spin {
        animation: spin 0.65s linear;
      }

      .status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--muted);
        border: 1px solid var(--border);
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--muted-foreground);
      }

      .status-indicator.live {
        border-color: #86efac;
        color: #166534;
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--success);
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
      }

      .metric-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 14px;
        transition: box-shadow 0.2s ease, transform 0.2s ease;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      }

      .metric-card:hover {
        box-shadow: 0 10px 24px -18px rgba(15, 23, 42, 0.4);
        transform: translateY(-1px);
      }

      .metric-label {
        display: block;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted-foreground);
        margin-bottom: 6px;
      }

      .metric-value {
        display: block;
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--accent);
        margin-bottom: 6px;
        line-height: 1.2;
      }

      .metric-subtitle {
        font-size: 0.8rem;
        color: var(--muted-foreground);
        margin-bottom: 10px;
      }

      .metric-status {
        display: inline-block;
        padding: 2px 9px;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        border: 1px solid transparent;
      }

      .metric-status.healthy {
        background: #f0fdf4;
        color: #166534;
        border-color: #bbf7d0;
      }

      .metric-status.warning {
        background: #fefce8;
        color: #854d0e;
        border-color: #fde68a;
      }

      .metric-status.critical {
        background: #fef8e1;
        color: #8f7410;
        border-color: #fde68a;
      }

      .section {
        margin-bottom: 16px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 14px;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      }

      .section-title {
        font-size: 0.98rem;
        font-weight: 600;
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border);
        color: var(--card-foreground);
      }

      .alerts-list, .issues-list {
        display: grid;
        gap: 10px;
      }

      .alert-item, .issue-item {
        background: var(--card);
        border: 1px solid var(--border);
        border-left: 1px solid var(--border);
        border-radius: 10px;
        padding: 11px;
        transition: background-color 0.2s ease, border-color 0.2s ease;
      }

      .alert-item:hover, .issue-item:hover {
        background: var(--muted);
        border-color: #cbd5e1;
      }

      .alert-item.critical {
        border-left-color: var(--border);
      }

      .alert-item.warning {
        border-left-color: var(--border);
      }

      .alert-item.success {
        border-left-color: var(--border);
      }

      .alert-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 6px;
      }

      .alert-service {
        font-weight: 600;
        font-size: 0.88rem;
        color: var(--card-foreground);
      }

      .alert-severity {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 600;
        text-transform: uppercase;
        border: 1px solid transparent;
      }

      .alert-severity.critical {
        background: #fefce8;
        color: #854d0e;
        border-color: #fde68a;
      }

      .alert-severity.high {
        background: #fef9c3;
        color: #854d0e;
        border-color: #fde047;
      }

      .alert-severity.medium {
        background: #fefce8;
        color: #854d0e;
        border-color: #fde68a;
      }

      .alert-message {
        color: #334155;
        font-size: 0.8rem;
        margin-bottom: 6px;
      }

      .alert-timestamp {
        font-size: 0.72rem;
        color: var(--muted-foreground);
      }

      .worker-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 0;
      }

      .worker-title {
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--card-foreground);
        margin-bottom: 12px;
      }

      .worker-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 12px;
      }

      .info-item {
        background: var(--muted);
        padding: 10px;
        border-radius: 10px;
        border: 1px solid var(--border);
      }

      .info-label {
        display: block;
        color: var(--muted-foreground);
        font-size: 0.68rem;
        text-transform: uppercase;
        font-weight: 600;
        margin-bottom: 4px;
        letter-spacing: 0.08em;
      }

      .info-value {
        color: var(--card-foreground);
        font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
        font-size: 0.76rem;
        word-break: break-word;
      }

      .empty-state {
        text-align: center;
        padding: 32px;
        color: var(--muted-foreground);
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 10px;
      }

      .empty-state-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }

      .loading {
        text-align: center;
        padding: 24px;
        color: var(--muted-foreground);
      }

      .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid var(--border);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .correlation-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8rem;
      }

      .correlation-table th {
        text-align: left;
        padding: 10px;
        background: var(--muted);
        border-bottom: 2px solid var(--border);
        font-weight: 600;
        color: var(--card-foreground);
      }

      .correlation-table td {
        padding: 10px;
        border-bottom: 1px solid var(--border);
      }

      .correlation-table tr:hover {
        background: var(--muted);
      }

      .correlation-label {
        font-weight: 600;
        color: var(--card-foreground);
      }

      .correlation-value {
        color: #334155;
      }

      .priority-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.68rem;
        border: 1px solid transparent;
      }

      .priority-badge.p1 {
        background: #fefce8;
        color: #854d0e;
        border-color: #fde68a;
      }

      .priority-badge.p2 {
        background: #fef9c3;
        color: #854d0e;
        border-color: #fde047;
      }

      .priority-badge.p3 {
        background: #fefce8;
        color: #854d0e;
        border-color: #fde68a;
      }

      @media (max-width: 768px) {
        .container {
          padding: 16px;
        }

        header {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .header-actions {
          width: 100%;
          flex-wrap: wrap;
        }

        button {
          flex: 1;
          min-width: 120px;
        }

        .metrics-grid {
          grid-template-columns: 1fr;
        }

        .metric-value {
          font-size: 1.45rem;
        }

        .worker-info {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <div class="header-title">
          <h1>Aegis MCX Dashboard</h1>
          <p>Real-time market monitoring & alert correlation</p>
        </div>
        <div class="header-actions">
          <div class="status-indicator live">
            <div class="dot"></div>
            <span>Live</span>
          </div>
          <button id="refreshButton" type="button" onclick="refreshDashboard(true)"><span class="spin">↻</span>Refresh</button>
        </div>
      </header>

      <!-- Key Metrics -->
      <div class="metrics-grid" id="metricsContainer">
        <div class="metric-card">
          <div class="metric-label">Active Alerts</div>
          <div class="metric-value" id="activeAlerts">–</div>
          <div class="metric-subtitle">Currently Firing</div>
          <div class="metric-status warning" id="alertStatus">Loading...</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Open Issues</div>
          <div class="metric-value" id="openIssues">–</div>
          <div class="metric-subtitle">Accessibility Findings</div>
          <div class="metric-status warning" id="issueStatus">Loading...</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Market Instruments</div>
          <div class="metric-value" id="instruments">–</div>
          <div class="metric-subtitle">Tracked Commodities</div>
          <div class="metric-status healthy" id="instrumentStatus">Healthy</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Worker Status</div>
          <div class="metric-value" id="workerStatus">–</div>
          <div class="metric-subtitle">Correlation Engine</div>
          <div class="metric-status" id="workerStatusBadge">Loading...</div>
        </div>
      </div>

      <!-- Monitoring Alerts Section -->
      <div class="section">
        <h2 class="section-title">Active Monitoring Alerts</h2>
        <div id="alertsContainer" class="alerts-list">
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading alerts...</p>
          </div>
        </div>
      </div>

      <!-- Accessibility Issues Section -->
      <div class="section">
        <h2 class="section-title">Accessibility Issues</h2>
        <div id="issuesContainer" class="issues-list">
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading issues...</p>
          </div>
        </div>
      </div>

      <!-- Correlation Section -->
      <div class="section">
        <h2 class="section-title">Latest Correlation Analysis</h2>
        <div id="correlationContainer">
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading correlation data...</p>
          </div>
        </div>
      </div>

      <!-- Worker Details -->
      <div class="section">
        <h2 class="section-title">Worker Details</h2>
        <div id="workerContainer" class="worker-card">
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading worker information...</p>
          </div>
        </div>
      </div>
    </div>

    <script>
      const refreshButton = document.getElementById('refreshButton');

      async function refreshDashboard(triggeredByClick = false) {
        if (triggeredByClick && refreshButton) {
          refreshButton.classList.add('is-refreshing');
          refreshButton.setAttribute('aria-busy', 'true');
        }

        try {
          const dashboard = await fetch('/api/dashboard').then(r => r.json());
          const health = await fetch('/health').then(r => r.json());
          const correlation = await fetch('/api/correlation/latest').then(r => r.json());
          
          updateMetrics(dashboard, health);
          updateAlerts(dashboard);
          updateIssues(dashboard);
          updateCorrelation(correlation);
          updateWorker(health);
        } catch (error) {
          console.error('Error refreshing dashboard:', error);
        } finally {
          if (triggeredByClick && refreshButton) {
            window.setTimeout(() => {
              refreshButton.classList.remove('is-refreshing');
              refreshButton.removeAttribute('aria-busy');
            }, 220);
          }
        }
      }

      function updateMetrics(dashboard, health) {
        // Active Alerts
        const activeAlerts = dashboard.monitoring?.activeAlertCount || 0;
        document.getElementById('activeAlerts').textContent = activeAlerts;
        const alertStatus = document.getElementById('alertStatus');
        if (activeAlerts === 0) {
          alertStatus.className = 'metric-status healthy';
          alertStatus.textContent = 'Healthy';
        } else if (activeAlerts > 5) {
          alertStatus.className = 'metric-status critical';
          alertStatus.textContent = 'Critical';
        } else {
          alertStatus.className = 'metric-status warning';
          alertStatus.textContent = 'Active';
        }

        // Open Issues
        const openIssues = dashboard.accessibility?.openIssueCount || 0;
        document.getElementById('openIssues').textContent = openIssues;
        const issueStatus = document.getElementById('issueStatus');
        if (openIssues === 0) {
          issueStatus.className = 'metric-status healthy';
          issueStatus.textContent = 'None';
        } else if (openIssues > 10) {
          issueStatus.className = 'metric-status critical';
          issueStatus.textContent = 'Critical';
        } else {
          issueStatus.className = 'metric-status warning';
          issueStatus.textContent = 'Review Needed';
        }

        // Instruments
        const instrumentCount = dashboard.market?.dailyMargins?.length || 0;
        document.getElementById('instruments').textContent = instrumentCount;

        // Worker Status
        const workerStatus = health.worker?.status || 'unknown';
        document.getElementById('workerStatus').textContent = workerStatus.charAt(0).toUpperCase() + workerStatus.slice(1);
        const workerBadge = document.getElementById('workerStatusBadge');
        if (workerStatus === 'healthy') {
          workerBadge.className = 'metric-status healthy';
          workerBadge.textContent = 'Operational';
        } else {
          workerBadge.className = 'metric-status warning';
          workerBadge.textContent = 'Check Status';
        }
      }

      function updateAlerts(dashboard) {
        const container = document.getElementById('alertsContainer');
        const alerts = dashboard.monitoring?.alerts || [];

        if (alerts.length === 0) {
          container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✓</div><p>No active alerts</p></div>';
          return;
        }

        container.innerHTML = alerts.map((alert, idx) => \`
          <div class="alert-item \${alert.severity}">
            <div class="alert-header">
              <span class="alert-service">\${escapeHtml(alert.service || 'Unknown')}</span>
              <span class="alert-severity \${(alert.severity || 'medium').toLowerCase()}">\${escapeHtml(alert.severity || 'Medium')}</span>
            </div>
            <div class="alert-message">\${escapeHtml(alert.message || 'No message')}</div>
            <div class="alert-timestamp">\${new Date(alert.timestamp || 0).toLocaleString()}</div>
          </div>
        \`).join('');
      }

      function updateIssues(dashboard) {
        const container = document.getElementById('issuesContainer');
        const issues = dashboard.accessibility?.openIssues || [];

        if (issues.length === 0) {
          container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✓</div><p>No open accessibility issues</p></div>';
          return;
        }

        container.innerHTML = issues.slice(0, 10).map(issue => \`
          <div class="issue-item">
            <div class="alert-header">
              <span class="alert-service">\${escapeHtml(issue.page || 'Unknown Page')}</span>
              <span class="alert-severity \${(issue.severity || 'moderate').toLowerCase()}">\${escapeHtml(issue.severity || 'Moderate')}</span>
            </div>
            <div class="alert-message"><strong>\${escapeHtml(issue.criterion || 'Unknown')}</strong>: \${escapeHtml(issue.description || 'No description')}</div>
            <div class="alert-timestamp">Issue ID: \${escapeHtml(issue.id || 'N/A')}</div>
          </div>
        \`).join('');
      }

      function updateCorrelation(correlation) {
        const container = document.getElementById('correlationContainer');
        if (!correlation.item) {
          container.innerHTML = '<div class="empty-state"><p>No correlation data available</p></div>';
          return;
        }

        const item = correlation.item;
        const top = item.topPriorityAlert || {};
        const priorityClass = (top.priority || 'P3').toLowerCase().replace(/\s+/g, '');

        container.innerHTML = \`
          <div class="correlation-card">
            <table class="correlation-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="correlation-label">Priority</td>
                  <td class="correlation-value"><span class="priority-badge \${priorityClass}">\${escapeHtml(top.priority || 'N/A')}</span></td>
                </tr>
                <tr>
                  <td class="correlation-label">Service</td>
                  <td class="correlation-value">\${escapeHtml(top.service || 'N/A')}</td>
                </tr>
                <tr>
                  <td class="correlation-label">Summary</td>
                  <td class="correlation-value">\${escapeHtml(top.summary || 'No summary')}</td>
                </tr>
                <tr>
                  <td class="correlation-label">Score</td>
                  <td class="correlation-value">\${(top.score || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="correlation-label">Correlated Alerts</td>
                  <td class="correlation-value">\${item.stats?.correlatedAlertCount || 0}</td>
                </tr>
                <tr>
                  <td class="correlation-label">Alert Noise Reduction</td>
                  <td class="correlation-value">\${(item.stats?.alertNoiseReduction || 0).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        \`;
      }

      function updateWorker(health) {
        const container = document.getElementById('workerContainer');
        const worker = health.worker || {};

        container.innerHTML = \`
          <div>
            <div class="worker-title">Correlation Engine Status</div>
            <div class="worker-info">
              <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">\${escapeHtml(worker.status || 'Unknown')}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Last Heartbeat</div>
                <div class="info-value">\${worker.lastHeartbeatAt ? new Date(worker.lastHeartbeatAt).toLocaleString() : 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">API Base URL</div>
                <div class="info-value">\${escapeHtml(worker.apiBaseUrl || 'N/A')}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Poll Interval</div>
                <div class="info-value">\${worker.pollIntervalMs ? worker.pollIntervalMs + 'ms' : 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Last Correlation ID</div>
                <div class="info-value">\${escapeHtml(worker.lastCorrelationId || 'N/A')}</div>
              </div>
            </div>
          </div>
        \`;
      }

      function escapeHtml(text) {
        const map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
      }

      // Initial load and auto-refresh
      refreshDashboard();
      setInterval(refreshDashboard, 5000);
    </script>
  </body>
</html>
`;
}
