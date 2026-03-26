export function buildVisualDashboard(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Aegis MCX - Operations Center</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#060b14;--bg2:#0b1220;--card:#0f1929;--card2:#131f30;--card3:#172236;
  --border:#1c2d42;--border2:#243650;
  --accent:#f59e0b;--blue:#3b82f6;--green:#10b981;--red:#ef4444;--purple:#8b5cf6;--cyan:#06b6d4;
  --text:#e2e8f0;--text2:#94a3b8;--text3:#64748b;
  --font:'Inter',system-ui,sans-serif;
}
html,body{width:100%;min-height:100%;background:var(--bg);color:var(--text);font-family:var(--font);overflow-x:hidden;font-size:14px}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 50% at 20% -10%,rgba(59,130,246,.06),transparent),radial-gradient(ellipse 60% 40% at 80% 110%,rgba(139,92,246,.05),transparent);pointer-events:none;z-index:0}
nav{position:sticky;top:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:56px;background:rgba(6,11,20,.92);border-bottom:1px solid var(--border);backdrop-filter:blur(16px)}
.nav-brand{display:flex;align-items:center;gap:10px}
.nav-logo{width:32px;height:32px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:8px;display:grid;place-items:center;font-weight:900;font-size:15px;color:#000;flex-shrink:0}
.nav-title{font-weight:700;font-size:.95rem;letter-spacing:-.02em}
.nav-sub{font-size:.65rem;color:var(--text3);margin-top:1px}
.nav-tabs{display:flex;gap:2px}
.tab{padding:6px 14px;border-radius:6px;font-size:.78rem;font-weight:500;cursor:pointer;color:var(--text3);border:none;background:transparent;transition:all .2s}
.tab:hover{color:var(--text);background:rgba(255,255,255,.05)}
.tab.active{color:var(--accent);background:rgba(245,158,11,.08);font-weight:600}
.nav-right{display:flex;align-items:center;gap:10px}
.live-pill{display:flex;align-items:center;gap:5px;padding:4px 10px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:999px;font-size:.68rem;font-weight:600;color:var(--green)}
.live-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:blink 2s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.btn{padding:6px 14px;border-radius:7px;font-size:.75rem;font-weight:600;cursor:pointer;border:none;transition:all .18s;font-family:var(--font)}
.btn-accent{background:var(--accent);color:#000}.btn-accent:hover{background:#fbbf24}
.btn-ghost{background:rgba(255,255,255,.05);color:var(--text2);border:1px solid var(--border)}.btn-ghost:hover{background:rgba(255,255,255,.09)}
.page{display:none;padding:20px 24px 32px;max-width:1600px;margin:0 auto;position:relative;z-index:1}
.page.active{display:block;animation:fadeUp .3s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.mb{margin-bottom:16px}
@media(max-width:1100px){.g2,.g3,.g4{grid-template-columns:1fr 1fr}}
@media(max-width:700px){.g2,.g3,.g4{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px}
.card-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border)}
.card-title{display:flex;align-items:center;gap:8px;font-size:.82rem;font-weight:700;color:var(--text)}
.card-icon{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;font-size:13px;flex-shrink:0}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;position:relative;overflow:hidden;transition:border-color .2s,transform .2s}
.stat-card:hover{border-color:var(--border2);transform:translateY(-1px)}
.stat-card::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--sc-color,var(--accent))}
.stat-label{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:8px}
.stat-val{font-size:2rem;font-weight:800;line-height:1;color:var(--sc-color,var(--accent));margin-bottom:4px}
.stat-sub{font-size:.72rem;color:var(--text3)}
.stat-badge{display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:2px 8px;border-radius:999px;font-size:.62rem;font-weight:700;border:1px solid transparent}
.bg{background:rgba(16,185,129,.08);color:var(--green);border-color:rgba(16,185,129,.2)}
.by{background:rgba(245,158,11,.08);color:var(--accent);border-color:rgba(245,158,11,.2)}
.br{background:rgba(239,68,68,.08);color:var(--red);border-color:rgba(239,68,68,.2)}
.bb{background:rgba(59,130,246,.08);color:var(--blue);border-color:rgba(59,130,246,.2)}
.bp{background:rgba(139,92,246,.08);color:var(--purple);border-color:rgba(139,92,246,.2)}
.stat-icon{position:absolute;bottom:12px;right:14px;font-size:1.6rem;opacity:.08}
.chart-box{position:relative}
.h160{height:160px}.h200{height:200px}.h240{height:240px}.h280{height:280px}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:.62rem;font-weight:700;text-transform:uppercase}
.pill-critical{background:rgba(239,68,68,.12);color:var(--red)}
.pill-high{background:rgba(245,158,11,.12);color:var(--accent)}
.pill-medium{background:rgba(59,130,246,.12);color:var(--blue)}
.pill-low{background:rgba(100,116,139,.12);color:var(--text3)}
.pill-serious{background:rgba(245,158,11,.12);color:var(--accent)}
.pill-moderate{background:rgba(139,92,246,.12);color:var(--purple)}
.pill-minor{background:rgba(100,116,139,.12);color:var(--text3)}
.pill-p1{background:rgba(239,68,68,.15);color:var(--red);font-size:.75rem;padding:3px 10px}
.pill-p2{background:rgba(245,158,11,.15);color:var(--accent);font-size:.75rem;padding:3px 10px}
.pill-p3{background:rgba(59,130,246,.15);color:var(--blue);font-size:.75rem;padding:3px 10px}
.pill-p4{background:rgba(100,116,139,.15);color:var(--text3);font-size:.75rem;padding:3px 10px}
.pill-green{background:rgba(16,185,129,.12);color:var(--green)}
.pill-blue{background:rgba(59,130,246,.12);color:var(--blue)}
.scroll-y{overflow-y:auto;max-height:340px}
.scroll-y::-webkit-scrollbar{width:3px}
.scroll-y::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
.tbl{width:100%;border-collapse:collapse;font-size:.78rem}
.tbl th{text-align:left;padding:8px 10px;color:var(--text3);font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--border);white-space:nowrap}
.tbl td{padding:9px 10px;border-bottom:1px solid rgba(28,45,66,.6);vertical-align:middle}
.tbl tr:last-child td{border-bottom:none}
.tbl tr:hover td{background:rgba(255,255,255,.015)}
.tbl .num{text-align:right;font-variant-numeric:tabular-nums;font-family:monospace}
.up{color:var(--green)}.dn{color:var(--red)}.neu{color:var(--text3)}
.alert-row{display:flex;gap:10px;padding:10px 12px;background:var(--card2);border:1px solid var(--border);border-radius:9px;margin-bottom:8px;transition:border-color .2s}
.alert-row:hover{border-color:var(--border2)}
.alert-row:last-child{margin-bottom:0}
.a-dot{width:8px;height:8px;border-radius:50%;margin-top:3px;flex-shrink:0}
.a-dot.critical{background:var(--red);box-shadow:0 0 6px rgba(239,68,68,.5)}
.a-dot.high{background:var(--accent);box-shadow:0 0 6px rgba(245,158,11,.5)}
.a-dot.medium{background:var(--blue)}
.a-dot.low{background:var(--text3)}
.a-body{flex:1;min-width:0}
.a-svc{font-size:.8rem;font-weight:600;display:flex;align-items:center;gap:6px}
.a-msg{font-size:.72rem;color:var(--text2);margin-top:2px;line-height:1.4}
.a-meta{display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap}
.a-val{font-size:.68rem;color:var(--text3);font-family:monospace}
.a-time{font-size:.65rem;color:var(--text3)}
.corr-card{background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px}
.corr-card:last-child{margin-bottom:0}
.corr-card-hd{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.corr-score{font-size:.72rem;color:var(--text3);font-family:monospace}
.corr-summary{font-size:.82rem;color:var(--text);line-height:1.5;margin-bottom:8px}
.corr-stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
.corr-stat{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center}
.corr-stat-val{font-size:1.4rem;font-weight:800;color:var(--blue)}
.corr-stat-lbl{font-size:.6rem;color:var(--text3);margin-top:2px;text-transform:uppercase;letter-spacing:.06em}
.rationale{display:flex;flex-direction:column;gap:5px;margin-top:8px}
.rationale-item{font-size:.73rem;color:var(--text2);display:flex;gap:7px;line-height:1.4}
.rationale-item::before{content:'>';color:var(--accent);flex-shrink:0;font-weight:700}
.corr-issues{margin-top:8px;display:flex;flex-direction:column;gap:5px}
.corr-issue-row{background:var(--card);border:1px solid var(--border);border-radius:7px;padding:8px 10px;font-size:.75rem}
.corr-issue-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:3px}
.corr-issue-comp{font-weight:600;color:var(--text)}
.corr-issue-desc{color:var(--text2);line-height:1.4}
.gauge-bar{height:6px;background:var(--border);border-radius:3px;margin-top:6px;overflow:hidden}
.gauge-fill{height:100%;border-radius:3px;transition:width .6s ease}
.spread-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(28,45,66,.4)}
.spread-row:last-child{border-bottom:none}
.spread-label{font-size:.75rem;font-weight:600;width:80px;flex-shrink:0}
.spread-track{flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden}
.spread-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--blue),var(--cyan));transition:width .6s ease}
.spread-val{font-size:.7rem;font-family:monospace;color:var(--text3);width:60px;text-align:right;flex-shrink:0}
.worker-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}
.worker-item{background:var(--card2);border:1px solid var(--border);border-radius:9px;padding:10px}
.worker-lbl{font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:4px}
.worker-val{font-size:.76rem;font-family:monospace;color:var(--text);word-break:break-all}
.status-healthy{color:var(--green)}.status-degraded{color:var(--red)}.status-idle{color:var(--accent)}
.issue-card{background:var(--card2);border:1px solid var(--border);border-radius:9px;padding:11px;margin-bottom:8px;transition:border-color .2s}
.issue-card:hover{border-color:var(--border2)}
.issue-card:last-child{margin-bottom:0}
.issue-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:5px}
.issue-comp{font-size:.8rem;font-weight:600}
.issue-page{font-size:.65rem;color:var(--text3);margin-top:1px}
.issue-desc{font-size:.73rem;color:var(--text2);line-height:1.4;margin-bottom:5px}
.issue-impact{font-size:.68rem;color:var(--text3);font-style:italic;line-height:1.3}
.issue-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.tag{padding:1px 6px;background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.15);border-radius:4px;font-size:.6rem;color:var(--blue)}
.empty{text-align:center;padding:24px;color:var(--text3);font-size:.8rem}
.toast{position:fixed;bottom:20px;right:20px;background:var(--card2);border:1px solid var(--border2);border-radius:9px;padding:9px 16px;font-size:.78rem;color:var(--text);box-shadow:0 8px 32px rgba(0,0,0,.5);z-index:999;opacity:0;transform:translateY(8px);transition:all .25s;pointer-events:none}
.toast.show{opacity:1;transform:translateY(0)}
.timeline-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(28,45,66,.4)}
.timeline-row:last-child{border-bottom:none}
.timeline-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.timeline-info{flex:1;min-width:0}
.timeline-svc{font-size:.75rem;font-weight:600}
.timeline-time{font-size:.65rem;color:var(--text3);margin-top:2px}
.timeline-dur{font-size:.65rem;color:var(--accent);font-family:monospace;flex-shrink:0}
footer{text-align:center;padding:16px 24px;color:var(--text3);font-size:.68rem;border-top:1px solid var(--border);margin-top:8px;position:relative;z-index:1}
footer a{color:var(--blue);text-decoration:none}
footer a:hover{text-decoration:underline}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
</style>
</head>
<body>

