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
        --bg: #f5f6f8;
        --surface: #ffffff;
        --surface-alt: #f9fafb;
        --border: #e1e4e8;
        --text: #24292e;
        --text-secondary: #586069;
        --text-muted: #6a737d;
        --accent: #d4bb4f;
        --accent-strong: #c9a944;
        --status-success: #28a745;
        --status-warning: #d3a625;
      }

      html, body {
        width: 100%;
        height: 100%;
        background: var(--bg);
        color: var(--text);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
        line-height: 1.5;
        overflow-x: hidden;
      }

      .container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 24px;
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border);
      }

      .header-title h1 {
        font-size: 28px;
        font-weight: 600;
        color: var(--text);
        margin: 0 0 4px 0;
      }

      .header-title p {
        font-size: 13px;
        color: var(--text-muted);
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      button {
        background: var(--accent);
        color: #000;
        border: 1px solid #a68f2e;
        padding: 6px 16px;
        border-radius: 4px;
        font-weight: 500;
        font-size: 13px;
        cursor: pointer;
        transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
      }

      button:hover {
        background: var(--accent-strong);
        box-shadow: 0 2px 10px rgba(201, 169, 68, 0.35);
      }

      button:active {
        transform: translateY(1px) scale(0.98);
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
        padding: 4px 12px;
        background: var(--surface-alt);
        border: 1px solid var(--border);
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-indicator.live {
        border-color: var(--status-success);
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--status-success);
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      }

      .metric-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 16px;
        transition: box-shadow 0.2s ease;
      }

      .metric-card:hover {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      }

      .metric-label {
        display: block;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
        margin-bottom: 8px;
      }

      .metric-value {
        display: block;
        font-size: 32px;
        font-weight: 600;
        color: var(--accent);
        margin-bottom: 8px;
        line-height: 1.2;
      }

      .metric-subtitle {
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 12px;
      }

      .metric-status {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .metric-status.healthy {
        background: #f0f9f4;
        color: var(--status-success);
      }

      .metric-status.warning {
        background: #fef4e6;
        color: var(--status-warning);
      }

      .metric-status.critical {
        background: #fef8e1;
        color: #8f7410;
      }

      .section {
        margin-bottom: 32px;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border);
        color: var(--text);
      }

      .alerts-list, .issues-list {
        display: grid;
        gap: 12px;
      }

      .alert-item, .issue-item {
        background: var(--surface);
        border: 1px solid var(--border);
        border-left: 3px solid var(--accent);
        border-radius: 4px;
        padding: 12px;
        transition: background-color 0.2s ease;
      }

      .alert-item:hover, .issue-item:hover {
        background: var(--surface-alt);
      }

      .alert-item.critical {
        border-left-color: var(--accent);
      }

      .alert-item.warning {
        border-left-color: var(--status-warning);
      }

      .alert-item.success {
        border-left-color: var(--accent);
      }

      .alert-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 6px;
      }

      .alert-service {
        font-weight: 600;
        font-size: 13px;
        color: var(--text);
      }

      .alert-severity {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .alert-severity.critical {
        background: #fef8e1;
        color: #8f7410;
      }

      .alert-severity.high {
        background: #fef4e6;
        color: var(--status-warning);
      }

      .alert-severity.medium {
        background: #fef8e1;
        color: #8f7410;
      }

      .alert-message {
        color: var(--text-secondary);
        font-size: 12px;
        margin-bottom: 6px;
      }

      .alert-timestamp {
        font-size: 11px;
        color: var(--text-muted);
      }

      .worker-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .worker-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text);
        margin-bottom: 12px;
      }

      .worker-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 12px;
      }

      .info-item {
        background: var(--surface-alt);
        padding: 12px;
        border-radius: 4px;
        border: 1px solid var(--border);
      }

      .info-label {
        display: block;
        color: var(--text-muted);
        font-size: 11px;
        text-transform: uppercase;
        font-weight: 600;
        margin-bottom: 4px;
        letter-spacing: 0.5px;
      }

      .info-value {
        color: var(--text);
        font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
        font-size: 13px;
        word-break: break-word;
      }

      .empty-state {
        text-align: center;
        padding: 32px;
        color: var(--text-muted);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 4px;
      }

      .empty-state-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }

      .loading {
        text-align: center;
        padding: 24px;
        color: var(--text-muted);
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
        font-size: 12px;
      }

      .correlation-table th {
        text-align: left;
        padding: 10px;
        background: var(--surface-alt);
        border-bottom: 2px solid var(--border);
        font-weight: 600;
        color: var(--text);
      }

      .correlation-table td {
        padding: 10px;
        border-bottom: 1px solid var(--border);
      }

      .correlation-table tr:hover {
        background: var(--surface-alt);
      }

      .correlation-label {
        font-weight: 600;
        color: var(--text);
      }

      .correlation-value {
        color: var(--text-secondary);
      }

      .priority-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        font-weight: 600;
        font-size: 11px;
      }

      .priority-badge.p1 {
        background: #fef8e1;
        color: #8f7410;
      }

      .priority-badge.p2 {
        background: #fef4e6;
        color: var(--status-warning);
      }

      .priority-badge.p3 {
        background: #fef8e1;
        color: #8f7410;
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
          font-size: 24px;
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
