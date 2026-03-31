import React, { memo, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const PriceRow = memo(({ commodity, price, prevPrice, volume, bid, ask }) => {
  const rowRef = useRef(null);
  const change = prevPrice ? ((price - prevPrice) / prevPrice * 100) : 0;
  const isUp = price > (prevPrice || price);
  const isDown = price < (prevPrice || price);

  useEffect(() => {
    if (rowRef.current && prevPrice && price !== prevPrice) {
      rowRef.current.classList.remove('flash-green', 'flash-red');
      void rowRef.current.offsetWidth;
      rowRef.current.classList.add(isUp ? 'flash-green' : 'flash-red');
    }
  }, [price, prevPrice, isUp]);

  const fmt = (v) => {
    if (v >= 10000) return v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    if (v >= 100) return v.toLocaleString('en-IN', { maximumFractionDigits: 1 });
    return v.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  return (
    <tr ref={rowRef} className="border-b border-border/30 hover:bg-bg-card-hover/50 transition-colors duration-150">
      <td className="py-2.5 px-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald' : isDown ? 'bg-crimson' : 'bg-text-muted'}`} />
          <span className="font-semibold text-text-primary text-[13px]">{commodity.symbol}</span>
        </div>
      </td>
      <td className="py-2.5 px-3 text-right font-semibold text-[14px] whitespace-nowrap">
        <span className={isUp ? 'text-emerald' : isDown ? 'text-crimson' : 'text-text-primary'}>
          {fmt(price)}
        </span>
      </td>
      <td className={`py-2.5 px-3 text-right text-[12px] font-medium whitespace-nowrap ${change >= 0 ? 'text-emerald' : 'text-crimson'}`}>
        <div className="flex items-center justify-end gap-1">
          {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </div>
      </td>
      <td className="py-2.5 px-3 text-right text-[11px] text-text-secondary whitespace-nowrap">
        <span className="text-emerald">{fmt(bid)}</span>
        <span className="text-text-muted mx-1">/</span>
        <span className="text-crimson">{fmt(ask)}</span>
      </td>
      <td className="py-2.5 px-3 text-right text-[11px] text-text-secondary whitespace-nowrap">{volume.toLocaleString('en-IN')}</td>
      <td className="py-2.5 px-3 text-right text-[10px] text-text-muted whitespace-nowrap">{commodity.unit}</td>
      <td className="py-2.5 px-3 text-right text-[10px] text-text-muted whitespace-nowrap">{commodity.lotSize}</td>
    </tr>
  );
});

PriceRow.displayName = 'PriceRow';

const LivePriceFeed = memo(({ commodities, prices, prevPrices, volumes, bids, asks }) => {
  return (
    <div className="bg-bg-card backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-cyan" />
          <h2 className="font-display font-bold text-[15px] text-text-primary">Live MCX Price Feed</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
          <span className="text-[10px] text-text-muted uppercase tracking-wider">LIVE</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-bg-secondary/50">
              <th className="py-2 px-3 text-left text-[10px] text-text-muted uppercase tracking-wider font-medium whitespace-nowrap">Symbol</th>
              <th className="py-2 px-3 text-right text-[10px] text-text-muted uppercase tracking-wider font-medium whitespace-nowrap">LTP</th>
              <th className="py-2 px-3 text-right text-[10px] text-text-muted uppercase tracking-wider font-medium whitespace-nowrap">Chg%</th>
              <th className="py-2 px-3 text-right text-[10px] text-text-muted uppercase tracking-wider font-medium whitespace-nowrap">Bid/Ask</th>
              <th className="py-2 px-3 text-right text-[10px] text-text-muted uppercase tracking-wider font-medium whitespace-nowrap">Volume</th>
              <th className="py-2 px-3 text-right text-[10px] text-text-muted uppercase tracking-wider font-medium whitespace-nowrap">Unit</th>
              <th className="py-2 px-3 text-right text-[10px] text-text-muted uppercase tracking-wider font-medium whitespace-nowrap">Lot</th>
            </tr>
          </thead>
          <tbody>
            {commodities.map((c, i) => (
              <PriceRow
                key={c.symbol}
                commodity={c}
                price={prices[i]}
                prevPrice={prevPrices[i]}
                volume={volumes[i]}
                bid={bids[i]}
                ask={asks[i]}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

LivePriceFeed.displayName = 'LivePriceFeed';
export default LivePriceFeed;