<nav>
  <div class="nav-brand">
    <div class="nav-logo">A</div>
    <div>
      <div class="nav-title">Aegis MCX</div>
      <div class="nav-sub">Operations Center</div>
    </div>
  </div>
  <div class="nav-tabs">
    <button class="tab active" onclick="showPage('overview',this)">Overview</button>
    <button class="tab" onclick="showPage('market',this)">Market</button>
    <button class="tab" onclick="showPage('alerts',this)">Alerts &amp; Correlation</button>
    <button class="tab" onclick="showPage('accessibility',this)">Accessibility</button>
    <button class="tab" onclick="showPage('worker',this)">Worker</button>
  </div>
  <div class="nav-right">
    <div class="live-pill"><div class="live-dot"></div>Live</div>
    <span id="lastUpdated" style="font-size:.65rem;color:var(--text3)">-</span>
    <button class="btn btn-ghost" onclick="doRefresh(true)">Refresh</button>
  </div>
</nav>

<!-- OVERVIEW PAGE -->
<div class="page active" id="page-overview">
  <div class="g4 mb">
    <div class="stat-card" style="--sc-color:var(--red)">
      <div class="stat-label">Active Alerts</div>
      <div class="stat-val" id="kpi-alerts">-</div>
      <div class="stat-sub">Currently Firing</div>
      <div class="stat-badge br" id="kpi-alerts-badge">-</div>
      <div class="stat-icon">!</div>
    </div>
    <div class="stat-card" style="--sc-color:var(--purple)">
      <div class="stat-label">Open A11y Issues</div>
      <div class="stat-val" id="kpi-issues">-</div>
      <div class="stat-sub">Accessibility Findings</div>
      <div class="stat-badge bp" id="kpi-issues-badge">-</div>
      <div class="stat-icon">A</div>
    </div>
    <div class="stat-card" style="--sc-color:var(--accent)">
      <div class="stat-label">Noise Reduction</div>
      <div class="stat-val" id="kpi-noise">-</div>
      <div class="stat-sub">Alert Correlation Efficiency</div>
      <div class="stat-badge bb">AI-Powered</div>
      <div class="stat-icon">%</div>
    </div>
    <div class="stat-card" style="--sc-color:var(--green)">
      <div class="stat-label">Worker Status</div>
      <div class="stat-val" id="kpi-worker">-</div>
      <div class="stat-sub">Correlation Engine</div>
      <div class="stat-badge bg" id="kpi-worker-badge">-</div>
      <div class="stat-icon">W</div>
    </div>
  </div>

  <div class="g3 mb">
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(239,68,68,.1)">!</div>Alert Severity Mix</div>
        <span class="pill pill-blue" id="alertChartCount">-</span>
      </div>
      <div class="chart-box h200"><canvas id="chartAlertSev"></canvas></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(139,92,246,.1)">A</div>A11y Issue Severity</div>
        <span class="pill pill-blue" id="issueChartCount">-</span>
      </div>
      <div class="chart-box h200"><canvas id="chartIssueSev"></canvas></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(16,185,129,.1)">C</div>Correlation Scores</div>
      </div>
      <div class="chart-box h200"><canvas id="chartCorrScore"></canvas></div>
    </div>
  </div>

  <div class="g2 mb">
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(59,130,246,.1)">M</div>Daily Margin Totals</div>
        <span class="pill pill-green">INR</span>
      </div>
      <div class="chart-box h240"><canvas id="chartMargin"></canvas></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(6,182,212,.1)">D</div>Margin Delta vs Previous Day</div>
        <span class="pill pill-blue">Difference</span>
      </div>
      <div class="chart-box h240"><canvas id="chartMarginDiff"></canvas></div>
    </div>
  </div>

  <div class="g2 mb">
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(245,158,11,.1)">P</div>Top Priority Correlation</div>
        <span id="topCorrBadge" class="pill pill-critical">-</span>
      </div>
      <div id="topCorrContainer"><div class="empty">Loading...</div></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(239,68,68,.1)">!</div>Active Monitoring Alerts</div>
        <span class="pill pill-critical" id="alertListCount">0</span>
      </div>
      <div id="alertListContainer"><div class="empty">Loading...</div></div>
    </div>
  </div>
