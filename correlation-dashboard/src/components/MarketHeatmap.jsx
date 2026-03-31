import React, { memo } from 'react';
import { LayoutGrid } from 'lucide-react';

const MarketHeatmap = memo(({ commodities, prices, prevPrices }) => {
  // Compute price deltas
  const heatmapData = commodities.map((cmd, i) => {
    const current = prices[i] || cmd.basePrice;
    const previous = prevPrices[i] || cmd.basePrice;
    const pctChange = ((current - previous) / previous) * 100;
    
    // Determine color based on severity of change
    let bgClass = 'bg-[#1e293b]'; // Neutral Slate-800
    if (pctChange > 0.05) bgClass = 'bg-emerald-900 border-emerald-500/50';
    if (pctChange > 0.15) bgClass = 'bg-emerald-700 border-emerald-400';
    if (pctChange > 0.25) bgClass = 'bg-emerald-500 border-emerald-200';
    
    if (pctChange < -0.05) bgClass = 'bg-red-900 border-red-500/50';
    if (pctChange < -0.15) bgClass = 'bg-red-700 border-red-400';
    if (pctChange < -0.25) bgClass = 'bg-red-500 border-red-200';

    // If zero or barely moving
    if (Math.abs(pctChange) <= 0.05) {
      bgClass = 'bg-[#1e293b] border-border';
    }

    return {
      symbol: cmd.symbol,
      pctChange,
      bgClass,
      current
    };
  });

  return (
    <div className="bg-bg-card backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden h-full flex flex-col transition-all duration-500 fade-in-up">
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid size={16} className="text-[#3D4981]" />
          <h2 className="font-display font-bold text-[15px] text-text-primary">Market Impact Heatmap</h2>
        </div>
        <span className="text-[10px] text-text-muted">Live Delta</span>
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 h-full">
          {heatmapData.map(data => (
            <div 
              key={data.symbol}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors duration-300 ${data.bgClass}`}
            >
              <span className="font-sans font-bold text-[12px] text-white tracking-wider">
                {data.symbol}
              </span>
              <span className="font-mono text-[11px] text-white/90 mt-1">
                {data.pctChange > 0 ? '+' : ''}{data.pctChange.toFixed(3)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

MarketHeatmap.displayName = 'MarketHeatmap';
export default MarketHeatmap;
