import React, { useState, memo, useEffect } from 'react';
import { MousePointerClick, TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';
import { getMarginRate } from '../data';

const OrderEntryTicket = memo(({ commodities, bids, asks, selectedIdx, onSelect, onExecute }) => {
  const [qtyInput, setQtyInput] = useState(100);
  const [orderPrice, setOrderPrice] = useState(0);
  const activeCmd = commodities[selectedIdx];
  const activeBid = bids[selectedIdx];
  const activeAsk = asks[selectedIdx];

  const usesGramInput = /\/(g|kg|10g)$/i.test(activeCmd.unit);
  const marginRate = getMarginRate(activeCmd.symbol);

  useEffect(() => {
    setOrderPrice(activeAsk);
  }, [selectedIdx, activeAsk]);

  const toExecutableQty = (cmd, rawQtyInput) => {
    const input = Number(rawQtyInput);
    if (!Number.isFinite(input) || input <= 0) return 0;

    if (/\/10g$/i.test(cmd.unit)) return input / 10;
    if (/\/kg$/i.test(cmd.unit)) return input / 1000;
    if (/\/g$/i.test(cmd.unit)) return input;
    return input;
  };

  const executableQty = toExecutableQty(activeCmd, qtyInput);
  const effectivePrice = Number(orderPrice) || 0;
  const requiredMargin = (effectivePrice * executableQty * marginRate).toFixed(2);

  const submitOrder = (type) => {
    if (!Number.isFinite(effectivePrice) || effectivePrice <= 0) return;
    if (!Number.isFinite(executableQty) || executableQty <= 0) return;

    onExecute({
      type,
      cmdIdx: selectedIdx,
      symbol: activeCmd.symbol,
      qty: executableQty,
      qtyDisplay: Number(qtyInput),
      qtyUnit: usesGramInput ? 'g' : 'units',
      entryPrice: effectivePrice,
              marginRate,
    });
  };

  const handleBuy = () => {
    submitOrder('BUY');
  };

  const handleSell = () => {
    submitOrder('SELL');
  };

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

        {/* Price, Qty & Margin */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-text-muted font-bold tracking-wider uppercase">Order Price (User Input)</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={orderPrice}
                onChange={(e) => setOrderPrice(Math.max(0.01, Number(e.target.value) || 0))}
                className="col-span-2 w-full bg-bg-secondary/50 border border-border/50 text-white text-[16px] font-mono font-bold rounded-lg p-3 outline-none focus:border-[#00d4ff]/50 transition-colors"
              />
              <div className="grid grid-rows-2 gap-1">
                <button
                  type="button"
                  onClick={() => setOrderPrice(activeBid)}
                  className="text-[10px] rounded-md border border-border/50 text-text-secondary hover:text-white hover:border-[#3D4981] transition-colors"
                >
                  Use Bid
                </button>
                <button
                  type="button"
                  onClick={() => setOrderPrice(activeAsk)}
                  className="text-[10px] rounded-md border border-border/50 text-text-secondary hover:text-white hover:border-[#3D4981] transition-colors"
                >
                  Use Ask
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-text-muted font-bold tracking-wider uppercase">
              {usesGramInput ? 'Order Quantity (grams)' : 'Order Quantity (units)'}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              max="1000000"
              value={qtyInput}
              onChange={(e) => setQtyInput(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-bg-secondary/50 border border-border/50 text-white text-[16px] font-mono font-bold rounded-lg p-3 outline-none focus:border-[#00d4ff]/50 transition-colors"
            />
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              <IndianRupee size={10} /> Margin Req ({(marginRate * 100).toFixed(1)}%)
            </span>
            <span className="text-[12px] font-mono font-bold text-[#85a0e0]">₹{Number(requiredMargin).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-text-muted">Execution Qty (price units)</span>
            <span className="text-[12px] font-mono font-bold text-text-secondary">{executableQty.toFixed(4)}</span>
          </div>
        </div>

        <div className="mt-auto pt-2 grid grid-cols-2 gap-3">
          <button 
            onClick={handleBuy}
            disabled={effectivePrice <= 0 || executableQty <= 0}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[14px] py-3.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400/20 active:scale-[0.98]"
          >
            <TrendingUp size={16} /> BUY MARKET
          </button>
          <button 
            onClick={handleSell}
            disabled={effectivePrice <= 0 || executableQty <= 0}
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