</div>

<!-- MARKET PAGE -->
<div class="page" id="page-market">
  <div class="card mb">
    <div class="card-hd">
      <div class="card-title"><div class="card-icon" style="background:rgba(16,185,129,.1)">M</div>MCX Market Watch - Live Contracts</div>
      <span class="pill pill-green">9 Instruments</span>
    </div>
    <div style="overflow-x:auto">
      <table class="tbl" id="marketTable">
        <thead><tr>
          <th>Instrument</th>
          <th class="num">Front Month</th>
          <th class="num">Next Month</th>
          <th class="num">Spread</th>
          <th class="num">Chg %</th>
          <th class="num">Volume</th>
          <th class="num">Open Interest</th>
          <th>Sentiment</th>
          <th>Contract</th>
        </tr></thead>
        <tbody id="marketTableBody"><tr><td colspan="9" class="empty">Loading...</td></tr></tbody>
      </table>
    </div>
  </div>

  <div class="g2 mb">
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(6,182,212,.1)">S</div>Front/Next Month Spread</div>
      </div>
      <div id="spreadBarsContainer"></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(59,130,246,.1)">V</div>Volume vs Open Interest</div>
      </div>
      <div class="chart-box h280"><canvas id="chartVolOI"></canvas></div>
    </div>
  </div>

  <div class="card mb">
    <div class="card-hd">
      <div class="card-title"><div class="card-icon" style="background:rgba(245,158,11,.1)">B</div>Margin Component Breakdown - All Instruments</div>
      <span class="pill pill-blue">Initial + ELM + Tender + Delivery + Add Spread + Spec Spread + Daily Vol + Annual Vol</span>
    </div>
    <div style="overflow-x:auto">
      <table class="tbl" id="marginBreakdownTable">
        <thead><tr>
          <th>Instrument</th>
          <th class="num">Initial</th>
          <th class="num">ELM</th>
          <th class="num">Tender</th>
          <th class="num">Delivery</th>
          <th class="num">Add Spread</th>
          <th class="num">Spec Spread</th>
          <th class="num">Daily Vol</th>
          <th class="num">Annual Vol</th>
          <th class="num">Total</th>
          <th class="num">Delta Prev</th>
        </tr></thead>
        <tbody id="marginBreakdownBody"><tr><td colspan="11" class="empty">Loading...</td></tr></tbody>
      </table>
    </div>
  </div>

  <div class="card mb">
    <div class="card-hd">
      <div class="card-title"><div class="card-icon" style="background:rgba(139,92,246,.1)">S</div>Stacked Margin Components</div>
    </div>
    <div class="chart-box h280"><canvas id="chartMarginStacked"></canvas></div>
  </div>
</div>

<!-- ALERTS PAGE -->
<div class="page" id="page-alerts">
  <div class="card mb">
    <div class="card-hd">
      <div class="card-title"><div class="card-icon" style="background:rgba(239,68,68,.1)">C</div>All Correlated Alerts - Prioritized</div>
      <span class="pill pill-critical" id="corrAlertCount">-</span>
    </div>
    <div id="corrAlertsList"></div>
  </div>

  <div class="g3 mb">
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(59,130,246,.1)">S</div>Correlation Stats</div>
      </div>
      <div id="corrStatsContainer"></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(245,158,11,.1)">V</div>Alert Value vs Threshold</div>
      </div>
      <div class="chart-box h200"><canvas id="chartAlertThreshold"></canvas></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(16,185,129,.1)">T</div>Alert Timeline</div>
      </div>
      <div id="alertTimeline"></div>
    </div>
  </div>
</div>

<!-- ACCESSIBILITY PAGE -->
<div class="page" id="page-accessibility">
  <div class="g2 mb">
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(139,92,246,.1)">A</div>Open Accessibility Issues</div>
        <span class="pill pill-critical" id="issueCount">-</span>
      </div>
      <div class="scroll-y" id="issueListContainer"></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(59,130,246,.1)">P</div>Issues by Page</div>
      </div>
      <div class="chart-box h200"><canvas id="chartIssueByPage"></canvas></div>
      <div style="margin-top:12px">
        <div class="card-hd" style="margin-bottom:10px;padding-bottom:8px">
          <div class="card-title" style="font-size:.75rem">Issues by Criterion</div>
        </div>
        <div class="chart-box h160"><canvas id="chartIssueByCrit"></canvas></div>
      </div>
    </div>
  </div>

  <div class="card mb">
    <div class="card-hd">
      <div class="card-title"><div class="card-icon" style="background:rgba(16,185,129,.1)">R</div>Latest Lighthouse Report</div>
      <span class="pill pill-green" id="reportEnv">-</span>
    </div>
    <div id="reportDetailContainer"></div>
  </div>
</div>

<!-- WORKER PAGE -->
<div class="page" id="page-worker">
  <div class="g2 mb">
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(16,185,129,.1)">W</div>Worker State</div>
        <span id="workerStatusBadge" class="pill pill-green">-</span>
      </div>
      <div class="worker-grid" id="workerGrid"></div>
    </div>
    <div class="card">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon" style="background:rgba(59,130,246,.1)">H</div>Health Check</div>
      </div>
      <div id="healthContainer"></div>
    </div>
  </div>

  <div class="card mb">
    <div class="card-hd">
      <div class="card-title"><div class="card-icon" style="background:rgba(245,158,11,.1)">S</div>Correlation Snapshot History</div>
      <span class="pill pill-blue" id="snapshotCount">-</span>
    </div>
    <div style="overflow-x:auto">
      <table class="tbl">
        <thead><tr>
          <th>ID</th><th>Generated At</th><th>Source</th>
          <th class="num">Raw Alerts</th><th class="num">Correlated</th>
          <th class="num">A11y Issues</th><th class="num">Noise Reduction</th>
          <th>Top Priority</th>
        </tr></thead>
        <tbody id="snapshotTableBody"><tr><td colspan="8" class="empty">Loading...</td></tr></tbody>
      </table>
    </div>
  </div>
