import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Activity, Radio, Clock, Cpu, BarChart3 } from 'lucide-react';
import { COMMODITIES, computeCorrelationMatrix, generateSignals, generateCorrelatedReturns, getMarginRate } from './data';
import LivePriceFeed from './components/LivePriceFeed';
import CorrelationMatrix from './components/CorrelationMatrix';
import { SignalTicker, SignalPanel } from './components/SignalEngine';
import SpreadChartPanel from './components/SpreadChart';
import HedgeCalculator from './components/HedgeCalculator';
import SnapshotHistory from './components/SnapshotHistory';
import MarketHeatmap from './components/MarketHeatmap';
import StatArbScanner from './components/StatArbScanner';
import CorrVolChart from './components/CorrVolChart';
import OrderEntryTicket from './components/OrderEntryTicket';
import ActivePositions from './components/ActivePositions';
import TechnicalChart from './components/TechnicalChart';

const HISTORY_SIZE = 60;
const TICK_INTERVAL = 3000; // fetch more reasonably since real mcx updates slowly
const CORR_INTERVAL = 3000;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

function areSignalsEqual(prevSignals, nextSignals) {
  if (prevSignals === nextSignals) return true;
  if (!Array.isArray(prevSignals) || !Array.isArray(nextSignals)) return false;
  if (prevSignals.length !== nextSignals.length) return false;

  for (let i = 0; i < prevSignals.length; i++) {
    const prev = prevSignals[i];
    const next = nextSignals[i];
    if (!prev || !next) return false;
    if (
      prev.type !== next.type ||
      prev.pair !== next.pair ||
      prev.message !== next.message ||
      prev.entryI !== next.entryI ||
      prev.entryJ !== next.entryJ ||
      prev.hedgeRatio !== next.hedgeRatio ||
      prev.confidence !== next.confidence ||
      prev.zScore !== next.zScore ||
      prev.correlation !== next.correlation
    ) {
      return false;
    }
  }

  return true;
}

