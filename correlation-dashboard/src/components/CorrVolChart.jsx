import React, { memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ActivitySquare } from 'lucide-react';

const CorrVolChart = memo(({ corrHistory, activePairX, activePairY }) => {
  // We assume corrHistory is passed down as an array of objects: { time: string, value: number }
  const data = corrHistory || [];
  
  return (
    <div className="bg-bg-card backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-4 min-h-[300px] flex flex-col fade-in-up transition-all duration-500">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ActivitySquare size={16} className="text-[#3D4981]" />
          <h2 className="font-display font-bold text-[15px] text-text-primary">Rolling Correlation Volatility (CorrVol)</h2>
        </div>
        <div className="text-[10px] text-text-muted px-2 py-1 rounded-md border border-border/50 bg-bg-primary/50">
          Target: <span className="text-[#85a0e0] font-bold">{activePairX}/{activePairY}</span>
        </div>
      </div>
      
      <div className="flex-1 w-full h-[220px]">
        {data.length < 2 ? (
          <div className="flex h-full items-center justify-center text-[12px] text-text-muted text-center">
            Awaiting sufficient historical data to plot variance...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="time" hide />
              <YAxis domain={[-1, 1]} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#00d4ff' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <ReferenceLine y={0.8} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.4} />
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" strokeOpacity={0.6} />
              <ReferenceLine y={-0.8} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4} />
              <Line 
                type="monotone" 
                dataKey="value" 
                name="Correlation (r)" 
                stroke="#3D4981" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 4, fill: '#00d4ff', stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});

CorrVolChart.displayName = 'CorrVolChart';
export default CorrVolChart;