</div>

<footer>
  Aegis MCX Operations Center &nbsp;&middot;&nbsp;
  <a href="/health" target="_blank">/health</a> &nbsp;&middot;&nbsp;
  <a href="/api/dashboard" target="_blank">/api/dashboard</a> &nbsp;&middot;&nbsp;
  <a href="/api/correlation/latest" target="_blank">/api/correlation/latest</a> &nbsp;&middot;&nbsp;
  Node.js + TypeScript &middot; Docker &middot; Kubernetes &middot; Terraform &middot; GitHub Actions
</footer>

<div class="toast" id="toast"></div>


<script>
(function() {
  'use strict';

  // XSS escape helper
  function e(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmt(n) {
    if (n == null) return '-';
    var num = Number(n);
    if (isNaN(num)) return String(n);
    if (Math.abs(num) >= 1e7) return (num / 1e7).toFixed(2) + 'Cr';
    if (Math.abs(num) >= 1e5) return (num / 1e5).toFixed(2) + 'L';
    return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  function fmtTime(iso) {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch(ex) { return iso; }
  }

  function fmtDate(iso) {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch(ex) { return iso; }
  }

  function timeSince(iso) {
    if (!iso) return '-';
    try {
      var diff = Date.now() - new Date(iso).getTime();
      var m = Math.floor(diff / 60000);
      if (m < 1) return 'just now';
      if (m < 60) return m + 'm ago';
      var h = Math.floor(m / 60);
      if (h < 24) return h + 'h ' + (m % 60) + 'm';
      return Math.floor(h / 24) + 'd ' + (h % 24) + 'h';
    } catch(ex) { return '-'; }
  }

  function showToast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2500);
  }

  // Tab switching
  window.showPage = function(name, btn) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    var pg = document.getElementById('page-' + name);
    if (pg) pg.classList.add('active');
    if (btn) btn.classList.add('active');
  };

  // Chart registry
  var charts = {};

  function destroyChart(id) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
  }

  var DARK_OPTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 } },
      tooltip: { backgroundColor: '#0f1929', borderColor: '#1c2d42', borderWidth: 1, titleColor: '#e2e8f0', bodyColor: '#94a3b8' }
    },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(28,45,66,.5)' } },
      y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(28,45,66,.5)' } }
    }
  };

  function doughnutOpts() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 10 } },
        tooltip: { backgroundColor: '#0f1929', borderColor: '#1c2d42', borderWidth: 1, titleColor: '#e2e8f0', bodyColor: '#94a3b8' }
      },
      cutout: '65%'
    };
  }

</script>

