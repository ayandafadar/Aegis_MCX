import React, { memo } from 'react';
import { AlertTriangle, ArrowLeftRight, Shield, Zap, TrendingUp, TrendingDown } from 'lucide-react';

const SIGNAL_CONFIG = {
  ARBIT:    { icon: ArrowLeftRight, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'ARBITRAGE' },
  CONVERGE: { icon: Zap,            color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: 'CONVERGE' },
  REGIME:   { icon: AlertTriangle,   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'REGIME CHG' },
  HEDGE:    { icon: Shield,          color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  label: 'HEDGE' },
};

const SignalRow = memo(({ signal, index }) => {
  const config = SIGNAL_CONFIG[signal.type] || SIGNAL_CONFIG.HEDGE;
  const Icon = config.icon;
  const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Outlier highlight if confidence > 85
  const isOutlier = signal.confidence > 85;

  return (
    <div className={`slide-in border-b border-border/30 p-3 hover:bg-bg-card-hover/40 transition-colors ${isOutlier ? 'bg-bg-secondary/20 border-l-[3px]' : 'border-l-[3px] border-l-transparent'}`}
      style={{ animationDelay: `${index * 50}ms`, borderLeftColor: isOutlier ? config.color : 'transparent' }}>
      <div className="flex items-center justify-between mb-2">
         <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ background: config.bg }}>
              <Icon size={16} style={{ color: config.color }} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-black tracking-wide truncate" style={{ color: config.color }}>{config.label}</span>
              <span className="text-[11px] font-semibold text-text-primary truncate">{signal.pair}</span>
            </div>
         </div>
         <div className="flex flex-col items-end flex-shrink-0">
             <span className="text-[9px] text-text-muted">{ts}</span>
             <div className="flex items-center gap-1 mt-0.5">
                 {Number(signal.zScore) > 0 ? <TrendingUp size={12} className="text-emerald" /> : <TrendingDown size={12} className="text-crimson" />}
             </div>
         </div>
      </div>
      
      <div className="text-[11px] text-text-secondary mb-2.5 truncate">{signal.message}</div>
      
      {/* Grid Layout for Metrics */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 text-[10px] bg-bg-primary/40 px-2 py-1.5 rounded border border-border/50">
        <div className="truncate">
          <div className="text-text-muted text-[8px] uppercase tracking-wider">Entry I</div>
          <div className="font-semibold text-text-primary">{signal.entryI}</div>
        </div>
        <div className="truncate">
          <div className="text-text-muted text-[8px] uppercase tracking-wider">Entry J</div>
          <div className="font-semibold text-text-primary">{signal.entryJ}</div>
        </div>
        <div className="truncate">
          <div className="text-text-muted text-[8px] uppercase tracking-wider">Z-Score</div>
          <div className="font-semibold text-amber truncate">{signal.zScore}</div>
        </div>
        <div className="hidden sm:block truncate">
          <div className="text-text-muted text-[8px] uppercase tracking-wider">Corr (ρ)</div>
          <div className="font-semibold text-purple truncate">{signal.correlation}</div>
        </div>
        <div className="truncate text-right sm:text-left">
          <div className="text-text-muted text-[8px] uppercase tracking-wider">Conf</div>
          <div className="font-bold" style={{ color: config.color }}>{signal.confidence}%</div>
        </div>
      </div>
    </div>
  );
});

SignalRow.displayName = 'SignalRow';

const SignalTicker = memo(({ signals }) => {
  if (!signals.length) return null;
  const tickerItems = [...signals, ...signals];
  return (
    <div className="w-full overflow-hidden bg-bg-secondary/50 border-b border-border">
      <div className="flex items-center whitespace-nowrap py-1.5"
        style={{ animation: `ticker-scroll ${Math.max(20, signals.length * 5)}s linear infinite` }}>
        {tickerItems.map((s, i) => {
          const config = SIGNAL_CONFIG[s.type] || SIGNAL_CONFIG.HEDGE;
          return (
            <span key={i} className="inline-flex items-center gap-1.5 mx-4 text-[11px]">
              <span className="font-bold" style={{ color: config.color }}>{config.label}</span>
              <span className="text-text-secondary">{s.pair}</span>
              <span className="text-text-muted">|</span>
              <span className="text-text-primary">{s.message}</span>
              <span className="text-text-muted">|</span>
              <span style={{ color: config.color }}>{s.confidence}%</span>
            </span>
          );
        })}
      </div>
    </div>
  );
});

SignalTicker.displayName = 'SignalTicker';

const SignalPanel = memo(({ signals, signalLog }) => {
  return (
    <div className="bg-bg-card backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-amber" />
          <h2 className="font-display font-bold text-[15px] text-text-primary">Trading Signals</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber/10 text-amber font-bold">
            {signals.length} active
          </span>
        </div>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        {signals.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-[12px]">
            Monitoring for signals...
          </div>
        ) : (
          signals.slice(0, 12).map((s, i) => <SignalRow key={`${s.type}-${s.pair}-${i}`} signal={s} index={i} />)
        )}
      </div>

      {signalLog.length > 0 && (
        <div className="border-t border-border">
          <div className="px-4 py-2 bg-bg-secondary/30">
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Signal Log ({signalLog.length})</span>
          </div>
          <div className="max-h-[250px] overflow-y-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-bg-secondary/20">
                  <th className="py-1.5 px-2 text-left text-text-muted font-medium">Time</th>
                  <th className="py-1.5 px-2 text-left text-text-muted font-medium">Type</th>
                  <th className="py-1.5 px-2 text-left text-text-muted font-medium">Pair</th>
                  <th className="py-1.5 px-2 text-right text-text-muted font-medium">β</th>
                  <th className="py-1.5 px-2 text-right text-text-muted font-medium">Conf</th>
                </tr>
              </thead>
              <tbody>
                {signalLog.slice(-20).reverse().map((s, i) => {
                  const config = SIGNAL_CONFIG[s.type] || SIGNAL_CONFIG.HEDGE;
                  return (
                    <tr key={i} className="border-b border-border/20">
                      <td className="py-1 px-2 text-text-muted">{s.time}</td>
                      <td className="py-1 px-2">
                        <span className="font-bold" style={{ color: config.color }}>{s.type}</span>
                      </td>
                      <td className="py-1 px-2 text-text-secondary">{s.pair}</td>
                      <td className="py-1 px-2 text-right text-cyan">{s.hedgeRatio}</td>
                      <td className="py-1 px-2 text-right" style={{ color: config.color }}>{s.confidence}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});

SignalPanel.displayName = 'SignalPanel';

export { SignalTicker, SignalPanel };
export default SignalPanel;
