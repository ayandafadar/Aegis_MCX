import React, { memo, useState, useCallback } from 'react';
import { Grid3x3, Info } from 'lucide-react';

function corrColor(val) {
  if (val >= 0) {
    const intensity = Math.abs(val);
    const r = Math.round(255 - intensity * 240);
    const g = Math.round(255 - intensity * 70);
    const b = Math.round(255 - intensity * 130);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const intensity = Math.abs(val);
    const r = Math.round(255 - intensity * 16);
    const g = Math.round(255 - intensity * 187);
    const b = Math.round(255 - intensity * 187);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

function corrTextColor(val) {
  return '#0a0c10'; // Dark text contrasts well across the entire generated color range
}

const CorrCell = memo(({ value, rowIdx, colIdx, rowSymbol, colSymbol, changed, onClick }) => {
  if (rowIdx === colIdx) {
    return (
      <td className="p-0">
        <div className="w-full h-10 flex items-center justify-center bg-bg-secondary/60 text-[11px] text-text-primary font-bold">
          1.00
        </div>
      </td>
    );
  }
  return (
    <td className="p-0">
      <div
        onClick={() => onClick(rowIdx, colIdx)}
        className={`w-full h-10 flex items-center justify-center text-[11px] font-bold cursor-pointer
          hover:scale-110 hover:z-20 transition-transform duration-150 relative group
          ${changed ? 'pulse-cell' : ''}`}
        style={{
          backgroundColor: corrColor(value),
          color: corrTextColor(value),
        }}
      >
        {value.toFixed(2)}
        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-bg-card border border-border text-[10px] font-semibold text-text-primary px-2 py-1 rounded shadow-2xl -top-8 z-50 pointer-events-none whitespace-nowrap">
          {rowSymbol} × {colSymbol}
        </div>
      </div>
    </td>
  );
});

CorrCell.displayName = 'CorrCell';

const CorrelationMatrix = memo(({ commodities, matrix, prevMatrix, onPairSelect }) => {
  const [selectedPair, setSelectedPair] = useState(null);

  const handleCellClick = useCallback((i, j) => {
    setSelectedPair({ i, j });
    onPairSelect?.(i, j);
  }, [onPairSelect]);

  return (
    <div className="bg-bg-card backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3x3 size={16} className="text-cyan" />
          <h2 className="font-display font-bold text-[15px] text-text-primary">Correlation Matrix</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-16 h-2 rounded-full" style={{
              background: 'linear-gradient(to right, #ef4444, #ffffff, #10b981)'
            }} />
            <span className="text-[9px] text-text-muted">-1 → +1</span>
          </div>
          <span className="text-[10px] text-text-muted px-2 py-0.5 bg-bg-secondary rounded-md">
            20-period rolling
          </span>
        </div>
      </div>
      <div className="overflow-x-auto p-3">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-1 text-[10px] text-text-muted font-medium w-20"></th>
              {commodities.map(c => (
                <th key={c.symbol} className="p-1 text-[9px] text-text-muted font-medium tracking-wider" style={{ minWidth: '60px' }}>
                  {c.symbol.slice(0, 5)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commodities.map((rowC, i) => (
              <tr key={rowC.symbol}>
                <td className="px-2 py-1 text-[10px] text-text-secondary font-medium whitespace-nowrap">
                  {rowC.symbol}
                </td>
                {commodities.map((colC, j) => {
                  const val = matrix?.[i]?.[j] ?? 0;
                  const prev = prevMatrix?.[i]?.[j] ?? val;
                  const changed = Math.abs(val - prev) > 0.05;
                  return (
                    <CorrCell
                      key={`${i}-${j}`}
                      value={val}
                      rowIdx={i}
                      colIdx={j}
                      rowSymbol={commodities[i].symbol}
                      colSymbol={commodities[j].symbol}
                      changed={changed}
                      onClick={handleCellClick}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPair && (
        <div className="px-4 py-3 border-t border-border bg-bg-secondary/30 fade-in-up">
          <div className="flex items-center gap-2 mb-2">
            <Info size={14} className="text-cyan" />
            <span className="text-[12px] font-semibold">
              {commodities[selectedPair.i].symbol} × {commodities[selectedPair.j].symbol}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-[11px]">
            <div>
              <span className="text-text-muted">Correlation</span>
              <div className="font-bold text-[14px] mt-0.5"
                style={{ color: (matrix?.[selectedPair.i]?.[selectedPair.j] ?? 0) > 0 ? '#10b981' : '#ef4444' }}>
                {(matrix?.[selectedPair.i]?.[selectedPair.j] ?? 0).toFixed(4)}
              </div>
            </div>
            <div>
              <span className="text-text-muted">Change</span>
              <div className="font-bold text-[14px] mt-0.5 text-amber">
                {((matrix?.[selectedPair.i]?.[selectedPair.j] ?? 0) -
                  (prevMatrix?.[selectedPair.i]?.[selectedPair.j] ?? 0)).toFixed(4)}
              </div>
            </div>
            <div>
              <span className="text-text-muted">Strength</span>
              <div className="font-bold text-[14px] mt-0.5 text-cyan">
                {Math.abs(matrix?.[selectedPair.i]?.[selectedPair.j] ?? 0) > 0.7 ? 'STRONG' :
                  Math.abs(matrix?.[selectedPair.i]?.[selectedPair.j] ?? 0) > 0.4 ? 'MODERATE' : 'WEAK'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

CorrelationMatrix.displayName = 'CorrelationMatrix';
export default CorrelationMatrix;