<script>
  // ---- OVERVIEW RENDERERS ----

  function renderKPIs(data) {
    var alerts = (data.monitoring && data.monitoring.alerts) ? data.monitoring.alerts : [];
    var issues = (data.accessibility && data.accessibility.openIssues) ? data.accessibility.openIssues : [];
    var corrStats = (data.correlation && data.correlation.stats) ? data.correlation.stats : {};
    var worker = data.worker || {};

    var alertCount = alerts.length;
    var issueCount = issues.length;
    var noiseRed = corrStats.alertNoiseReduction != null ? corrStats.alertNoiseReduction : 0;
    var workerStatus = worker.status || 'unknown';

    var el = document.getElementById('kpi-alerts');
    if (el) el.textContent = alertCount;
    var badge = document.getElementById('kpi-alerts-badge');
    if (badge) {
      var crit = alerts.filter(function(a) { return a.severity === 'critical'; }).length;
      badge.textContent = crit + ' critical';
    }

    var el2 = document.getElementById('kpi-issues');
    if (el2) el2.textContent = issueCount;
    var badge2 = document.getElementById('kpi-issues-badge');
    if (badge2) {
      var critIssues = issues.filter(function(i) { return i.severity === 'critical'; }).length;
      badge2.textContent = critIssues + ' critical';
    }

    var el3 = document.getElementById('kpi-noise');
    if (el3) el3.textContent = (typeof noiseRed === 'number' ? noiseRed.toFixed(1) : noiseRed) + '%';

    var el4 = document.getElementById('kpi-worker');
    if (el4) {
      el4.textContent = workerStatus;
      el4.className = 'stat-val status-' + workerStatus;
    }
    var badge4 = document.getElementById('kpi-worker-badge');
    if (badge4) {
      badge4.textContent = worker.lastHeartbeatAt ? ('Last: ' + timeSince(worker.lastHeartbeatAt)) : workerStatus;
      badge4.className = 'stat-badge ' + (workerStatus === 'healthy' ? 'bg' : workerStatus === 'degraded' ? 'br' : 'by');
    }
  }

  function renderAlertSevChart(alerts) {
    destroyChart('alertSev');
    var counts = { critical: 0, high: 0, medium: 0, low: 0 };
    alerts.forEach(function(a) { if (counts[a.severity] != null) counts[a.severity]++; });
    var total = alerts.length;
    var el = document.getElementById('alertChartCount');
    if (el) el.textContent = total + ' total';
    var ctx = document.getElementById('chartAlertSev');
    if (!ctx) return;
    charts['alertSev'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{
          data: [counts.critical, counts.high, counts.medium, counts.low],
          backgroundColor: ['rgba(239,68,68,.8)', 'rgba(245,158,11,.8)', 'rgba(59,130,246,.8)', 'rgba(100,116,139,.8)'],
          borderColor: '#0f1929',
          borderWidth: 2
        }]
      },
      options: doughnutOpts()
    });
  }

  function renderIssueSevChart(issues) {
    destroyChart('issueSev');
    var counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    issues.forEach(function(i) { if (counts[i.severity] != null) counts[i.severity]++; });
    var total = issues.length;
    var el = document.getElementById('issueChartCount');
    if (el) el.textContent = total + ' total';
    var ctx = document.getElementById('chartIssueSev');
    if (!ctx) return;
    charts['issueSev'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'Serious', 'Moderate', 'Minor'],
        datasets: [{
          data: [counts.critical, counts.serious, counts.moderate, counts.minor],
          backgroundColor: ['rgba(239,68,68,.8)', 'rgba(245,158,11,.8)', 'rgba(139,92,246,.8)', 'rgba(100,116,139,.8)'],
          borderColor: '#0f1929',
          borderWidth: 2
        }]
      },
      options: doughnutOpts()
    });
  }

  function renderCorrScoreChart(prioritized) {
    destroyChart('corrScore');
    var ctx = document.getElementById('chartCorrScore');
    if (!ctx || !prioritized || !prioritized.length) return;
    var labels = prioritized.map(function(a) { return e(a.priority) + ': ' + e((a.summary || '').substring(0, 20)); });
    var scores = prioritized.map(function(a) { return a.score || 0; });
    var colors = prioritized.map(function(a) {
      if (a.priority === 'P1') return 'rgba(239,68,68,.8)';
      if (a.priority === 'P2') return 'rgba(245,158,11,.8)';
      if (a.priority === 'P3') return 'rgba(59,130,246,.8)';
      return 'rgba(100,116,139,.8)';
    });
    charts['corrScore'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ label: 'Score', data: scores, backgroundColor: colors, borderRadius: 4 }]
      },
      options: Object.assign({}, DARK_OPTS, {
        indexAxis: 'y',
        plugins: Object.assign({}, DARK_OPTS.plugins, { legend: { display: false } }),
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(28,45,66,.5)' }, min: 0, max: 100 },
          y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(28,45,66,.3)' } }
        }
      })
    });
  }

  function renderMarginCharts(margins) {
    destroyChart('margin');
    destroyChart('marginDiff');
    if (!margins || !margins.length) return;
    var labels = margins.map(function(m) { return e(m.instrument); });
    var totals = margins.map(function(m) { return m.total || 0; });
    var diffs = margins.map(function(m) { return m.difference || 0; });
    var diffColors = diffs.map(function(d) { return d >= 0 ? 'rgba(16,185,129,.8)' : 'rgba(239,68,68,.8)'; });

    var ctx1 = document.getElementById('chartMargin');
    if (ctx1) {
      charts['margin'] = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{ label: 'Total Margin', data: totals, backgroundColor: 'rgba(59,130,246,.7)', borderRadius: 4 }]
        },
        options: Object.assign({}, DARK_OPTS, {
          plugins: Object.assign({}, DARK_OPTS.plugins, { legend: { display: false } })
        })
      });
    }

    var ctx2 = document.getElementById('chartMarginDiff');
    if (ctx2) {
      charts['marginDiff'] = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{ label: 'Delta', data: diffs, backgroundColor: diffColors, borderRadius: 4 }]
        },
        options: Object.assign({}, DARK_OPTS, {
          plugins: Object.assign({}, DARK_OPTS.plugins, { legend: { display: false } })
        })
      });
    }
  }

  function renderTopCorr(prioritized) {
    var container = document.getElementById('topCorrContainer');
    if (!container) return;
    if (!prioritized || !prioritized.length) {
      container.innerHTML = '<div class="empty">No correlated alerts</div>';
      return;
    }
    var top = prioritized[0];
    var badge = document.getElementById('topCorrBadge');
    if (badge) {
      badge.textContent = top.priority || '-';
      badge.className = 'pill pill-' + (top.priority || 'p4').toLowerCase();
    }
    var rationaleHtml = '';
    if (top.rationale && top.rationale.length) {
      rationaleHtml = '<div class="rationale">';
      top.rationale.forEach(function(r) {
        rationaleHtml += '<div class="rationale-item">' + e(r) + '</div>';
      });
      rationaleHtml += '</div>';
    }
    var issuesHtml = '';
    if (top.accessibilityIssues && top.accessibilityIssues.length) {
      issuesHtml = '<div class="corr-issues">';
      top.accessibilityIssues.slice(0, 3).forEach(function(i) {
        issuesHtml += '<div class="corr-issue-row">';
        issuesHtml += '<div class="corr-issue-top"><span class="corr-issue-comp">' + e(i.component || i.id) + '</span>';
        issuesHtml += '<span class="pill pill-' + e(i.severity) + '">' + e(i.severity) + '</span></div>';
        issuesHtml += '<div class="corr-issue-desc">' + e(i.description || '') + '</div>';
        issuesHtml += '</div>';
      });
      issuesHtml += '</div>';
    }
    container.innerHTML = '<div class="corr-card">'
      + '<div class="corr-card-hd"><span class="pill pill-' + e((top.priority || 'p4').toLowerCase()) + '">' + e(top.priority) + '</span>'
      + '<span class="corr-score">Score: ' + e(top.score) + '</span>'
      + '<span style="font-size:.7rem;color:var(--text3)">' + e(top.service || '') + '</span></div>'
      + '<div class="corr-summary">' + e(top.summary || '') + '</div>'
      + rationaleHtml + issuesHtml
      + '</div>';
  }

  function renderAlertList(alerts) {
    var container = document.getElementById('alertListContainer');
    var countEl = document.getElementById('alertListCount');
    if (!container) return;
    if (countEl) countEl.textContent = alerts.length;
    if (!alerts.length) {
      container.innerHTML = '<div class="empty">No active alerts</div>';
      return;
    }
    var html = '';
    alerts.slice(0, 10).forEach(function(a) {
      html += '<div class="alert-row">';
      html += '<div class="a-dot ' + e(a.severity) + '"></div>';
      html += '<div class="a-body">';
      html += '<div class="a-svc">' + e(a.service || a.source) + '<span class="pill pill-' + e(a.severity) + '">' + e(a.severity) + '</span></div>';
      html += '<div class="a-msg">' + e(a.message || a.metric) + '</div>';
      html += '<div class="a-meta">';
      if (a.value != null && a.threshold != null) {
        html += '<span class="a-val">val: ' + e(a.value) + ' / thr: ' + e(a.threshold) + '</span>';
      }
      html += '<span class="a-time">' + fmtTime(a.startedAt) + '</span>';
      if (a.page) html += '<span class="a-val">' + e(a.page) + '</span>';
      html += '</div></div></div>';
    });
    container.innerHTML = html;
  }

</script>

