import React, { memo, useMemo } from 'react';
import { LocateFixed, AlertTriangle } from 'lucide-react';
import { computeSpreadHistory } from '../data';

const StatArbScanner = memo(({ priceHistories, commodities }) => {
  const arbOpportunities = useMemo(() => {
    if (!priceHistories || !priceHistories[0] || priceHistories[0].length < 10) return [];

    const n = commodities.length;
    const ops = [];

    // Scan all possible permutations
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const { spreads, mean, std } = computeSpreadHistory(priceHistories[i], priceHistories[j], 50);
        if (spreads.length < 2) continue;

        const currentSpread = spreads[spreads.length - 1];
        const prevSpread = spreads[spreads.length - 2];
        const z = std > 0 ? (currentSpread - mean) / std : 0;
        const absZ = Math.abs(z);

        if (absZ > 1.0) { // Only show pairs diverging at least 1 std dev
          ops.push({
            pair: `${commodities[i].symbol}/${commodities[j].symbol}`,
            cmdI: commodities[i].symbol,
            cmdJ: commodities[j].symbol,
            zScore: z,
            absZ,
            spread: currentSpread,
            mean,
            std,
            trend: currentSpread > prevSpread ? 'widening' : 'narrowing'
          });
        }
      }
    }

    // Sort heavily diverging pairs to the top
    return ops.sort((a, b) => b.absZ - a.absZ).slice(0, 10);
  }, [priceHistories, commodities]);

  return (
    <div className="bg-bg-card backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden h-full flex flex-col fade-in-up transition-all duration-500">
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LocateFixed size={16} className="text-[#3D4981]" />
          <h2 className="font-display font-bold text-[15px] text-text-primary">Stat-Arb Auto Scanner</h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <span className="flex items-center gap-1"><AlertTriangle size={10} className="text-amber"/> Divergence &gt; 1σ</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-secondary/40 text-text-muted text-[10px] uppercase font-bold sticky top-0 z-10 backdrop-blur-sm border-b border-border/50">
              <th className="py-2.5 px-4 font-sans tracking-tight">Instrument Pair</th>
              <th className="py-2.5 px-4 font-sans text-right">Z-Score (σ)</th>
              <th className="py-2.5 px-4 font-sans text-right hidden lg:table-cell">Spread Value</th>
              <th className="py-2.5 px-4 font-sans text-center">Arb Strategy</th>
            </tr>
          </thead>
          <tbody>
            {arbOpportunities.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-text-muted text-[12px]">
                  No active divergences detected. Markets highly correlated.
                </td>
              </tr>
            ) : (
              arbOpportunities.map((op, idx) => {
                const isOverbought = op.zScore > 0;
                return (
                  <tr key={`${op.pair}-${idx}`} className="border-b border-border/30 hover:bg-bg-card-hover transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-text-primary text-[12px]">{op.pair}</div>
                      <div className="text-[9px] text-text-muted italic">{op.trend}</div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[12px]">
                      <span className={isOverbought ? 'text-emerald' : 'text-red'}>
                        {op.zScore > 0 ? '+' : ''}{op.zScore.toFixed(2)}σ
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[11px] text-text-secondary hidden lg:table-cell">
                      {op.spread.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col gap-1 items-center">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${isOverbought ? 'bg-red-900/40 text-red border-red-500/30' : 'bg-emerald-900/40 text-emerald border-emerald-500/30'}`}>
                          {isOverbought ? `SELL ${op.cmdI} / BUY ${op.cmdJ}` : `BUY ${op.cmdI} / SELL ${op.cmdJ}`}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

StatArbScanner.displayName = 'StatArbScanner';
export default StatArbScanner;
