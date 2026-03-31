import React, { useState, memo } from 'react';
import { MousePointerClick, TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';

const OrderEntryTicket = memo(({ commodities, bids, asks, selectedIdx, onSelect, onExecute }) => {
  const [qty, setQty] = useState(1);
  const activeCmd = commodities[selectedIdx];
  const activeBid = bids[selectedIdx];
  const activeAsk = asks[selectedIdx];

  const handleBuy = () => {
    onExecute({
      type: 'BUY',
      cmdIdx: selectedIdx,
      symbol: activeCmd.symbol,
      qty: Number(qty),
      entryPrice: activeAsk // Buy at ask
    });
  };

  const handleSell = () => {
    onExecute({
      type: 'SELL',
      cmdIdx: selectedIdx,
      symbol: activeCmd.symbol,
      qty: Number(qty),
      entryPrice: activeBid // Sell at bid
    });
  };

  const requiredMargin = (activeAsk * qty * 0.1).toFixed(2); // Mock 10% margin requirement

  return (
    <div className="bg-bg-card backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl flex flex-col h-full fade-in-up transition-all duration-500 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MousePointerClick size={16} className="text-[#3D4981]" />
          <h2 className="font-display font-bold text-[15px] text-text-primary">Order Execution Ticket</h2>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-6 flex-1">
        
        {/* Instrument Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-text-muted font-bold tracking-wider uppercase">Instrument</label>
          <div className="relative">
            <select 
              value={selectedIdx} 
              onChange={(e) => onSelect(Number(e.target.value))}
              className="w-full bg-bg-secondary/50 border border-border/50 text-text-primary text-[14px] rounded-lg p-2.5 outline-none focus:border-[#3D4981] transition-colors appearance-none cursor-pointer"
            >
              {commodities.map((c, i) => (
                <option key={c.symbol} value={i} className="bg-bg-secondary">{c.symbol}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-[10px]">▼</div>
          </div>
        </div>

        {/* Live Quotes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 p-3 rounded-lg border border-border/30 bg-bg-secondary/20">
            <span className="text-[10px] text-text-muted font-medium">BID (Sell Price)</span>
            <span className="text-[15px] font-mono font-bold text-red tracking-tight">
              {activeBid.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-lg border border-border/30 bg-bg-secondary/20">
            <span className="text-[10px] text-text-muted font-medium">ASK (Buy Price)</span>
            <span className="text-[15px] font-mono font-bold text-emerald tracking-tight">
              {activeAsk.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Qty & Margin */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-text-muted font-bold tracking-wider uppercase">Order Quantity (Lots)</label>
            <input 
              type="number" 
              min="1" 
              max="1000"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-bg-secondary/50 border border-border/50 text-white text-[16px] font-mono font-bold rounded-lg p-3 outline-none focus:border-[#00d4ff]/50 transition-colors"
            />
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              <IndianRupee size={10} /> Margin Req (10%)
            </span>
            <span className="text-[12px] font-mono font-bold text-[#85a0e0]">₹{Number(requiredMargin).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="mt-auto pt-2 grid grid-cols-2 gap-3">
          <button 
            onClick={handleBuy}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[14px] py-3.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400/20 active:scale-[0.98]"
          >
            <TrendingUp size={16} /> BUY MARKET
          </button>
          <button 
            onClick={handleSell}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-[14px] py-3.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-400/20 active:scale-[0.98]"
          >
            <TrendingDown size={16} /> SELL MARKET
          </button>
        </div>
      </div>
    </div>
  );
});

OrderEntryTicket.displayName = 'OrderEntryTicket';
export default OrderEntryTicket;
