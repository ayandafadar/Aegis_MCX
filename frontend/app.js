// Aegis MCX DevOps Dashboard
'use strict';

// ── helpers ──────────────────────────────────────────────────────────────────
function e(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmt(n, dec) {
  if (n == null) return '–';
  var v = Number(n);
  if (isNaN(v)) return String(n);
  return v.toLocaleString('en-IN', { maximumFractionDigits: dec != null ? dec : 2 });
}
function fmtDate(iso) {
  if (!iso) return '–';
  try { return new Date(iso).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }
  catch(_) { return iso; }
}
function timeSince(iso) {
  if (!iso) return '–';
  var diff = Date.now() - new Date(iso).getTime();
  var m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  var h = Math.floor(m / 60);
  if (h < 24) return h + 'h ' + (m % 60) + 'm ago';
  return Math.floor(h / 24) + 'd ago';
}

// ── chart registry ────────────────────────────────────────────────────────────
var _charts = {};
function destroyChart(id) { if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; } }

Chart.defaults.color = '#64748b';
Chart.defaults.borderColor = '#1e2d45';
Chart.defaults.font.family = 'Inter, system-ui, sans-serif';

var TOOLTIP = { backgroundColor:'#111827', borderColor:'#1e2d45', borderWidth:1, titleColor:'#e2e8f0', bodyColor:'#94a3b8' };
var GRID = { color:'rgba(30,45,69,.5)' };
var TICK = { color:'#64748b', font:{ size:10 } };

// ── navigation ────────────────────────────────────────────────────────────────
var _currentPage = 'overview';
var PAGE_TITLES = { overview:'Overview', market:'Market Watch', margins:'Daily Margins', alerts:'Alerts & Monitoring', correlation:'Alert Correlation Engine', cicd:'CI/CD Pipeline', infra:'Infrastructure' };

document.querySelectorAll('.nav-item').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var page = btn.dataset.page;
    document.querySelectorAll('.nav-item').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('page-' + page).classList.add('active');
    document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || page;
    _currentPage = page;
  });
});

// ── data store ────────────────────────────────────────────────────────────────
var _data = {};

// ── fetch & render ────────────────────────────────────────────────────────────
function refresh(manual) {
  var btn = document.getElementById('refreshBtn');
  if (btn) btn.textContent = '⟳ Loading…';

  Promise.all([
    fetch('/api/dashboard').then(function(r) { return r.json(); }).catch(function() { return {}; }),
    fetch('/health').then(function(r) { return r.json(); }).catch(function() { return {}; }),
    fetch('/api/correlation/latest').then(function(r) { return r.json(); }).catch(function() { return {}; }),
    fetch('/api/correlation/snapshots').then(function(r) { return r.json(); }).catch(function() { return {}; })
  ]).then(function(res) {
    _data.dash = res[0] || {};
    _data.health = res[1] || {};
    _data.corrLatest = res[2] || {};
    _data.snapshots = res[3] || {};

    renderAll();

    var ts = document.getElementById('lastUpdated');
    if (ts) ts.textContent = 'Updated ' + new Date().toLocaleTimeString('en-IN');
    if (btn) btn.textContent = '↻ Refresh';

    // sidebar worker status
    var w = _data.dash.worker || {};
    var dot = document.querySelector('#sidebarWorker .status-dot');
    var lbl = document.querySelector('#sidebarWorker span:last-child');
    if (dot) { dot.className = 'status-dot ' + (w.status || 'idle'); }
    if (lbl) lbl.textContent = 'Worker: ' + (w.status || 'idle');
  }).catch(function() {
    if (btn) btn.textContent = '↻ Refresh';
  });
}