export default function CorrelationDashboard() {
  const [prices, setPrices] = useState(() => COMMODITIES.map(c => c.basePrice));
  const [prevPrices, setPrevPrices] = useState(() => COMMODITIES.map(c => c.basePrice));
  const [volumes, setVolumes] = useState(() => COMMODITIES.map(() => Math.floor(Math.random() * 5000 + 1000)));
  const [bids, setBids] = useState(() => COMMODITIES.map(c => c.basePrice * 0.9998));
  const [asks, setAsks] = useState(() => COMMODITIES.map(c => c.basePrice * 1.0002));
  const [corrMatrix, setCorrMatrix] = useState(null);
  const [prevCorrMatrix, setPrevCorrMatrix] = useState(null);
  const [signals, setSignals] = useState([]);
  const [signalLog, setSignalLog] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [tickCount, setTickCount] = useState(0);
  const [marketTime, setMarketTime] = useState(new Date());

  // Tabs & Feature States
  const [activeTab, setActiveTab] = useState('analytics');
  const [selectedPair, setSelectedPair] = useState({ i: 0, j: 1 });
  const [corrHistory, setCorrHistory] = useState([]);

  // Retail Trading States
  const [tradeCmdIdx, setTradeCmdIdx] = useState(0);
  const [cashBalance, setCashBalance] = useState(10000000); // 1 CR account
  const [positions, setPositions] = useState([]);

  const priceHistRef = useRef(COMMODITIES.map(c => [c.basePrice]));

  // Price tick simulation / Live Data Fetch
  useEffect(() => {
    let active = true;
    const fetchLive = async () => {
      let liveData = {};
      try {
        const res = await fetch(`${API_BASE_URL}/api/mcx/live`);
        if (res.ok) {
          liveData = await res.json();
        }
      } catch (err) {
        console.error("Live feed fetch error:", err);
      }

      if (!active) return;

      setPrevPrices(prev => [...prev]);
      setPrices(currentPrices => {
        // Keep simulation alive even when API data is unavailable (e.g. frontend-only deployments)
        const corrReturns = generateCorrelatedReturns();
        const newPrices = currentPrices.map((p, i) => {
          const sym = COMMODITIES[i].symbol;
          const data = liveData[sym];

          let nextPrice = p;
          if (data && Number.isFinite(data.ltp)) {
            // Snap to live data if there's a big gap, otherwise gently revert
            if (Math.abs(data.ltp - p) / p > 0.01) {
              nextPrice = data.ltp;
            } else {
              nextPrice = p + (data.ltp - p) * 0.1;
            }
          }

          // Apply correlated drift to nextPrice
          return Math.max(0.01, nextPrice * (1 + corrReturns[i]));
        });

        // Always push to history to ensure rolling windows compute and charts move
        newPrices.forEach((p, i) => {
          priceHistRef.current[i].push(p);
          if (priceHistRef.current[i].length > HISTORY_SIZE) {
            priceHistRef.current[i] = priceHistRef.current[i].slice(-HISTORY_SIZE);
          }
        });

        // Update volumes based on live data if available
        setVolumes(prev => prev.map((v, i) => {
          const sym = COMMODITIES[i].symbol;
          if (liveData[sym] && Number.isFinite(liveData[sym].volume)) {
            return liveData[sym].volume;
          }
          const jitter = Math.round((Math.random() - 0.5) * 150);
          return Math.max(100, v + jitter);
        }));

        // Synthetic bid/ask based on LTP for UI since live usually doesn't give tight bid/ask in free view
        setBids(newPrices.map(p => p * (1 - 0.0001)));
        setAsks(newPrices.map(p => p * (1 + 0.0001)));

        return newPrices;
      });

      setTickCount(t => t + 1);
      setMarketTime(new Date());
    };

    fetchLive();
    const interval = setInterval(fetchLive, TICK_INTERVAL);
    return () => { active = false; clearInterval(interval); };
  }, []);

  // Force reset if HMR leaves stale massive prices (e.g. from 15050 to 7421)
  useEffect(() => {
    if (prices.length > 0 && Math.abs(prices[0] - COMMODITIES[0].basePrice) > 5000) {
       setPrices(COMMODITIES.map(c => c.basePrice));
       setPrevPrices(COMMODITIES.map(c => c.basePrice));
       priceHistRef.current = COMMODITIES.map(c => [c.basePrice]);
       setSnapshots([]);
       setCorrHistory([]);
       setSignalLog([]);
    }
  }, [prices]);

  // Correlation recalculation
  useEffect(() => {
    const interval = setInterval(() => {
      const histories = priceHistRef.current;
      if (histories[0].length < 5) return;

      const matrix = computeCorrelationMatrix(histories);
      setPrevCorrMatrix(prev => prev);
      setCorrMatrix(prevMatrix => {
        setPrevCorrMatrix(prevMatrix);
        return matrix;
      });

      // Track rolling correlation
      setCorrHistory(prev => {
        if (!matrix) return prev;
        const latestCorr = matrix[selectedPair.i][selectedPair.j];
        if (isNaN(latestCorr)) return prev;
        const newEntry = { time: new Date().toLocaleTimeString('en-IN', { minute: '2-digit', second: '2-digit' }), value: latestCorr };
        return [...prev, newEntry].slice(-60);
      });

      // Generate signals
      const newSignals = generateSignals(matrix, histories, COMMODITIES);
      setSignals(prev => (areSignalsEqual(prev, newSignals) ? prev : newSignals));

      // Log signals
      if (newSignals.length > 0) {
        const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setSignalLog(prev => {
          const withTime = newSignals.map(s => ({ ...s, time: ts }));
          return [...prev, ...withTime].slice(-100);
        });
      }

      // Store snapshot
      setSnapshots(prev => {
        const snap = {
          id: Date.now(),
          timestamp: Date.now(),
          matrix: matrix.map(row => [...row]),
        };
        return [snap, ...prev].slice(0, 10);
      });
    }, CORR_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const handlePairSelect = useCallback((i, j) => {
    setSelectedPair({ i, j });
    setCorrHistory([]);
  }, []);

  const handleExecuteOrder = useCallback((order) => {
    const marginRate = getMarginRate(order.symbol);
    const margin = order.entryPrice * order.qty * marginRate;
    if (cashBalance < margin) {
      alert("Insufficient Margin!"); 
      return;
    }
    setCashBalance(prev => prev - margin);
    setPositions(prev => [...prev, { ...order, id: Date.now().toString(), margin, marginRate }]);
  }, [cashBalance]);

  const handleClosePosition = useCallback((posId) => {
    setPositions(prev => {
      const pos = prev.find(p => p.id === posId);
      if (!pos) return prev;
      
      const currentPrice = prices[pos.cmdIdx];
      let pnl = 0;
      if (pos.type === 'BUY') {
        pnl = (currentPrice - pos.entryPrice) * pos.qty;
      } else {
        pnl = (pos.entryPrice - currentPrice) * pos.qty;
      }
      
      setCashBalance(cash => cash + pos.margin + pnl);
      return prev.filter(p => p.id !== posId);
    });
  }, [prices]);

  // Get price histories for spread charts
  const priceHistories = priceHistRef.current;

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden font-sans">
      {/* Ambient glass glows */}
      <div className="absolute top-0 left-[-10%] w-[40%] h-[40%] bg-[#3D4981]/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#3D4981]/20 blur-[130px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg-primary/70 backdrop-blur-2xl border-b border-border/50 shadow-sm relative">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-shrink-0 items-center justify-center w-10 h-10">
                <svg width="32" height="32" viewBox="40 37 176 176" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_12px_rgba(61,73,129,1)]">
                  <path d="M128 44L196 72V128C196 171.2 128 206 128 206C128 206 60 171.2 60 128V72L128 44Z" fill="url(#shieldGrad)" stroke="#00d4ff" strokeWidth="8" strokeLinejoin="round"/>
                  <path d="M84 140L112 108L140 120L172 84" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"/>
                  <circle cx="112" cy="108" r="8" fill="#00d4ff"/>
                  <circle cx="140" cy="120" r="8" fill="#00d4ff"/>
                  <circle cx="172" cy="84" r="10" fill="#ffffff" filter="url(#glow)"/>
                  <defs>
                    <linearGradient id="shieldGrad" x1="128" y1="44" x2="128" y2="206" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4f6cae"/> 
                      <stop offset="1" stopColor="#3D4981"/> 
                    </linearGradient>
                    <filter id="glow" x="64" y="64" width="128" height="100" filterUnits="userSpaceOnUse">
                      <feGaussianBlur stdDeviation="3" result="blur"/>
                      <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                </svg>
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="font-display font-black text-[20px] text-white leading-none tracking-tight drop-shadow-sm">
                  AEGIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#85a0e0] to-[#3D4981]">MCX</span>
                </h1>
                <div className="text-[10px] font-mono text-text-muted font-bold tracking-[0.25em] mt-0.5">CORRELATION TERMINAL</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[11px]">
              <Cpu size={12} className="text-text-muted" />
              <span className="text-text-muted">Tick</span>
              <span className="text-cyan font-bold">{tickCount}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <Clock size={12} className="text-text-muted" />
              <span className="text-text-secondary">
                {marketTime.toLocaleTimeString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              <span className="text-[10px] text-emerald font-medium">MARKET OPEN</span>
            </div>
          </div>
        </div>

        {/* Signal Ticker */}
        <SignalTicker signals={signals} />

        {/* Tab Navigation Menu */}
        <div className="flex w-full items-center gap-4 px-4 py-2 bg-bg-secondary/40 border-b border-border/50">
          {[
            { id: 'analytics', label: 'Terminal Analytics' },
            { id: 'retail', label: 'Regular Trading' },
            { id: 'execution', label: 'Execution & Arbitrage' },
            { id: 'risk', label: 'Portfolio & Risk' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-300 text-center uppercase tracking-wide ${
                activeTab === tab.id 
                  ? 'bg-[#3D4981]/80 text-white shadow-[0_0_12px_rgba(61,73,129,0.5)] border border-[#3D4981]' 
                  : 'text-text-muted hover:text-white hover:bg-bg-card-hover border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Grid Dynamically Rendering Active Tab */}
      <main className="p-4 flex flex-col gap-4">
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-3 h-full fade-in-up" style={{ animationDelay: '0s' }}>
              <LivePriceFeed commodities={COMMODITIES} prices={prices} prevPrices={prevPrices} volumes={volumes} bids={bids} asks={asks} />
            </div>
            <div className="xl:col-span-5 h-full fade-in-up" style={{ animationDelay: '0.15s' }}>
              <CorrelationMatrix commodities={COMMODITIES} matrix={corrMatrix} prevMatrix={prevCorrMatrix} onPairSelect={handlePairSelect} activePair={selectedPair} />
            </div>
            <div className="xl:col-span-4 h-full fade-in-up" style={{ animationDelay: '0.3s' }}>
              <MarketHeatmap commodities={COMMODITIES} prices={prices} prevPrices={prevPrices} />
            </div>
          </div>
        )}

        {activeTab === 'retail' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-4 h-full fade-in-up" style={{ animationDelay: '0s' }}>
              <OrderEntryTicket
                commodities={COMMODITIES}
                bids={bids}
                asks={asks}
                selectedIdx={tradeCmdIdx}
                onSelect={setTradeCmdIdx}
                onExecute={handleExecuteOrder}
              />
            </div>
            <div className="xl:col-span-8 h-full fade-in-up" style={{ animationDelay: '0.15s' }}>
              <TechnicalChart
                priceHistory={[...priceHistories[tradeCmdIdx]]}
                symbol={COMMODITIES[tradeCmdIdx].symbol}
              />
            </div>
            <div className="xl:col-span-12 h-full fade-in-up" style={{ animationDelay: '0.3s' }}>
              <ActivePositions
                positions={positions}
                prices={prices}
                cashBalance={cashBalance}
                onClosePosition={handleClosePosition}
              />
            </div>
          </div>
        )}

        {activeTab === 'execution' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-4 h-full fade-in-up" style={{ animationDelay: '0s' }}>
              <SignalPanel signals={signals} signalLog={signalLog} />
            </div>
            <div className="xl:col-span-8 h-full fade-in-up" style={{ animationDelay: '0.15s' }}>
              <StatArbScanner priceHistories={priceHistories} commodities={COMMODITIES} />
            </div>
            <div className="xl:col-span-12 fade-in-up" style={{ animationDelay: '0.3s' }}>
              <SpreadChartPanel signals={signals} priceHistories={priceHistories} commodities={COMMODITIES} />
            </div>
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-4 h-full fade-in-up" style={{ animationDelay: '0s' }}>
              <HedgeCalculator corrMatrix={corrMatrix} priceHistories={priceHistories} commodities={COMMODITIES} />
            </div>
            <div className="xl:col-span-4 h-full fade-in-up" style={{ animationDelay: '0.15s' }}>
              <CorrVolChart corrHistory={corrHistory} activePairX={COMMODITIES[selectedPair.i]?.symbol} activePairY={COMMODITIES[selectedPair.j]?.symbol} />
            </div>
            <div className="xl:col-span-4 h-full fade-in-up" style={{ animationDelay: '0.3s' }}>
              <SnapshotHistory snapshots={snapshots} commodities={COMMODITIES} />
            </div>
          </div>
        )}
      </main>

      {/* Footer status bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-bg-secondary/90 backdrop-blur border-t border-border px-4 py-1.5 flex items-center justify-between text-[10px] text-text-muted z-50">
        <div className="flex items-center gap-4">
          <span>MCX LIVE Feed (Scraper)</span>
          <span>•</span>
          <span>{COMMODITIES.length} instruments</span>
          <span>•</span>
          <span>Tick interval: {TICK_INTERVAL}ms</span>
          <span>•</span>
          <span>Corr refresh: {CORR_INTERVAL / 1000}s</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-text-secondary">Snapshots: {snapshots.length}/10</span>
          <span>•</span>
          <span className="text-text-secondary">Signals logged: {signalLog.length}</span>
          <span>•</span>
          <span className="text-emerald">System OK</span>
        </div>
      </footer>
    </div>
  );
}