<script>
  // ---- MARKET RENDERERS ----

  function renderMarketTable(marketWatch) {
    var tbody = document.getElementById('marketTableBody');
    if (!tbody) return;
    if (!marketWatch || !marketWatch.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty">No market data</td></tr>';
      return;
    }
    var html = '';
    marketWatch.forEach(function(m) {
      var chg = parseFloat(m.changePercent) || 0;
      var chgClass = chg > 0 ? 'up' : chg < 0 ? 'dn' : 'neu';
      var sentClass = m.sentiment === 'bullish' ? 'pill-green' : m.sentiment === 'bearish' ? 'pill-critical' : 'pill-low';
      html += '<tr>';
      html += '<td><strong>' + e(m.instrument) + '</strong></td>';
      html += '<td class="num">' + fmt(m.frontMonthPrice) + '</td>';
      html += '<td class="num">' + fmt(m.nextMonthPrice) + '</td>';
      html += '<td class="num">' + fmt(m.spread) + '</td>';
      html += '<td class="num ' + chgClass + '">' + (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%</td>';
      html += '<td class="num">' + fmt(m.volume) + '</td>';
      html += '<td class="num">' + fmt(m.openInterest) + '</td>';
      html += '<td><span class="pill ' + sentClass + '">' + e(m.sentiment || '-') + '</span></td>';
      html += '<td style="font-size:.7rem;color:var(--text3)">' + e(m.contract || '') + '</td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  function renderSpreadBars(marketWatch) {
    var container = document.getElementById('spreadBarsContainer');
    if (!container || !marketWatch || !marketWatch.length) return;
    var spreads = marketWatch.map(function(m) { return Math.abs(parseFloat(m.spread) || 0); });
    var maxSpread = Math.max.apply(null, spreads) || 1;
    var html = '';
    marketWatch.forEach(function(m, i) {
      var pct = (spreads[i] / maxSpread * 100).toFixed(1);
      html += '<div class="spread-row">';
      html += '<div class="spread-label">' + e(m.instrument) + '</div>';
      html += '<div class="spread-track"><div class="spread-fill" style="width:' + pct + '%"></div></div>';
      html += '<div class="spread-val">' + fmt(m.spread) + '</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  function renderVolOIChart(marketWatch) {
    destroyChart('volOI');
    var ctx = document.getElementById('chartVolOI');
    if (!ctx || !marketWatch || !marketWatch.length) return;
    var labels = marketWatch.map(function(m) { return e(m.instrument); });
    var vols = marketWatch.map(function(m) { return m.volume || 0; });
    var ois = marketWatch.map(function(m) { return m.openInterest || 0; });
    charts['volOI'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Volume', data: vols, backgroundColor: 'rgba(59,130,246,.7)', borderRadius: 3 },
          { label: 'Open Interest', data: ois, backgroundColor: 'rgba(16,185,129,.7)', borderRadius: 3 }
        ]
      },
      options: DARK_OPTS
    });
  }

  function renderMarginBreakdown(margins) {
    var tbody = document.getElementById('marginBreakdownBody');
    if (!tbody) return;
    if (!margins || !margins.length) {
      tbody.innerHTML = '<tr><td colspan="11" class="empty">No margin data</td></tr>';
      return;
    }
    var html = '';
    margins.forEach(function(m) {
      var bd = m.breakdown || {};
      var ct = m.componentTotals || {};
      var diff = m.difference || 0;
      var diffClass = diff >= 0 ? 'up' : 'dn';
      html += '<tr>';
      html += '<td><strong>' + e(m.instrument) + '</strong></td>';
      html += '<td class="num">' + fmt(bd.initial) + '</td>';
      html += '<td class="num">' + fmt(bd.elm) + '</td>';
      html += '<td class="num">' + fmt(bd.tender) + '</td>';
      html += '<td class="num">' + fmt(bd.delivery) + '</td>';
      html += '<td class="num">' + fmt(ct.additionalSpread) + '</td>';
      html += '<td class="num">' + fmt(ct.specialSpread) + '</td>';
      html += '<td class="num">' + fmt(bd.dailyVolatility) + '</td>';
      html += '<td class="num">' + fmt(bd.annualVolatility) + '</td>';
      html += '<td class="num"><strong>' + fmt(m.total) + '</strong></td>';
      html += '<td class="num ' + diffClass + '">' + (diff >= 0 ? '+' : '') + fmt(diff) + '</td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  function renderMarginStackedChart(margins) {
    destroyChart('marginStacked');
    var ctx = document.getElementById('chartMarginStacked');
    if (!ctx || !margins || !margins.length) return;
    var labels = margins.map(function(m) { return e(m.instrument); });
    var components = [
      { key: 'initial', label: 'Initial', color: 'rgba(59,130,246,.8)' },
      { key: 'elm', label: 'ELM', color: 'rgba(16,185,129,.8)' },
      { key: 'tender', label: 'Tender', color: 'rgba(245,158,11,.8)' },
      { key: 'delivery', label: 'Delivery', color: 'rgba(139,92,246,.8)' },
      { key: 'dailyVolatility', label: 'Daily Vol', color: 'rgba(239,68,68,.8)' },
      { key: 'annualVolatility', label: 'Annual Vol', color: 'rgba(6,182,212,.8)' }
    ];
    var datasets = components.map(function(c) {
      return {
        label: c.label,
        data: margins.map(function(m) { return (m.breakdown && m.breakdown[c.key]) || 0; }),
        backgroundColor: c.color,
        borderRadius: 2
      };
    });
    charts['marginStacked'] = new Chart(ctx, {
      type: 'bar',
      data: { labels: labels, datasets: datasets },
      options: Object.assign({}, DARK_OPTS, {
        scales: {
          x: { stacked: true, ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(28,45,66,.5)' } },
          y: { stacked: true, ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(28,45,66,.5)' } }
        }
      })
    });
  }

</script>

<script>
  // ---- ALERTS & CORRELATION RENDERERS ----

  function renderCorrAlerts(prioritized) {
    var container = document.getElementById('corrAlertsList');
    var countEl = document.getElementById('corrAlertCount');
    if (!container) return;
    if (countEl) countEl.textContent = (prioritized || []).length;
    if (!prioritized || !prioritized.length) {
      container.innerHTML = '<div class="empty">No correlated alerts</div>';
      return;
    }
    var html = '';
    prioritized.forEach(function(ca) {
      var alert = ca.alert || {};
      var pClass = 'pill-' + (ca.priority || 'p4').toLowerCase();
      var sevClass = alert.severity || 'low';
      var pct = Math.min(100, ca.score || 0);
      var gaugeColor = ca.priority === 'P1' ? 'var(--red)' : ca.priority === 'P2' ? 'var(--accent)' : ca.priority === 'P3' ? 'var(--blue)' : 'var(--text3)';

      html += '<div class="corr-card">';
      html += '<div class="corr-card-hd">';
      html += '<span class="pill ' + pClass + '">' + e(ca.priority) + '</span>';
      html += '<span class="corr-score">Score: ' + e(ca.score) + '</span>';
      html += '<span style="font-size:.72rem;color:var(--text2)">' + e(ca.service || '') + '</span>';
      if (ca.page) html += '<span style="font-size:.68rem;color:var(--text3)">' + e(ca.page) + '</span>';
      html += '</div>';
      html += '<div class="corr-summary">' + e(ca.summary || '') + '</div>';

      // Score gauge
      html += '<div class="gauge-bar"><div class="gauge-fill" style="width:' + pct + '%;background:' + gaugeColor + '"></div></div>';

      // Alert details
      if (alert.metric || alert.message) {
        html += '<div style="margin-top:8px;padding:8px;background:var(--card);border:1px solid var(--border);border-radius:7px">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
        html += '<div class="a-dot ' + e(sevClass) + '"></div>';
        html += '<span style="font-size:.75rem;font-weight:600">' + e(alert.service || alert.source || '') + '</span>';
        html += '<span class="pill pill-' + e(sevClass) + '">' + e(sevClass) + '</span>';
        html += '</div>';
        if (alert.message) html += '<div style="font-size:.72rem;color:var(--text2)">' + e(alert.message) + '</div>';
        if (alert.value != null && alert.threshold != null) {
          var valPct = Math.min(100, (alert.value / alert.threshold) * 100);
          html += '<div style="font-size:.68rem;color:var(--text3);margin-top:4px">Value: ' + e(alert.value) + ' / Threshold: ' + e(alert.threshold) + '</div>';
          html += '<div class="gauge-bar" style="margin-top:4px"><div class="gauge-fill" style="width:' + valPct.toFixed(1) + '%;background:var(--red)"></div></div>';
        }
        html += '</div>';
      }

      // Rationale
      if (ca.rationale && ca.rationale.length) {
        html += '<div class="rationale">';
        ca.rationale.forEach(function(r) {
          html += '<div class="rationale-item">' + e(r) + '</div>';
        });
        html += '</div>';
      }

      // Linked a11y issues
      if (ca.accessibilityIssues && ca.accessibilityIssues.length) {
        html += '<div style="margin-top:8px;font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text3)">Linked A11y Issues</div>';
        html += '<div class="corr-issues">';
        ca.accessibilityIssues.forEach(function(i) {
          html += '<div class="corr-issue-row">';
          html += '<div class="corr-issue-top"><span class="corr-issue-comp">' + e(i.component || i.id) + '</span>';
          html += '<span class="pill pill-' + e(i.severity) + '">' + e(i.severity) + '</span></div>';
          if (i.description) html += '<div class="corr-issue-desc">' + e(i.description) + '</div>';
          html += '</div>';
        });
        html += '</div>';
      }

      html += '</div>';
    });
    container.innerHTML = html;
  }

  function renderCorrStats(stats) {
    var container = document.getElementById('corrStatsContainer');
    if (!container || !stats) return;
    var items = [
      { label: 'Raw Alerts', val: stats.rawAlertCount, color: 'var(--red)' },
      { label: 'Correlated', val: stats.correlatedAlertCount, color: 'var(--blue)' },
      { label: 'A11y Issues', val: stats.openAccessibilityIssueCount, color: 'var(--purple)' },
      { label: 'Noise Reduction', val: (stats.alertNoiseReduction != null ? stats.alertNoiseReduction.toFixed(1) + '%' : '-'), color: 'var(--accent)' }
    ];
    var html = '<div class="corr-stats-row">';
    items.forEach(function(item) {
      html += '<div class="corr-stat">';
      html += '<div class="corr-stat-val" style="color:' + item.color + '">' + e(String(item.val != null ? item.val : '-')) + '</div>';
      html += '<div class="corr-stat-lbl">' + e(item.label) + '</div>';
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function renderAlertThresholdChart(alerts) {
    destroyChart('alertThreshold');
    var ctx = document.getElementById('chartAlertThreshold');
    if (!ctx || !alerts || !alerts.length) return;
    var filtered = alerts.filter(function(a) { return a.value != null && a.threshold != null; }).slice(0, 10);
    if (!filtered.length) return;
    var labels = filtered.map(function(a) { return e(a.service || a.metric || a.id); });
    charts['alertThreshold'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Value', data: filtered.map(function(a) { return a.value; }), backgroundColor: 'rgba(239,68,68,.7)', borderRadius: 3 },
          { label: 'Threshold', data: filtered.map(function(a) { return a.threshold; }), backgroundColor: 'rgba(245,158,11,.5)', borderRadius: 3 }
        ]
      },
      options: Object.assign({}, DARK_OPTS, {
        indexAxis: 'y',
        plugins: Object.assign({}, DARK_OPTS.plugins)
      })
    });
  }

  function renderAlertTimeline(alerts) {
    var container = document.getElementById('alertTimeline');
    if (!container) return;
    if (!alerts || !alerts.length) {
      container.innerHTML = '<div class="empty">No alerts</div>';
      return;
    }
    var sorted = alerts.slice().sort(function(a, b) {
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });
    var html = '';
    sorted.slice(0, 12).forEach(function(a) {
      var dotColor = a.severity === 'critical' ? 'var(--red)' : a.severity === 'high' ? 'var(--accent)' : a.severity === 'medium' ? 'var(--blue)' : 'var(--text3)';
      html += '<div class="timeline-row">';
      html += '<div class="timeline-dot" style="background:' + dotColor + '"></div>';
      html += '<div class="timeline-info">';
      html += '<div class="timeline-svc">' + e(a.service || a.source) + '</div>';
      html += '<div class="timeline-time">' + fmtDate(a.startedAt) + '</div>';
      html += '</div>';
      html += '<div class="timeline-dur">' + timeSince(a.startedAt) + '</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

</script>

<script>
  // ---- ACCESSIBILITY RENDERERS ----

  function renderIssueList(issues) {
    var container = document.getElementById('issueListContainer');
    var countEl = document.getElementById('issueCount');
    if (!container) return;
    if (countEl) countEl.textContent = (issues || []).length;
    if (!issues || !issues.length) {
      container.innerHTML = '<div class="empty">No open issues</div>';
      return;
    }
    var html = '';
    issues.forEach(function(i) {
      html += '<div class="issue-card">';
      html += '<div class="issue-top">';
      html += '<div><div class="issue-comp">' + e(i.component || i.id) + '</div>';
      html += '<div class="issue-page">' + e(i.page || '') + '</div></div>';
      html += '<span class="pill pill-' + e(i.severity) + '">' + e(i.severity) + '</span>';
      html += '</div>';
      if (i.criterion) html += '<div style="font-size:.65rem;color:var(--blue);margin-bottom:4px">' + e(i.criterion) + '</div>';
      if (i.description) html += '<div class="issue-desc">' + e(i.description) + '</div>';
      if (i.userImpact) html += '<div class="issue-impact">Impact: ' + e(i.userImpact) + '</div>';
      if (i.tags && i.tags.length) {
        html += '<div class="issue-tags">';
        i.tags.forEach(function(t) { html += '<span class="tag">' + e(t) + '</span>'; });
        html += '</div>';
      }
      html += '</div>';
    });
    container.innerHTML = html;
  }

  function renderIssueByPageChart(issues) {
    destroyChart('issueByPage');
    var ctx = document.getElementById('chartIssueByPage');
    if (!ctx || !issues || !issues.length) return;
    var pageCounts = {};
    issues.forEach(function(i) {
      var pg = i.page || 'Unknown';
      pageCounts[pg] = (pageCounts[pg] || 0) + 1;
    });
    var labels = Object.keys(pageCounts);
    var data = labels.map(function(l) { return pageCounts[l]; });
    charts['issueByPage'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ label: 'Issues', data: data, backgroundColor: 'rgba(139,92,246,.7)', borderRadius: 4 }]
      },
      options: Object.assign({}, DARK_OPTS, {
        plugins: Object.assign({}, DARK_OPTS.plugins, { legend: { display: false } })
      })
    });
  }

  function renderIssueByCritChart(issues) {
    destroyChart('issueByCrit');
    var ctx = document.getElementById('chartIssueByCrit');
    if (!ctx || !issues || !issues.length) return;
    var critCounts = {};
    issues.forEach(function(i) {
      var c = i.criterion || 'Unknown';
      critCounts[c] = (critCounts[c] || 0) + 1;
    });
    var labels = Object.keys(critCounts).slice(0, 8);
    var data = labels.map(function(l) { return critCounts[l]; });
    charts['issueByCrit'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ label: 'Issues', data: data, backgroundColor: 'rgba(59,130,246,.7)', borderRadius: 4 }]
      },
      options: Object.assign({}, DARK_OPTS, {
        indexAxis: 'y',
        plugins: Object.assign({}, DARK_OPTS.plugins, { legend: { display: false } })
      })
    });
  }

  function renderReportDetail(accessibility) {
    var container = document.getElementById('reportDetailContainer');
    var envEl = document.getElementById('reportEnv');
    if (!container || !accessibility) return;
    var lr = accessibility.latestReport || {};
    if (envEl) envEl.textContent = lr.environment || '-';
    var html = '<div class="worker-grid">';
    var items = [
      { label: 'Report Count', val: accessibility.reportCount },
      { label: 'Open Issues', val: accessibility.openIssueCount },
      { label: 'Source', val: lr.source || lr.reportSource },
      { label: 'Environment', val: lr.environment },
      { label: 'Captured At', val: fmtDate(lr.capturedAt || lr.generatedAt) },
      { label: 'Issue Count', val: lr.issueCount != null ? lr.issueCount : accessibility.openIssueCount }
    ];
    items.forEach(function(item) {
      html += '<div class="worker-item">';
      html += '<div class="worker-lbl">' + e(item.label) + '</div>';
      html += '<div class="worker-val">' + e(String(item.val != null ? item.val : '-')) + '</div>';
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

</script>

<script>
  // ---- WORKER RENDERERS ----

  function renderWorkerGrid(worker) {
    var grid = document.getElementById('workerGrid');
    var badge = document.getElementById('workerStatusBadge');
    if (!grid || !worker) return;
    var status = worker.status || 'unknown';
    if (badge) {
      badge.textContent = status;
      badge.className = 'pill ' + (status === 'healthy' ? 'pill-green' : status === 'degraded' ? 'pill-critical' : 'pill-high');
    }
    var items = [
      { label: 'Status', val: status, cls: 'status-' + status },
      { label: 'Last Heartbeat', val: fmtDate(worker.lastHeartbeatAt) },
      { label: 'Last Run', val: fmtDate(worker.lastRunAt) },
      { label: 'Poll Interval', val: worker.pollIntervalMs ? (worker.pollIntervalMs / 1000) + 's' : '-' },
      { label: 'API Base URL', val: worker.apiBaseUrl },
      { label: 'Last Correlation ID', val: worker.lastCorrelationId },
      { label: 'Last Error', val: worker.lastError || 'None' }
    ];
    var html = '';
    items.forEach(function(item) {
      html += '<div class="worker-item">';
      html += '<div class="worker-lbl">' + e(item.label) + '</div>';
      html += '<div class="worker-val' + (item.cls ? ' ' + item.cls : '') + '">' + e(String(item.val != null ? item.val : '-')) + '</div>';
      html += '</div>';
    });
    grid.innerHTML = html;
  }

  function renderHealthContainer(health) {
    var container = document.getElementById('healthContainer');
    if (!container || !health) return;
    var items = [
      { label: 'Active Alerts', val: health.activeAlerts },
      { label: 'Open A11y Issues', val: health.openAccessibilityIssues },
      { label: 'Frontend Served', val: health.frontendServed ? 'Yes' : 'No' },
      { label: 'Runtime Storage', val: health.runtimeStorage },
      { label: 'Worker Status', val: health.status },
      { label: 'Last Heartbeat', val: fmtDate(health.lastHeartbeatAt) },
      { label: 'Last Run', val: fmtDate(health.lastRunAt) },
      { label: 'Poll Interval', val: health.pollIntervalMs ? (health.pollIntervalMs / 1000) + 's' : '-' }
    ];
    var html = '<div class="worker-grid">';
    items.forEach(function(item) {
      html += '<div class="worker-item">';
      html += '<div class="worker-lbl">' + e(item.label) + '</div>';
      html += '<div class="worker-val">' + e(String(item.val != null ? item.val : '-')) + '</div>';
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function renderSnapshotTable(snapshots) {
    var tbody = document.getElementById('snapshotTableBody');
    var countEl = document.getElementById('snapshotCount');
    if (!tbody) return;
    var items = snapshots || [];
    if (countEl) countEl.textContent = items.length + ' snapshots';
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">No snapshots</td></tr>';
      return;
    }
    var html = '';
    items.slice().reverse().forEach(function(s) {
      var stats = s.stats || {};
      var nr = stats.alertNoiseReduction != null ? stats.alertNoiseReduction.toFixed(1) + '%' : '-';
      var top = s.topPriorityAlert;
      var topHtml = top ? ('<span class="pill pill-' + e((top.priority || 'p4').toLowerCase()) + '">' + e(top.priority) + '</span> ' + e((top.summary || '').substring(0, 30))) : '-';
      html += '<tr>';
      html += '<td style="font-family:monospace;font-size:.7rem">' + e((s.id || '').substring(0, 12)) + '...</td>';
      html += '<td>' + fmtDate(s.generatedAt) + '</td>';
      html += '<td>' + e(s.source || '-') + '</td>';
      html += '<td class="num">' + e(String(stats.rawAlertCount != null ? stats.rawAlertCount : '-')) + '</td>';
      html += '<td class="num">' + e(String(stats.correlatedAlertCount != null ? stats.correlatedAlertCount : '-')) + '</td>';
      html += '<td class="num">' + e(String(stats.openAccessibilityIssueCount != null ? stats.openAccessibilityIssueCount : '-')) + '</td>';
      html += '<td class="num">' + nr + '</td>';
      html += '<td style="font-size:.72rem">' + topHtml + '</td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

</script>

<script>
  // ---- DATA FETCHING & REFRESH ----

  var _lastData = {};

  function doRefresh(manual) {
    var btn = document.getElementById('refreshBtn');
    if (btn) btn.textContent = 'Refreshing...';

    Promise.all([
      fetch('/api/dashboard').then(function(r) { return r.json(); }).catch(function() { return {}; }),
      fetch('/health').then(function(r) { return r.json(); }).catch(function() { return {}; }),
      fetch('/api/correlation/latest').then(function(r) { return r.json(); }).catch(function() { return {}; }),
      fetch('/api/correlation/snapshots').then(function(r) { return r.json(); }).catch(function() { return {}; })
    ]).then(function(results) {
      var dashboard = results[0] || {};
      var health = results[1] || {};
      var corrLatest = results[2] || {};
      var snapshots = results[3] || {};

      _lastData = { dashboard: dashboard, health: health, corrLatest: corrLatest, snapshots: snapshots };

      var market = dashboard.market || {};
      var accessibility = dashboard.accessibility || {};
      var monitoring = dashboard.monitoring || {};
      var correlation = dashboard.correlation || {};
      var worker = dashboard.worker || {};

      var margins = market.dailyMargins || [];
      var marketWatch = market.marketWatch || [];
      var alerts = monitoring.alerts || [];
      var issues = accessibility.openIssues || [];
      var prioritized = correlation.prioritizedAlerts || [];
      var corrStats = correlation.stats || {};

      // Overview
      renderKPIs(dashboard);
      renderAlertSevChart(alerts);
      renderIssueSevChart(issues);
      renderCorrScoreChart(prioritized);
      renderMarginCharts(margins);
      renderTopCorr(prioritized);
      renderAlertList(alerts);

      // Market
      renderMarketTable(marketWatch);
      renderSpreadBars(marketWatch);
      renderVolOIChart(marketWatch);
      renderMarginBreakdown(margins);
      renderMarginStackedChart(margins);

      // Alerts & Correlation
      renderCorrAlerts(prioritized);
      renderCorrStats(corrStats);
      renderAlertThresholdChart(alerts);
      renderAlertTimeline(alerts);

      // Accessibility
      renderIssueList(issues);
      renderIssueByPageChart(issues);
      renderIssueByCritChart(issues);
      renderReportDetail(accessibility);

      // Worker
      renderWorkerGrid(worker);
      renderHealthContainer(health);
      var snapshotItems = snapshots.items || (Array.isArray(snapshots) ? snapshots : []);
      renderSnapshotTable(snapshotItems);

      // Update timestamp
      var ts = document.getElementById('lastUpdated');
      if (ts) ts.textContent = 'Updated ' + new Date().toLocaleTimeString('en-IN');

      if (manual) showToast('Dashboard refreshed');
    }).catch(function(err) {
      console.error('Refresh error:', err);
      showToast('Refresh failed');
    }).finally(function() {
      if (btn) btn.textContent = 'Refresh';
    });
  }

  window.doRefresh = doRefresh;

  // Initial load + auto-refresh every 8 seconds
  doRefresh(false);
  setInterval(function() { doRefresh(false); }, 8000);

})();
</script>
</body>
</html>
`;
}