function renderAll() {
  renderOverview();
  renderMarket();
  renderMargins();
  renderAlerts();
  renderCorrelation();
  renderCICD();
  renderInfra();
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
function renderOverview() {
  var dash = _data.dash;
  var alerts = (dash.monitoring && dash.monitoring.alerts) || [];
  var issues = (dash.accessibility && dash.accessibility.openIssues) || [];
  var corr = dash.correlation || {};
  var stats = corr.stats || {};
  var worker = dash.worker || {};
  var margins = (dash.market && dash.market.dailyMargins) || [];

  var html = '';

  // KPIs
  html += '<div class="g4">';
  html += kpi('Active Alerts', alerts.length, 'Currently Firing', alerts.length === 0 ? 'bg' : 'br', '--kc:var(--red)', alerts.length === 0 ? 'All Clear' : alerts.length + ' firing');
  html += kpi('Open A11y Issues', issues.length, 'Accessibility Findings', issues.length === 0 ? 'bg' : 'bp', '--kc:var(--purple)', issues.length + ' open');
  html += kpi('Noise Reduction', (stats.alertNoiseReduction || 0).toFixed(1) + '%', 'Alert Correlation Efficiency', 'bb', '--kc:var(--accent)', 'AI-Powered');
  html += kpi('Worker', worker.status || 'idle', 'Correlation Engine', worker.status === 'healthy' ? 'bg' : worker.status === 'degraded' ? 'br' : 'by', '--kc:var(--green)', timeSince(worker.lastHeartbeatAt));
  html += '</div>';

  // Charts row
  html += '<div class="g3">';
  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(239,68,68,.1)">!</div>Alert Severity</div><span class="pill pill-blue">' + alerts.length + ' total</span></div><div class="chart-wrap h200"><canvas id="ch-alertSev"></canvas></div></div>';
  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(139,92,246,.1)">A</div>A11y Issue Severity</div><span class="pill pill-blue">' + issues.length + ' total</span></div><div class="chart-wrap h200"><canvas id="ch-issueSev"></canvas></div></div>';
  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(16,185,129,.1)">C</div>Correlation Scores</div></div><div class="chart-wrap h200"><canvas id="ch-corrScores"></canvas></div></div>';
  html += '</div>';

  // Margin totals + delta
  html += '<div class="g2">';
  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(59,130,246,.1)">M</div>Margin Totals — All Instruments</div><span class="pill pill-green">INR</span></div><div class="chart-wrap h240"><canvas id="ch-marginTotals"></canvas></div></div>';
  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(6,182,212,.1)">D</div>Margin Delta vs Previous Day</div></div><div class="chart-wrap h240"><canvas id="ch-marginDelta"></canvas></div></div>';
  html += '</div>';

  // Top correlation + active alerts
  html += '<div class="g2">';

  // top corr
  var prioritized = (corr.prioritizedAlerts) || [];
  var top = prioritized[0];
  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(245,158,11,.1)">P</div>Top Priority Correlation</div>' + (top ? '<span class="pill pill-' + e((top.priority||'p4').toLowerCase()) + '">' + e(top.priority) + '</span>' : '') + '</div>';
  if (top) {
    html += '<div class="corr-card" style="margin-bottom:0">';
    html += '<div class="corr-hd"><span class="pill pill-' + e((top.priority||'p4').toLowerCase()) + '">' + e(top.priority) + '</span><span class="corr-score">Score: ' + e(top.score) + '</span><span style="font-size:.7rem;color:var(--text3)">' + e(top.service) + '</span></div>';
    html += '<div class="corr-summary">' + e(top.summary) + '</div>';
    html += '<div class="gauge-track"><div class="gauge-fill" style="width:' + Math.min(100, top.score || 0) + '%;background:var(--red)"></div></div>';
    if (top.rationale && top.rationale.length) {
      html += '<div class="rationale">' + top.rationale.map(function(r) { return '<div class="rationale-item">' + e(r) + '</div>'; }).join('') + '</div>';
    }
    html += '</div>';
  } else {
    html += '<div style="text-align:center;padding:24px;color:var(--text3)">No correlated alerts</div>';
  }
  html += '</div>';

  // active alerts list
  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(239,68,68,.1)">!</div>Active Monitoring Alerts</div><span class="pill pill-critical">' + alerts.length + '</span></div>';
  if (alerts.length) {
    html += alerts.map(function(a) { return alertRow(a); }).join('');
  } else {
    html += '<div style="text-align:center;padding:24px;color:var(--text3)">No active alerts — system healthy</div>';
  }
  html += '</div>';
  html += '</div>';

  document.getElementById('page-overview').innerHTML = html;

  // draw charts
  setTimeout(function() {
    drawDoughnut('ch-alertSev',
      ['Critical','High','Medium','Low'],
      [alerts.filter(function(a){return a.severity==='critical';}).length, alerts.filter(function(a){return a.severity==='high';}).length, alerts.filter(function(a){return a.severity==='medium';}).length, alerts.filter(function(a){return a.severity==='low';}).length],
      ['rgba(239,68,68,.8)','rgba(245,158,11,.8)','rgba(59,130,246,.8)','rgba(100,116,139,.8)']
    );
    drawDoughnut('ch-issueSev',
      ['Critical','Serious','Moderate','Minor'],
      [issues.filter(function(i){return i.severity==='critical';}).length, issues.filter(function(i){return i.severity==='serious';}).length, issues.filter(function(i){return i.severity==='moderate';}).length, issues.filter(function(i){return i.severity==='minor';}).length],
      ['rgba(239,68,68,.8)','rgba(245,158,11,.8)','rgba(139,92,246,.8)','rgba(100,116,139,.8)']
    );
    if (prioritized.length) {
      drawHBar('ch-corrScores',
        prioritized.map(function(p) { return e(p.priority) + ': ' + e((p.service||'').substring(0,12)); }),
        prioritized.map(function(p) { return p.score || 0; }),
        prioritized.map(function(p) { return p.priority==='P1'?'rgba(239,68,68,.8)':p.priority==='P2'?'rgba(245,158,11,.8)':'rgba(59,130,246,.8)'; })
      );
    }
    if (margins.length) {
      drawBar('ch-marginTotals', margins.map(function(m){return m.instrument;}), margins.map(function(m){return m.total||0;}), 'rgba(59,130,246,.7)', false);
      var diffs = margins.map(function(m){return m.difference||0;});
      drawBar('ch-marginDelta', margins.map(function(m){return m.instrument;}), diffs, diffs.map(function(d){return d>=0?'rgba(16,185,129,.7)':'rgba(239,68,68,.7)';}), false);
    }
  }, 50);
}

function kpi(label, val, sub, badgeClass, style, badgeText) {
  return '<div class="kpi" style="' + style + '">' +
    '<div class="kpi-label">' + e(label) + '</div>' +
    '<div class="kpi-val">' + e(String(val)) + '</div>' +
    '<div class="kpi-sub">' + e(sub) + '</div>' +
    '<div class="kpi-badge ' + badgeClass + '">' + e(badgeText) + '</div>' +
    '</div>';
}

function alertRow(a) {
  var pct = (a.value != null && a.threshold != null && a.threshold > 0) ? Math.min(100, (a.value / a.threshold) * 100) : 0;
  return '<div class="alert-row">' +
    '<div class="a-dot ' + e(a.severity) + '"></div>' +
    '<div class="a-body">' +
    '<div class="a-svc">' + e(a.service) + '<span class="pill pill-' + e(a.severity) + '">' + e(a.severity) + '</span>' + (a.page ? '<span class="pill pill-blue">' + e(a.page) + '</span>' : '') + '</div>' +
    '<div class="a-msg">' + e(a.message) + '</div>' +
    '<div class="a-meta">' +
    (a.value != null ? '<span class="a-kv">val: ' + e(a.value) + '</span>' : '') +
    (a.threshold != null ? '<span class="a-kv">thr: ' + e(a.threshold) + '</span>' : '') +
    '<span class="a-kv">' + fmtDate(a.startedAt) + '</span>' +
    '</div>' +
    (pct > 0 ? '<div class="gauge-track"><div class="gauge-fill" style="width:' + pct.toFixed(1) + '%;background:var(--red)"></div></div>' : '') +
    '</div></div>';
}

// ── MARKET WATCH ──────────────────────────────────────────────────────────────
function renderMarket() {
  var mw = (_data.dash.market && _data.dash.market.marketWatch) || [];
  var html = '';

  // Market table
  html += '<div class="card mb"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(16,185,129,.1)">M</div>MCX Live Market Watch</div><span class="pill pill-green">' + mw.length + ' instruments</span></div>';
  html += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Instrument</th><th class="r">Front Month</th><th class="r">Next Month</th><th class="r">Spread</th><th class="r">Chg %</th><th class="r">Volume</th><th class="r">Open Interest</th><th>Sentiment</th><th>Contract</th></tr></thead><tbody>';
  mw.forEach(function(m) {
    var chg = parseFloat(m.changePercent) || 0;
    var cc = chg > 0 ? 'up' : chg < 0 ? 'dn' : 'neu';
    html += '<tr><td><strong>' + e(m.instrument) + '</strong></td>';
    html += '<td class="r">' + fmt(m.frontMonthPrice) + '</td>';
    html += '<td class="r">' + fmt(m.nextMonthPrice) + '</td>';
    html += '<td class="r">' + fmt(m.spread) + '</td>';
    html += '<td class="r ' + cc + '">' + (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%</td>';
    html += '<td class="r">' + fmt(m.volume, 0) + '</td>';
    html += '<td class="r">' + fmt(m.openInterest, 0) + '</td>';
    html += '<td><span class="pill pill-' + e(m.sentiment) + '">' + e(m.sentiment) + '</span></td>';
    html += '<td style="font-size:.68rem;color:var(--text3)">' + e(m.contract) + '</td></tr>';
  });
  html += '</tbody></table></div></div>';

  // Spread bars + Vol/OI chart
  html += '<div class="g2">';
  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(6,182,212,.1)">S</div>Front/Next Month Spread</div></div>';
  var spreads = mw.map(function(m) { return Math.abs(parseFloat(m.spread) || 0); });
  var maxSpread = Math.max.apply(null, spreads) || 1;
  mw.forEach(function(m, i) {
    var pct = (spreads[i] / maxSpread * 100).toFixed(1);
    html += '<div class="spread-row"><div class="spread-label">' + e(m.instrument) + '</div><div class="spread-track"><div class="spread-fill" style="width:' + pct + '%"></div></div><div class="spread-val">' + fmt(m.spread) + '</div></div>';
  });
  html += '</div>';

  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(59,130,246,.1)">V</div>Volume vs Open Interest</div></div><div class="chart-wrap h280"><canvas id="ch-volOI"></canvas></div></div>';
  html += '</div>';

  // Change % chart
  html += '<div class="card mb"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(245,158,11,.1)">%</div>Price Change % — All Instruments</div></div><div class="chart-wrap h200"><canvas id="ch-priceChg"></canvas></div></div>';

  document.getElementById('page-market').innerHTML = html;

  setTimeout(function() {
    if (!mw.length) return;
    var labels = mw.map(function(m) { return m.instrument; });
    destroyChart('ch-volOI');
    _charts['ch-volOI'] = new Chart(document.getElementById('ch-volOI'), {
      type: 'bar',
      data: { labels: labels, datasets: [
        { label: 'Volume', data: mw.map(function(m){return m.volume||0;}), backgroundColor: 'rgba(59,130,246,.7)', borderRadius: 3 },
        { label: 'Open Interest', data: mw.map(function(m){return m.openInterest||0;}), backgroundColor: 'rgba(16,185,129,.7)', borderRadius: 3 }
      ]},
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#94a3b8', font:{size:11} } }, tooltip:TOOLTIP }, scales:{ x:{ ticks:TICK, grid:GRID }, y:{ ticks:TICK, grid:GRID } } }
    });

    var chgs = mw.map(function(m) { return parseFloat(m.changePercent) || 0; });
    destroyChart('ch-priceChg');
    _charts['ch-priceChg'] = new Chart(document.getElementById('ch-priceChg'), {
      type: 'bar',
      data: { labels: labels, datasets: [{ label: 'Change %', data: chgs, backgroundColor: chgs.map(function(c){return c>=0?'rgba(16,185,129,.7)':'rgba(239,68,68,.7)';}), borderRadius: 4 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:TOOLTIP }, scales:{ x:{ ticks:TICK, grid:GRID }, y:{ ticks:TICK, grid:GRID } } }
    });
  }, 50);
}

// ── DAILY MARGINS ─────────────────────────────────────────────────────────────
function renderMargins() {
  var margins = (_data.dash.market && _data.dash.market.dailyMargins) || [];
  var html = '';

  // Breakdown table
  html += '<div class="card mb"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(245,158,11,.1)">B</div>Margin Component Breakdown</div><span class="pill pill-blue">Initial + ELM + Tender + Delivery + Spreads + Volatility</span></div>';
  html += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Instrument</th><th class="r">Initial</th><th class="r">ELM</th><th class="r">Tender</th><th class="r">Delivery</th><th class="r">Add Spread</th><th class="r">Spec Spread</th><th class="r">Daily Vol</th><th class="r">Annual Vol</th><th class="r">Total</th><th class="r">Delta</th></tr></thead><tbody>';
  margins.forEach(function(m) {
    var bd = m.breakdown || {};
    var ct = m.componentTotals || {};
    var diff = m.difference || 0;
    html += '<tr><td><strong>' + e(m.instrument) + '</strong></td>';
    html += '<td class="r">' + fmt(bd.initial) + '</td>';
    html += '<td class="r">' + fmt(bd.elm) + '</td>';
    html += '<td class="r">' + fmt(bd.tender) + '</td>';
    html += '<td class="r">' + fmt(bd.delivery) + '</td>';
    html += '<td class="r">' + fmt(ct.additionalSpread) + '</td>';
    html += '<td class="r">' + fmt(ct.specialSpread) + '</td>';
    html += '<td class="r">' + fmt(bd.dailyVolatility) + '</td>';
    html += '<td class="r">' + fmt(bd.annualVolatility) + '</td>';
    html += '<td class="r"><strong>' + fmt(m.total) + '</strong></td>';
    html += '<td class="r ' + (diff >= 0 ? 'up' : 'dn') + '">' + (diff >= 0 ? '+' : '') + fmt(diff) + '</td></tr>';
  });
  html += '</tbody></table></div></div>';

  // Stacked chart + delta chart
  html += '<div class="g2">';
  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(139,92,246,.1)">S</div>Stacked Margin Components</div></div><div class="chart-wrap h280"><canvas id="ch-marginStacked"></canvas></div></div>';
  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(6,182,212,.1)">V</div>Volatility Components</div></div><div class="chart-wrap h280"><canvas id="ch-marginVol"></canvas></div></div>';
  html += '</div>';

  document.getElementById('page-margins').innerHTML = html;

  setTimeout(function() {
    if (!margins.length) return;
    var labels = margins.map(function(m) { return m.instrument; });
    var comps = [
      { key:'initial', label:'Initial', color:'rgba(59,130,246,.8)' },
      { key:'elm', label:'ELM', color:'rgba(16,185,129,.8)' },
      { key:'tender', label:'Tender', color:'rgba(245,158,11,.8)' },
      { key:'delivery', label:'Delivery', color:'rgba(139,92,246,.8)' }
    ];
    destroyChart('ch-marginStacked');
    _charts['ch-marginStacked'] = new Chart(document.getElementById('ch-marginStacked'), {
      type: 'bar',
      data: { labels: labels, datasets: comps.map(function(c) {
        return { label:c.label, data:margins.map(function(m){return (m.breakdown&&m.breakdown[c.key])||0;}), backgroundColor:c.color, borderRadius:2 };
      })},
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#94a3b8', font:{size:11} } }, tooltip:TOOLTIP }, scales:{ x:{ stacked:true, ticks:TICK, grid:GRID }, y:{ stacked:true, ticks:TICK, grid:GRID } } }
    });

    destroyChart('ch-marginVol');
    _charts['ch-marginVol'] = new Chart(document.getElementById('ch-marginVol'), {
      type: 'bar',
      data: { labels: labels, datasets: [
        { label:'Daily Vol', data:margins.map(function(m){return (m.breakdown&&m.breakdown.dailyVolatility)||0;}), backgroundColor:'rgba(239,68,68,.7)', borderRadius:3 },
        { label:'Annual Vol', data:margins.map(function(m){return (m.breakdown&&m.breakdown.annualVolatility)||0;}), backgroundColor:'rgba(245,158,11,.7)', borderRadius:3 }
      ]},
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#94a3b8', font:{size:11} } }, tooltip:TOOLTIP }, scales:{ x:{ ticks:TICK, grid:GRID }, y:{ ticks:TICK, grid:GRID } } }
    });
  }, 50);
}

// ── ALERTS ────────────────────────────────────────────────────────────────────
function renderAlerts() {
  var alerts = (_data.dash.monitoring && _data.dash.monitoring.alerts) || [];
  var html = '';

  // Stats row
  html += '<div class="g4">';
  html += kpi('Total Firing', alerts.length, 'Active alerts', alerts.length > 0 ? 'br' : 'bg', '--kc:var(--red)', 'firing');
  html += kpi('Critical', alerts.filter(function(a){return a.severity==='critical';}).length, 'Severity level', 'br', '--kc:var(--red)', 'critical');
  html += kpi('High', alerts.filter(function(a){return a.severity==='high';}).length, 'Severity level', 'by', '--kc:var(--accent)', 'high');
  html += kpi('Services Affected', [...new Set(alerts.map(function(a){return a.service;}))].length, 'Unique services', 'bb', '--kc:var(--blue)', 'services');
  html += '</div>';

  // Alert list
  html += '<div class="card mb"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(239,68,68,.1)">!</div>All Active Alerts</div><span class="pill pill-critical">' + alerts.length + '</span></div>';
  if (alerts.length) {
    html += alerts.map(function(a) { return alertRow(a); }).join('');
  } else {
    html += '<div style="text-align:center;padding:32px;color:var(--text3)">No active alerts — all systems healthy</div>';
  }
  html += '</div>';

  // Value vs threshold chart + timeline
  html += '<div class="g2">';
  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(245,158,11,.1)">V</div>Value vs Threshold</div></div><div class="chart-wrap h240"><canvas id="ch-alertThresh"></canvas></div></div>';

  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(16,185,129,.1)">T</div>Alert Timeline</div></div>';
  var sorted = alerts.slice().sort(function(a,b){ return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(); });
  sorted.forEach(function(a) {
    var dotColor = a.severity==='critical'?'var(--red)':a.severity==='high'?'var(--accent)':'var(--blue)';
    html += '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(30,45,69,.4)">';
    html += '<div style="width:8px;height:8px;border-radius:50%;background:' + dotColor + ';flex-shrink:0"></div>';
    html += '<div style="flex:1;min-width:0"><div style="font-size:.78rem;font-weight:600">' + e(a.service) + ' — ' + e(a.metric) + '</div>';
    html += '<div style="font-size:.65rem;color:var(--text3)">' + fmtDate(a.startedAt) + '</div></div>';
    html += '<div style="font-size:.65rem;color:var(--accent);font-family:monospace">' + timeSince(a.startedAt) + '</div></div>';
  });
  html += '</div>';
  html += '</div>';

  // A11y issues
  var issues = (_data.dash.accessibility && _data.dash.accessibility.openIssues) || [];
  html += '<div class="card mb"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(139,92,246,.1)">A</div>Open Accessibility Issues</div><span class="pill pill-critical">' + issues.length + '</span></div>';
  issues.forEach(function(i) {
    html += '<div class="alert-row"><div class="a-dot ' + (i.severity==='critical'?'critical':i.severity==='serious'?'high':'medium') + '"></div>';
    html += '<div class="a-body"><div class="a-svc">' + e(i.component) + '<span class="pill pill-' + e(i.severity) + '">' + e(i.severity) + '</span><span class="pill pill-blue">' + e(i.page) + '</span></div>';
    html += '<div class="a-msg">' + e(i.description) + '</div>';
    html += '<div class="a-meta"><span class="a-kv">' + e(i.criterion) + '</span>';
    if (i.tags) i.tags.slice(0,3).forEach(function(t){ html += '<span class="a-kv">' + e(t) + '</span>'; });
    html += '</div></div></div>';
  });
  html += '</div>';

  document.getElementById('page-alerts').innerHTML = html;

  setTimeout(function() {
    var filtered = alerts.filter(function(a){ return a.value != null && a.threshold != null; });
    if (!filtered.length) return;
    destroyChart('ch-alertThresh');
    _charts['ch-alertThresh'] = new Chart(document.getElementById('ch-alertThresh'), {
      type: 'bar',
      data: { labels: filtered.map(function(a){ return e(a.service); }), datasets: [
        { label:'Value', data:filtered.map(function(a){return a.value;}), backgroundColor:'rgba(239,68,68,.7)', borderRadius:3 },
        { label:'Threshold', data:filtered.map(function(a){return a.threshold;}), backgroundColor:'rgba(245,158,11,.5)', borderRadius:3 }
      ]},
      options: { responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{ labels:{ color:'#94a3b8', font:{size:11} } }, tooltip:TOOLTIP }, scales:{ x:{ ticks:TICK, grid:GRID }, y:{ ticks:TICK, grid:GRID } } }
    });
  }, 50);
}

// ── CORRELATION ───────────────────────────────────────────────────────────────
function renderCorrelation() {
  var corr = _data.dash.correlation || {};
  var prioritized = corr.prioritizedAlerts || [];
  var stats = corr.stats || {};
  var snapshots = (_data.snapshots && _data.snapshots.items) || [];
  var html = '';

  // Stats
  html += '<div class="g4">';
  html += kpi('Raw Alerts', stats.rawAlertCount || 0, 'Before correlation', 'br', '--kc:var(--red)', 'raw');
  html += kpi('Correlated', stats.correlatedAlertCount || 0, 'Linked to A11y issues', 'bb', '--kc:var(--blue)', 'linked');
  html += kpi('A11y Issues', stats.openAccessibilityIssueCount || 0, 'Open findings', 'bp', '--kc:var(--purple)', 'open');
  html += kpi('Noise Reduction', (stats.alertNoiseReduction || 0).toFixed(1) + '%', 'Efficiency gain', 'bg', '--kc:var(--accent)', 'AI-powered');
  html += '</div>';

  // All correlated alerts
  html += '<div class="card mb"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(245,158,11,.1)">C</div>Prioritized Correlated Alerts</div><span class="pill pill-critical">' + prioritized.length + '</span></div>';
  prioritized.forEach(function(ca) {
    var alert = ca.alert || {};
    var pct = Math.min(100, ca.score || 0);
    var gc = ca.priority==='P1'?'var(--red)':ca.priority==='P2'?'var(--accent)':'var(--blue)';
    html += '<div class="corr-card">';
    html += '<div class="corr-hd"><span class="pill pill-' + e((ca.priority||'p4').toLowerCase()) + '">' + e(ca.priority) + '</span><span class="corr-score">Score: ' + e(ca.score) + '</span><span style="font-size:.72rem;color:var(--text2)">' + e(ca.service) + '</span><span style="font-size:.68rem;color:var(--text3)">' + e(ca.page) + '</span></div>';
    html += '<div class="corr-summary">' + e(ca.summary) + '</div>';
    html += '<div class="gauge-track"><div class="gauge-fill" style="width:' + pct + '%;background:' + gc + '"></div></div>';
    // alert detail
    if (alert.message) {
      html += '<div style="margin-top:8px;padding:8px;background:var(--card);border:1px solid var(--border);border-radius:7px">';
      html += '<div style="display:flex;align-items:center;gap:7px;margin-bottom:4px"><div class="a-dot ' + e(alert.severity) + '"></div><span style="font-size:.75rem;font-weight:600">' + e(alert.service) + '</span><span class="pill pill-' + e(alert.severity) + '">' + e(alert.severity) + '</span></div>';
      html += '<div style="font-size:.72rem;color:var(--text2)">' + e(alert.message) + '</div>';
      if (alert.value != null && alert.threshold != null) {
        var vp = Math.min(100, (alert.value / alert.threshold) * 100);
        html += '<div style="font-size:.65rem;color:var(--text3);margin-top:4px">val: ' + e(alert.value) + ' / thr: ' + e(alert.threshold) + '</div>';
        html += '<div class="gauge-track" style="margin-top:3px"><div class="gauge-fill" style="width:' + vp.toFixed(1) + '%;background:var(--red)"></div></div>';
      }
      html += '</div>';
    }
    if (ca.rationale && ca.rationale.length) {
      html += '<div class="rationale">' + ca.rationale.map(function(r){ return '<div class="rationale-item">' + e(r) + '</div>'; }).join('') + '</div>';
    }
    if (ca.accessibilityIssues && ca.accessibilityIssues.length) {
      html += '<div style="margin-top:8px;font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text3)">Linked A11y Issues</div>';
      html += '<div class="linked-issues">' + ca.accessibilityIssues.map(function(i) {
        return '<div class="linked-issue"><div class="linked-issue-hd"><span class="linked-issue-comp">' + e(i.component) + '</span><span class="pill pill-' + e(i.severity) + '">' + e(i.severity) + '</span></div><div class="linked-issue-desc">' + e(i.description) + '</div></div>';
      }).join('') + '</div>';
    }
    html += '</div>';
  });
  html += '</div>';

  // Snapshot history
  html += '<div class="card mb"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(59,130,246,.1)">H</div>Correlation Snapshot History</div><span class="pill pill-blue">' + snapshots.length + ' snapshots</span></div>';
  html += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ID</th><th>Generated</th><th>Source</th><th class="r">Raw</th><th class="r">Correlated</th><th class="r">A11y</th><th class="r">Noise Reduction</th><th>Top Priority</th></tr></thead><tbody>';
  snapshots.slice(0, 20).forEach(function(s) {
    var st = s.stats || {};
    var tp = s.topPriorityAlert;
    html += '<tr><td style="font-family:monospace;font-size:.68rem">' + e((s.id||'').substring(0,14)) + '</td>';
    html += '<td>' + fmtDate(s.generatedAt) + '</td>';
    html += '<td>' + e(s.source||'–') + '</td>';
    html += '<td class="r">' + (st.rawAlertCount||0) + '</td>';
    html += '<td class="r">' + (st.correlatedAlertCount||0) + '</td>';
    html += '<td class="r">' + (st.openAccessibilityIssueCount||0) + '</td>';
    html += '<td class="r">' + (st.alertNoiseReduction||0).toFixed(1) + '%</td>';
    html += '<td>' + (tp ? '<span class="pill pill-' + e((tp.priority||'p4').toLowerCase()) + '">' + e(tp.priority) + '</span>' : '–') + '</td></tr>';
  });
  html += '</tbody></table></div></div>';

  document.getElementById('page-correlation').innerHTML = html;
}

// ── CI/CD PIPELINE ────────────────────────────────────────────────────────────
function renderCICD() {
  var stages = [
    { icon:'📥', name:'Checkout', time:'2s', status:'done' },
    { icon:'📦', name:'Install Deps', time:'18s', status:'done' },
    { icon:'🔍', name:'Typecheck', time:'8s', status:'done' },
    { icon:'🚀', name:'Start API', time:'5s', status:'done' },
    { icon:'🧪', name:'Integration Tests', time:'12s', status:'done' },
    { icon:'♿', name:'Lighthouse CI', time:'30s', status:'done' },
    { icon:'🔒', name:'Security Scan', time:'45s', status:'done' },
    { icon:'🐳', name:'Docker Build', time:'60s', status:'done' },
    { icon:'📤', name:'Push GHCR', time:'20s', status:'done' },
    { icon:'✅', name:'Deploy', time:'15s', status:'done' }
  ];

  var html = '';

  // Pipeline visual
  html += '<div class="card mb"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(16,185,129,.1)">▶</div>GitHub Actions — CI/CD Pipeline</div><span class="pill pill-green">All Passing</span></div>';
  html += '<div class="pipeline">';
  stages.forEach(function(s, i) {
    if (i > 0) html += '<div class="pipe-connector done"></div>';
    html += '<div class="pipe-stage"><div class="pipe-icon ' + s.status + '">' + s.icon + '</div><div class="pipe-name">' + e(s.name) + '</div><div class="pipe-time">' + e(s.time) + '</div></div>';
  });
  html += '</div></div>';

  // Workflow files
  html += '<div class="g2">';
  var workflows = [
    { name:'ci.yml', desc:'Type-check, integration tests, Lighthouse audit', trigger:'push to main / PR', badge:'Passing', color:'var(--green)', steps:['Checkout','Setup Node 20','npm ci','tsc --noEmit','Start API','Integration tests','Lighthouse CI','Upload artifacts'] },
    { name:'docker-publish.yml', desc:'Build and push Docker images to GHCR', trigger:'push to main / tags', badge:'Passing', color:'var(--blue)', steps:['Checkout','Login to GHCR','Extract metadata','Build API image','Push API image','Build Worker image','Push Worker image'] },
    { name:'security-scan.yml', desc:'Dependency audit + Trivy container scan', trigger:'Weekly schedule', badge:'Clean', color:'var(--green)', steps:['Checkout','npm audit','Trivy scan API image','Trivy scan Worker image','Upload SARIF'] },
    { name:'release.yml', desc:'Semantic versioning and GitHub releases', trigger:'push tags v*', badge:'Ready', color:'var(--accent)', steps:['Checkout','Create release','Upload artifacts','Update changelog'] }
  ];
  workflows.forEach(function(wf) {
    html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(59,130,246,.1)">⚙</div>' + e(wf.name) + '</div><span class="pill pill-green">' + e(wf.badge) + '</span></div>';
    html += '<div style="font-size:.75rem;color:var(--text2);margin-bottom:8px">' + e(wf.desc) + '</div>';
    html += '<div style="font-size:.65rem;color:var(--text3);margin-bottom:10px">Trigger: ' + e(wf.trigger) + '</div>';
    html += '<div style="display:flex;flex-direction:column;gap:4px">';
    wf.steps.forEach(function(step, i) {
      html += '<div style="display:flex;align-items:center;gap:8px;font-size:.72rem">';
      html += '<div style="width:16px;height:16px;border-radius:50%;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);display:grid;place-items:center;font-size:9px;color:var(--green);flex-shrink:0">✓</div>';
      html += e(step) + '</div>';
    });
    html += '</div></div>';
  });
  html += '</div>';

  // Docker images
  html += '<div class="card mb"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(59,130,246,.1)">🐳</div>Docker Images — GHCR</div></div>';
  html += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Image</th><th>Registry</th><th>Tags</th><th>Base</th><th>Build Strategy</th><th>Health Check</th></tr></thead><tbody>';
  [
    { name:'aegis-api', reg:'ghcr.io/herr-rishab/aegis_mcx-api', tags:'main, sha-*, v*.*.*', base:'node:20-alpine', strategy:'Multi-stage', health:'/health endpoint' },
    { name:'aegis-worker', reg:'ghcr.io/herr-rishab/aegis_mcx-worker', tags:'main, sha-*, v*.*.*', base:'node:20-alpine', strategy:'Multi-stage', health:'Heartbeat API' }
  ].forEach(function(img) {
    html += '<tr><td><strong>' + e(img.name) + '</strong></td><td style="font-size:.68rem;font-family:monospace">' + e(img.reg) + '</td><td>' + e(img.tags) + '</td><td>' + e(img.base) + '</td><td><span class="pill pill-blue">' + e(img.strategy) + '</span></td><td><span class="pill pill-green">' + e(img.health) + '</span></td></tr>';
  });
  html += '</tbody></table></div></div>';

  document.getElementById('page-cicd').innerHTML = html;
}

// ── INFRASTRUCTURE ────────────────────────────────────────────────────────────
function renderInfra() {
  var health = _data.health || {};
  var worker = _data.dash.worker || {};
  var html = '';

  // Infra stack
  html += '<div class="sec">Infrastructure Stack</div>';
  html += '<div class="infra-grid mb">';
  var stack = [
    { icon:'🐳', name:'Docker', desc:'Multi-stage builds', badge:'Active', bc:'bg' },
    { icon:'☸️', name:'Kubernetes', desc:'k8s deployments + HPA', badge:'Ready', bc:'bg' },
    { icon:'⛵', name:'Helm', desc:'Parameterized charts', badge:'Ready', bc:'bg' },
    { icon:'🏗️', name:'Terraform', desc:'AWS ECS IaC', badge:'Configured', bc:'bb' },
    { icon:'📊', name:'Prometheus', desc:'Metrics collection', badge:'Active', bc:'bg' },
    { icon:'⚙️', name:'GitHub Actions', desc:'CI/CD automation', badge:'Passing', bc:'bg' },
    { icon:'🔒', name:'Trivy', desc:'Container scanning', badge:'Clean', bc:'bg' },
    { icon:'♿', name:'Lighthouse CI', desc:'A11y audits', badge:'Passing', bc:'bb' }
  ];
  stack.forEach(function(s) {
    html += '<div class="infra-card"><div class="infra-icon">' + s.icon + '</div><div class="infra-name">' + e(s.name) + '</div><div class="infra-desc">' + e(s.desc) + '</div><div class="infra-badge ' + s.bc + '">' + e(s.badge) + '</div></div>';
  });
  html += '</div>';

  // K8s manifests
  html += '<div class="g2">';
  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(59,130,246,.1)">☸</div>Kubernetes Manifests</div></div>';
  var k8s = [
    { file:'api-deployment.yaml', desc:'API server deployment, 2 replicas, resource limits' },
    { file:'worker-deployment.yaml', desc:'Worker deployment, env vars, restart policy' },
    { file:'api-service.yaml', desc:'ClusterIP service exposing port 3000' },
    { file:'configmap.yaml', desc:'Environment configuration for both services' },
    { file:'storage-pvc.yaml', desc:'PersistentVolumeClaim for runtime storage' }
  ];
  k8s.forEach(function(f) {
    html += '<div style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid rgba(30,45,69,.4)">';
    html += '<span style="font-size:.68rem;font-family:monospace;color:var(--blue);flex-shrink:0">' + e(f.file) + '</span>';
    html += '<span style="font-size:.7rem;color:var(--text3)">' + e(f.desc) + '</span></div>';
  });
  html += '</div>';

  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(245,158,11,.1)">T</div>Terraform — AWS ECS</div></div>';
  var tf = [
    { file:'main.tf', desc:'ECS cluster, task definitions, services' },
    { file:'variables.tf', desc:'Configurable inputs: region, image tags, CPU/memory' },
    { file:'outputs.tf', desc:'Service URLs, cluster ARN, task ARNs' }
  ];
  tf.forEach(function(f) {
    html += '<div style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid rgba(30,45,69,.4)">';
    html += '<span style="font-size:.68rem;font-family:monospace;color:var(--accent);flex-shrink:0">' + e(f.file) + '</span>';
    html += '<span style="font-size:.7rem;color:var(--text3)">' + e(f.desc) + '</span></div>';
  });
  html += '<div style="margin-top:12px;padding:10px;background:var(--card2);border:1px solid var(--border);border-radius:8px;font-size:.72rem;color:var(--text2)">Provisions ECS Fargate cluster with auto-scaling, ALB, CloudWatch logging, and IAM roles for both API and Worker services.</div>';
  html += '</div>';
  html += '</div>';

  // Health + Worker
  html += '<div class="g2">';
  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(16,185,129,.1)">H</div>Health Check</div><span class="pill ' + (health.status === 'ok' ? 'pill-green' : 'pill-critical') + '">' + e(health.status || '–') + '</span></div>';
  html += '<div class="worker-grid">';
  [
    ['Status', health.status || '–'],
    ['Active Alerts', health.activeAlerts != null ? health.activeAlerts : '–'],
    ['Open A11y Issues', health.openAccessibilityIssues != null ? health.openAccessibilityIssues : '–'],
    ['Frontend Served', health.frontendServed ? 'Yes' : 'No'],
    ['Runtime Storage', health.runtimeStorage || '–'],
    ['Latest Correlation', fmtDate(health.latestCorrelationGeneratedAt)]
  ].forEach(function(item) {
    html += '<div class="worker-item"><div class="worker-lbl">' + e(item[0]) + '</div><div class="worker-val">' + e(String(item[1])) + '</div></div>';
  });
  html += '</div></div>';

  html += '<div class="card"><div class="card-hd"><div class="card-title"><div class="card-icon" style="background:rgba(245,158,11,.1)">W</div>Correlation Worker</div><span class="pill ' + (worker.status==='healthy'?'pill-green':worker.status==='degraded'?'pill-critical':'pill-high') + '">' + e(worker.status||'idle') + '</span></div>';
  html += '<div class="worker-grid">';
  [
    ['Status', worker.status || 'idle'],
    ['Last Heartbeat', fmtDate(worker.lastHeartbeatAt)],
    ['Last Run', fmtDate(worker.lastRunAt)],
    ['Poll Interval', worker.pollIntervalMs ? (worker.pollIntervalMs/1000) + 's' : '–'],
    ['API Base URL', worker.apiBaseUrl || '–'],
    ['Last Correlation ID', worker.lastCorrelationId || '–'],
    ['Last Error', worker.lastError || 'None']
  ].forEach(function(item) {
    html += '<div class="worker-item"><div class="worker-lbl">' + e(item[0]) + '</div><div class="worker-val ' + (item[0]==='Status'?'s-'+worker.status:'') + '">' + e(String(item[1])) + '</div></div>';
  });
  html += '</div></div>';
  html += '</div>';

  document.getElementById('page-infra').innerHTML = html;
}

// ── CHART HELPERS ─────────────────────────────────────────────────────────────
function drawDoughnut(id, labels, data, colors) {
  destroyChart(id);
  var ctx = document.getElementById(id);
  if (!ctx) return;
  _charts[id] = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderColor: '#111827', borderWidth: 2, hoverOffset: 5 }] },
    options: { responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{ legend:{ position:'right', labels:{ color:'#94a3b8', font:{size:11}, boxWidth:12, padding:10 } }, tooltip:{ backgroundColor:'#111827', borderColor:'#1e2d45', borderWidth:1, titleColor:'#e2e8f0', bodyColor:'#94a3b8' } } }
  });
}

function drawBar(id, labels, data, color, horizontal) {
  destroyChart(id);
  var ctx = document.getElementById(id);
  if (!ctx) return;
  _charts[id] = new Chart(ctx, {
    type: 'bar',
    data: { labels: labels, datasets: [{ data: data, backgroundColor: color, borderRadius: 4 }] },
    options: { responsive:true, maintainAspectRatio:false, indexAxis: horizontal ? 'y' : 'x', plugins:{ legend:{display:false}, tooltip:TOOLTIP }, scales:{ x:{ ticks:TICK, grid:GRID }, y:{ ticks:TICK, grid:GRID } } }
  });
}

function drawHBar(id, labels, data, colors) {
  destroyChart(id);
  var ctx = document.getElementById(id);
  if (!ctx) return;
  _charts[id] = new Chart(ctx, {
    type: 'bar',
    data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderRadius: 4 }] },
    options: { responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{display:false}, tooltip:TOOLTIP }, scales:{ x:{ ticks:TICK, grid:GRID, min:0 }, y:{ ticks:TICK, grid:GRID } } }
  });
}

// ── BOOT ──────────────────────────────────────────────────────────────────────
window.refresh = refresh;
refresh(false);
setInterval(function() { refresh(false); }, 10000);
