import React, { memo, useState, useCallback, useMemo } from 'react';
import { Shield, Plus, Trash2, Calculator } from 'lucide-react';
import { computePortfolioVaR, COMMODITIES } from '../data';

const HedgeCalculator = memo(({ corrMatrix, priceHistories, commodities }) => {
  const [positions, setPositions] = useState([]);
  const [newPos, setNewPos] = useState({ symbol: 'GOLD', quantity: 1, direction: 'LONG' });

  const addPosition = useCallback(() => {
    setPositions(prev => [...prev, { ...newPos, id: Date.now() }]);
  }, [newPos]);

  const removePosition = useCallback((id) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  }, []);

  const portfolio = useMemo(() =>
    computePortfolioVaR(positions, corrMatrix, priceHistories, commodities),
    [positions, corrMatrix, priceHistories, commodities]
  );

  const hedgeSuggestions = useMemo(() => {
    if (!positions.length || !corrMatrix) return [];
    const symbolToIdx = {};
    commodities.forEach((c, i) => { symbolToIdx[c.symbol] = i; });

    const suggestions = [];
    positions.forEach(pos => {
      const idx = symbolToIdx[pos.symbol];
      if (idx === undefined) return;
      commodities.forEach((c, j) => {
        if (j === idx) return;
        const corr = corrMatrix[idx][j];
        if (Math.abs(corr) > 0.5) {
          const hedgeDir = (pos.direction === 'LONG' ? (corr > 0 ? 'SHORT' : 'LONG') : (corr > 0 ? 'LONG' : 'SHORT'));
          suggestions.push({
            instrument: c.symbol,
            direction: hedgeDir,
            correlation: corr.toFixed(3),
            hedgeRatio: Math.abs(corr).toFixed(3),
            unit: c.unit,
          });
        }
      });
    });
    return suggestions.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 5);
  }, [positions, corrMatrix, commodities]);

  return (
    <div className="bg-bg-card backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Shield size={16} className="text-purple" />
        <h2 className="font-display font-bold text-[15px] text-text-primary">Portfolio Hedge Calculator</h2>
      </div>

      <div className="p-4">
        {/* Add position form */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <select value={newPos.symbol} onChange={e => setNewPos(p => ({ ...p, symbol: e.target.value }))}
            className="bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-[11px] text-text-primary outline-none focus:border-cyan">
            {COMMODITIES.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol}</option>)}
          </select>
          <input type="number" min="1" value={newPos.quantity}
            onChange={e => setNewPos(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
            className="bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-[11px] text-text-primary outline-none w-20 focus:border-cyan"
            placeholder="Qty" />
          <select value={newPos.direction} onChange={e => setNewPos(p => ({ ...p, direction: e.target.value }))}
            className="bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-[11px] text-text-primary outline-none focus:border-cyan">
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
          <button onClick={addPosition}
            className="flex items-center gap-1 bg-cyan/10 text-cyan border border-cyan/30 rounded-lg px-3 py-1.5 text-[11px] font-medium hover:bg-cyan/20 transition-colors">
            <Plus size={12} /> Add
          </button>
        </div>

        {/* Positions */}
        {positions.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2 font-medium">Positions</div>
            {positions.map(p => (
              <div key={p.id} className="flex items-center justify-between py-1.5 px-2 mb-1 bg-bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.direction === 'LONG' ? 'bg-emerald/10 text-emerald' : 'bg-crimson/10 text-crimson'}`}>
                    {p.direction}
                  </span>
                  <span className="text-[12px] font-semibold">{p.symbol}</span>
                  <span className="text-[11px] text-text-muted">× {p.quantity}</span>
                </div>
                <button onClick={() => removePosition(p.id)} className="text-text-muted hover:text-crimson transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Portfolio metrics */}
        {positions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-[9px] text-text-muted uppercase tracking-wider mb-1">Portfolio β</div>
              <div className="text-[16px] font-bold text-cyan">{portfolio.beta}</div>
            </div>
            <div className="bg-bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-[9px] text-text-muted uppercase tracking-wider mb-1">VaR (95%)</div>
              <div className="text-[16px] font-bold text-amber">₹{Number(portfolio.var95).toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-[9px] text-text-muted uppercase tracking-wider mb-1">Net Δ</div>
              <div className={`text-[16px] font-bold ${Number(portfolio.netDelta) >= 0 ? 'text-emerald' : 'text-crimson'}`}>
                ₹{Number(portfolio.netDelta).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        )}

        {/* Hedge suggestions */}
        {hedgeSuggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Calculator size={12} className="text-purple" />
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Hedge Suggestions</span>
            </div>
            {hedgeSuggestions.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-2 mb-1 bg-purple/5 border border-purple/10 rounded-lg text-[11px]">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${h.direction === 'LONG' ? 'bg-emerald/10 text-emerald' : 'bg-crimson/10 text-crimson'}`}>
                    {h.direction}
                  </span>
                  <span className="font-semibold">{h.instrument}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-text-muted">ρ: <span className="text-purple">{h.correlation}</span></span>
                  <span className="text-text-muted">Ratio: <span className="text-cyan">{h.hedgeRatio}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {positions.length === 0 && (
          <div className="text-center py-4 text-text-muted text-[11px]">
            Add positions to calculate hedge ratios
          </div>
        )}
      </div>
    </div>
  );
});

HedgeCalculator.displayName = 'HedgeCalculator';
export default HedgeCalculator;
