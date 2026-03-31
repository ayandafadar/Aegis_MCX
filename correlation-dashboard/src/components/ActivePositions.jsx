import React, { memo } from 'react';
import { Briefcase, XCircle, IndianRupee } from 'lucide-react';

const ActivePositions = memo(({ positions, prices, cashBalance, onClosePosition }) => {
  // Let's compute total unrealized PnL based on live prices
  let totalUnrealized = 0;
  
  const enrichedPositions = positions.map(pos => {
    const currentPrice = prices[pos.cmdIdx];
    let unrealized = 0;
    
    if (pos.type === 'BUY') {
      unrealized = (currentPrice - pos.entryPrice) * pos.qty;
    } else {
      unrealized = (pos.entryPrice - currentPrice) * pos.qty;
    }
    
    totalUnrealized += unrealized;
    
    return {
      ...pos,
      currentPrice,
      unrealized,
      pnlPct: (unrealized / (pos.entryPrice * pos.qty)) * 100
    };
  });

  const totalEquity = cashBalance + totalUnrealized;
  const isGlobalProfit = totalUnrealized >= 0;

  return (
    <div className="bg-bg-card backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl flex flex-col h-full fade-in-up transition-all duration-500 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Briefcase size={16} className="text-[#3D4981]" />
          <h2 className="font-display font-bold text-[15px] text-text-primary">Portfolio Tracker</h2>
        </div>
        
        {/* Account Summary Badges */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-text-muted uppercase font-bold tracking-wider">Available Cash</span>
            <span className="text-[13px] font-mono text-text-primary font-bold">₹{cashBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-text-muted uppercase font-bold tracking-wider">Real-Time PnL</span>
            <span className={`text-[13px] font-mono font-bold ${isGlobalProfit ? 'text-emerald' : 'text-red'}`}>
              {isGlobalProfit ? '+' : ''}₹{totalUnrealized.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-text-muted gap-3">
            <Briefcase size={32} opacity={0.5} />
            <span className="text-[12px]">No open positions. Place an order to begin tracking.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {enrichedPositions.map(pos => {
              const isProfit = pos.unrealized >= 0;
              const isBuy = pos.type === 'BUY';
              return (
                <div key={pos.id} className="group relative bg-bg-secondary/40 border border-border/50 rounded-xl p-3 flex flex-wrap items-center justify-between hover:border-border transition-colors">
                  
                  {/* Pair & Side */}
                  <div className="flex items-center gap-3 w-1/4 min-w-[120px]">
                    <div className={`px-2 py-1 rounded text-[10px] font-black tracking-wider ${isBuy ? 'bg-emerald-900/50 text-emerald' : 'bg-red-900/50 text-red'}`}>
                      {pos.type}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[13px] text-white">{pos.symbol}</span>
                      <span className="text-[10px] text-text-muted">Qty: {pos.qty}</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex flex-col items-end w-1/4">
                    <span className="text-[10px] text-text-muted">Entry</span>
                    <span className="font-mono text-[12px]">{pos.entryPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-end w-1/4">
                    <span className="text-[10px] text-text-muted">Current</span>
                    <span className="font-mono text-[12px]">{pos.currentPrice.toFixed(2)}</span>
                  </div>

                  {/* PnL and Close */}
                  <div className="flex items-center justify-end gap-4 w-1/4">
                    <div className="flex flex-col items-end">
                      <span className={`font-mono text-[13px] font-bold ${isProfit ? 'text-emerald' : 'text-red'}`}>
                        {isProfit ? '+' : ''}{pos.unrealized.toFixed(2)}
                      </span>
                      <span className={`font-mono text-[9px] ${isProfit ? 'text-emerald/70' : 'text-red/70'}`}>
                        {isProfit ? '+' : ''}{pos.pnlPct.toFixed(2)}%
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => onClosePosition(pos.id)}
                      className="text-text-muted hover:text-red transition-colors p-1 opacity-0 group-hover:opacity-100"
                      title="Close Position"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

ActivePositions.displayName = 'ActivePositions';
export default ActivePositions;
