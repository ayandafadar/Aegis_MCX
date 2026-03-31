import React, { memo, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';

const TechnicalChart = memo(({ priceHistory, symbol }) => {
  const data = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) return [];
    
    return priceHistory.map((p, i) => {
      // Basic 5-tick SMA
      let sma = p;
      if (i >= 4) {
        let sum = 0;
        for (let j = 0; j < 5; j++) sum += priceHistory[i - j];
        sma = sum / 5;
      }
      
      return { 
        tick: i, 
        price: p,
        sma5: i >= 4 ? sma : null
      };
    });
  }, [priceHistory]);

  if (data.length === 0) return null;

  const currentPrice = data[data.length - 1].price;
  const min = Math.min(...priceHistory);
  const max = Math.max(...priceHistory);
  
  // Padding for visual cleanliness
  const padding = (max - min) * 0.1 || 1; 

  return (
    <div className="bg-bg-card backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl flex flex-col h-full fade-in-up transition-all duration-500 overflow-hidden min-h-[300px]">
      <div className="px-4 py-3 border-b border-border/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LineChartIcon size={16} className="text-[#3D4981]" />
          <h2 className="font-display font-bold text-[15px] text-text-primary">Technical Analysis Chart</h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-text-muted bg-bg-secondary px-2 py-1 rounded">
          <span className="font-bold text-[#85a0e0]">{symbol}</span>
          <span className="font-mono">{currentPrice.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="flex-1 w-full p-4 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`techGradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#85a0e0" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3D4981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="tick" hide />
            <YAxis 
              domain={[min - padding, max + padding]} 
              tick={{ fill: '#64748b', fontSize: 10 }} 
              tickLine={false} 
              axisLine={false} 
              width={50}
              tickFormatter={(val) => val.toFixed(0)} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#00d4ff' }}
              labelStyle={{ display: 'none' }}
            />
            <ReferenceLine y={currentPrice} stroke="#00d4ff" strokeDasharray="3 3" strokeOpacity={0.6} />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#85a0e0" 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#techGradient-${symbol})`} 
              isAnimationActive={false} // Disable animation to prevent strobe on tick update
            />
            <Area 
              type="monotone" 
              dataKey="sma5" 
              stroke="#f59e0b" 
              strokeWidth={1.5}
              fill="none" 
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="px-5 pb-3 flex justify-end gap-3 text-[9px] text-text-muted font-bold tracking-wider">
        <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-[#85a0e0]"></div> PRICE TICK</span>
        <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-[#f59e0b]"></div> SMA(5)</span>
      </div>
    </div>
  );
});

TechnicalChart.displayName = 'TechnicalChart';
export default TechnicalChart;
