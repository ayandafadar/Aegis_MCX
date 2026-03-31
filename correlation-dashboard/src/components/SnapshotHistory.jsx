import React, { memo, useState, useMemo } from 'react';
import { History, GitCompare, TrendingUp, TrendingDown } from 'lucide-react';

const SnapshotHistory = memo(({ snapshots, commodities }) => {
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);

  const drift = useMemo(() => {
    if (!compareA || !compareB) return null;
    const matA = compareA.matrix;
    const matB = compareB.matrix;
    if (!matA || !matB) return null;

    const drifts = [];
    for (let i = 0; i < commodities.length; i++) {
      for (let j = i + 1; j < commodities.length; j++) {
        const valA = matA[i]?.[j] ?? 0;
        const valB = matB[i]?.[j] ?? 0;
        const change = valB - valA;
        drifts.push({
          pair: `${commodities[i].symbol}/${commodities[j].symbol}`,
          from: valA,
          to: valB,
          change,
          absChange: Math.abs(change),
        });
      }
    }
    return drifts.sort((a, b) => b.absChange - a.absChange);
  }, [compareA, compareB, commodities]);

  return (
    <div className="bg-bg-card backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={16} className="text-cyan" />
          <h2 className="font-display font-bold text-[15px] text-text-primary">Correlation Snapshots</h2>
        </div>
        <span className="text-[10px] text-text-muted px-2 py-0.5 bg-bg-secondary rounded-md">
          {snapshots.length} stored
        </span>
      </div>

      <div className="p-3">
        {/* Snapshot list */}
        <div className="max-h-[250px] overflow-y-auto mb-3">
          {snapshots.length === 0 ? (
            <div className="text-center py-4 text-text-muted text-[11px]">
              Snapshots will appear here every ~5s
            </div>
          ) : (
            snapshots.map((snap, idx) => (
              <div key={snap.id} className="flex items-center justify-between py-1.5 px-2 mb-1 rounded-lg bg-bg-secondary/30 hover:bg-bg-secondary/60 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted w-5 text-right">#{idx + 1}</span>
                  <span className="text-[11px] text-text-secondary">
                    {new Date(snap.timestamp).toLocaleTimeString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCompareA(snap)}
                    className={`text-[9px] px-2 py-0.5 rounded font-medium transition-colors ${
                      compareA?.id === snap.id ? 'bg-cyan/20 text-cyan border border-cyan/40' : 'bg-bg-secondary text-text-muted hover:text-cyan'
                    }`}>
                    A
                  </button>
                  <button
                    onClick={() => setCompareB(snap)}
                    className={`text-[9px] px-2 py-0.5 rounded font-medium transition-colors ${
                      compareB?.id === snap.id ? 'bg-amber/20 text-amber border border-amber/40' : 'bg-bg-secondary text-text-muted hover:text-amber'
                    }`}>
                    B
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drift comparison */}
        {drift && (
          <div className="border-t border-border pt-3 fade-in-up">
            <div className="flex items-center gap-1.5 mb-2">
              <GitCompare size={12} className="text-amber" />
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                Correlation Drift
              </span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {drift.slice(0, 10).map((d, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 mb-0.5 rounded text-[11px] gap-2">
                  <span className="text-text-secondary flex-1 min-w-[60px] truncate">{d.pair}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-text-muted">{d.from.toFixed(3)}</span>
                    <span className="text-text-muted">→</span>
                    <span className="text-text-primary">{d.to.toFixed(3)}</span>
                    <span className={`flex items-center gap-0.5 font-bold text-[10px] justify-end min-w-[40px] ${d.change > 0 ? 'text-emerald' : 'text-crimson'}`}>
                      {d.change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {d.change > 0 ? '+' : ''}{d.change.toFixed(3)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

SnapshotHistory.displayName = 'SnapshotHistory';
export default SnapshotHistory;
