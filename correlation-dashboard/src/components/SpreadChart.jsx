import React, { memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { computeSpreadHistory } from '../data';

const SpreadMiniChart = memo(({ signal, pricesI, pricesJ }) => {
  const { spreads, mean, std } = useMemo(
    () => computeSpreadHistory(pricesI || [], pricesJ || [], 50),
    [pricesI, pricesJ]
  );

  const data = useMemo(() => spreads.map((v, i) => ({
    idx: i,
    spread: v,
    upper2: mean + 2 * std,
    upper1: mean + std,
    lower1: mean - std,
    lower2: mean - 2 * std,
    mean: mean,
  })), [spreads, mean, std]);

  if (data.length < 3) return null;

  const currentSpread = spreads[spreads.length - 1];
  const isAboveMean = currentSpread > mean;
  const zFromMean = std > 0 ? Math.abs(currentSpread - mean) / std : 0;

  return (
    <div className="bg-bg-card backdrop-blur-md border border-border/50 rounded-2xl p-3 shadow-lg transition-all duration-500 ease-in-out">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={12} className="text-cyan" />
          <span className="text-[11px] font-semibold text-text-primary">{signal.pair}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
            style={{
              background: signal.type === 'ARBIT' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
              color: signal.type === 'ARBIT' ? '#f59e0b' : '#10b981',
            }}>
            {signal.type}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-text-muted truncate">
          <span>z: <span className="text-amber font-bold">{zFromMean.toFixed(2)}</span></span>
          <span className="hidden sm:inline">μ: <span className="text-text-secondary">{mean.toFixed(4)}</span></span>
          <span className="hidden sm:inline">σ: <span className="text-text-secondary">{std.toFixed(4)}</span></span>
        </div>
      </div>
      <div className="h-[100px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
            <defs>
              <linearGradient id={`entryZone-${signal.pair}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isAboveMean ? '#ef4444' : '#10b981'} stopOpacity={0.15} />
                <stop offset="100%" stopColor={isAboveMean ? '#ef4444' : '#10b981'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <ReferenceLine y={mean + 2 * std} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
            <ReferenceLine y={mean + std} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={mean} stroke="#475569" strokeDasharray="2 2" strokeOpacity={0.6} />
            <ReferenceLine y={mean - std} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={mean - 2 * std} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Area type="monotone" dataKey="spread" fill={`url(#entryZone-${signal.pair})`} stroke="none" />
            <Line type="monotone" dataKey="spread" stroke="#00d4ff" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between mt-1 text-[8px] text-text-muted">
        <span>±2σ Entry</span>
        <span>±1σ Caution</span>
        <span>50 ticks</span>
      </div>
    </div>
  );
});

SpreadMiniChart.displayName = 'SpreadMiniChart';

const SpreadChartPanel = memo(({ signals, priceHistories, commodities }) => {
  const symbolToIdx = useMemo(() => {
    const map = {};
    commodities.forEach((c, i) => { map[c.symbol] = i; });
    return map;
  }, [commodities]);

  const activeSignals = signals.filter(s => s.type === 'ARBIT' || s.type === 'CONVERGE').slice(0, 4);

  if (activeSignals.length === 0) {
    return (
      <div className="bg-bg-card backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-4 min-h-[320px] transition-all duration-500">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-[#3D4981]" />
          <h2 className="font-display font-bold text-[15px] text-text-primary">Spread / Ratio Charts</h2>
        </div>
        <div className="text-center py-6 text-text-muted text-[12px] flex items-center justify-center h-full pb-10">
          No active spread signals — awaiting divergence...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <BarChart3 size={16} className="text-cyan" />
        <h2 className="font-display font-bold text-[15px] text-text-primary">Spread / Ratio Charts</h2>
        <span className="hidden sm:inline text-[10px] text-text-muted ml-auto mt-1 sm:mt-0">Mean bands: ±1σ, ±2σ</span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {activeSignals.map((s, i) => {
          const [symI, symJ] = s.pair.split('/');
          const idxI = symbolToIdx[symI];
          const idxJ = symbolToIdx[symJ];
          return (
            <SpreadMiniChart
              key={s.pair}
              signal={s}
              pricesI={priceHistories[idxI]}
              pricesJ={priceHistories[idxJ]}
            />
          );
        })}
      </div>
    </div>
  );
});

SpreadChartPanel.displayName = 'SpreadChartPanel';
export default SpreadChartPanel;
