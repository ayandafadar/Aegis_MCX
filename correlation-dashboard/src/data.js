// ── MCX Commodity Configuration ─────────────────────────────────────────────
export const COMMODITIES = [
  { symbol: 'GOLD', basePrice: 152350, unit: '₹/10g', lotSize: '1kg', vol: 0.0028 },
  { symbol: 'SILVER', basePrice: 241773, unit: '₹/kg', lotSize: '30kg', vol: 0.0055 },
  { symbol: 'CRUDEOIL', basePrice: 9073, unit: '₹/bbl', lotSize: '100bbl', vol: 0.0105 },
  { symbol: 'NATURALGAS', basePrice: 270.1, unit: '₹/mmBtu', lotSize: '1250', vol: 0.014 },
  { symbol: 'COPPER', basePrice: 1169.25, unit: '₹/kg', lotSize: '2500kg', vol: 0.006 },
  { symbol: 'ZINC', basePrice: 318.45, unit: '₹/kg', lotSize: '5000kg', vol: 0.0065 },
  { symbol: 'ALUMINIUM', basePrice: 289.8, unit: '₹/kg', lotSize: '5000kg', vol: 0.0045 },
  { symbol: 'NICKEL', basePrice: 1942.6, unit: '₹/kg', lotSize: '1500kg', vol: 0.0085 },
];

// Base correlation structure for realistic simulation
// Row/col order matches COMMODITIES array
const BASE_CORR = [
  //  GOLD  SILV  CRUD  NGAS  COPP  ZINC  ALUM  NICK
  [1.00, 0.82, 0.30, 0.15, 0.25, 0.20, 0.18, 0.22],  // GOLD
  [0.82, 1.00, 0.28, 0.12, 0.30, 0.25, 0.22, 0.27],  // SILVER
  [0.30, 0.28, 1.00, 0.55, 0.35, 0.30, 0.28, 0.32],  // CRUDE
  [0.15, 0.12, 0.55, 1.00, 0.20, 0.18, 0.15, 0.22],  // NGAS
  [0.25, 0.30, 0.35, 0.20, 1.00, 0.72, 0.68, 0.75],  // COPPER
  [0.20, 0.25, 0.30, 0.18, 0.72, 1.00, 0.70, 0.67],  // ZINC
  [0.18, 0.22, 0.28, 0.15, 0.68, 0.70, 1.00, 0.65],  // ALUM
  [0.22, 0.27, 0.32, 0.22, 0.75, 0.67, 0.65, 1.00],  // NICKEL
];

// ── Cholesky decomposition for correlated price generation ──────────────────
function choleskyDecomp(matrix) {
  const n = matrix.length;
  const L = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
      if (i === j) {
        L[i][j] = Math.sqrt(Math.max(0, matrix[i][i] - sum));
      } else {
        L[i][j] = L[j][j] !== 0 ? (matrix[i][j] - sum) / L[j][j] : 0;
      }
    }
  }
  return L;
}

const cholL = choleskyDecomp(BASE_CORR);

// Box-Muller for normal random
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Generate correlated random returns
export function generateCorrelatedReturns() {
  const n = COMMODITIES.length;
  const z = Array.from({ length: n }, () => randn());
  const correlated = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j <= i; j++) sum += cholL[i][j] * z[j];
    correlated[i] = sum;
  }
  return COMMODITIES.map((c, i) => correlated[i] * c.vol);
}

// ── Pearson correlation on rolling log returns ──────────────────────────────
export function computeCorrelationMatrix(priceHistories) {
  const n = priceHistories.length;
  const matrix = Array.from({ length: n }, () => new Float64Array(n));

  // Compute log returns for each commodity
  const returns = priceHistories.map(prices => {
    const r = [];
    for (let i = 1; i < prices.length; i++) {
      r.push(Math.log(prices[i] / prices[i - 1]));
    }
    return r;
  });

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1.0;
    for (let j = i + 1; j < n; j++) {
      const ri = returns[i];
      const rj = returns[j];
      const len = Math.min(ri.length, rj.length);
      if (len < 3) { matrix[i][j] = 0; matrix[j][i] = 0; continue; }

      let sumI = 0, sumJ = 0;
      for (let k = 0; k < len; k++) { sumI += ri[k]; sumJ += rj[k]; }
      const meanI = sumI / len, meanJ = sumJ / len;

      let cov = 0, varI = 0, varJ = 0;
      for (let k = 0; k < len; k++) {
        const di = ri[k] - meanI, dj = rj[k] - meanJ;
        cov += di * dj; varI += di * di; varJ += dj * dj;
      }

      const denom = Math.sqrt(varI * varJ);
      const corr = denom > 0 ? cov / denom : 0;
      matrix[i][j] = Math.max(-1, Math.min(1, corr));
      matrix[j][i] = matrix[i][j];
    }
  }
  return matrix;
}

// ── Trading Signal Generation ───────────────────────────────────────────────
export function generateSignals(corrMatrix, priceHistories, commodities) {
  const signals = [];
  const n = commodities.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const corr = corrMatrix[i][j];
      const ri = priceHistories[i];
      const rj = priceHistories[j];
      if (ri.length < 5 || rj.length < 5) continue;

      // Compute recent returns
      const retI = (ri[ri.length - 1] - ri[ri.length - 2]) / ri[ri.length - 2];
      const retJ = (rj[rj.length - 1] - rj[rj.length - 2]) / rj[rj.length - 2];

      // Compute spread statistics
      const spreads = [];
      const len = Math.min(ri.length, rj.length, 20);
      for (let k = ri.length - len; k < ri.length; k++) {
        const ki = k - (ri.length - len);
        if (ki < rj.length - len + (rj.length - ri.length)) {
          spreads.push(ri[k] / rj[Math.min(k, rj.length - 1)] || 0);
        }
      }
      if (spreads.length < 3) continue;

      const meanSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;
      const stdSpread = Math.sqrt(spreads.reduce((a, b) => a + (b - meanSpread) ** 2, 0) / spreads.length);
      const currentSpread = ri[ri.length - 1] / rj[rj.length - 1];
      const zScore = stdSpread > 0 ? (currentSpread - meanSpread) / stdSpread : 0;

      // Historical percentile (rank of current spread vs rolling window)
      const rank = spreads.filter(s => s <= currentSpread).length;
      const percentile = spreads.length > 0 ? Math.round((rank / spreads.length) * 100) : 50;

      // Compute covariance and beta
      const returns_i = [], returns_j = [];
      for (let k = 1; k < len && k < ri.length && k < rj.length; k++) {
        returns_i.push(Math.log(ri[ri.length - len + k] / ri[ri.length - len + k - 1]));
        returns_j.push(Math.log(rj[rj.length - len + k] / rj[rj.length - len + k - 1]));
      }
      let covXY = 0, varY = 0, meanRI = 0, meanRJ = 0;
      const rLen = returns_i.length;
      if (rLen > 1) {
        for (let k = 0; k < rLen; k++) { meanRI += returns_i[k]; meanRJ += returns_j[k]; }
        meanRI /= rLen; meanRJ /= rLen;
        for (let k = 0; k < rLen; k++) {
          covXY += (returns_i[k] - meanRI) * (returns_j[k] - meanRJ);
          varY += (returns_j[k] - meanRJ) ** 2;
        }
        covXY /= rLen; varY /= rLen;
      }
      const beta = varY > 0 ? covXY / varY : 0;

      // ARBITRAGE: correlated pair diverges
      if (corr > 0.75 && Math.abs(zScore) > 1.5) {
        const longSym = zScore < 0 ? commodities[i].symbol : commodities[j].symbol;
        const shortSym = zScore < 0 ? commodities[j].symbol : commodities[i].symbol;
        signals.push({
          type: 'ARBIT',
          pair: `${commodities[i].symbol}/${commodities[j].symbol}`,
          message: `LONG ${longSym} / SHORT ${shortSym}`,
          entryI: ri[ri.length - 1].toFixed(2),
          entryJ: rj[rj.length - 1].toFixed(2),
          hedgeRatio: Math.abs(beta).toFixed(3),
          confidence: Math.min(95, Math.round(50 + Math.abs(zScore) * 15 + corr * 20)),
          zScore: zScore.toFixed(2),
          correlation: corr.toFixed(3),
        });
      }

      // CONVERGENCE: pair reverting
      if (corr > 0.6 && Math.abs(zScore) > 0.8 && Math.abs(zScore) < 1.5) {
        signals.push({
          type: 'CONVERGE',
          pair: `${commodities[i].symbol}/${commodities[j].symbol}`,
          message: `Spread reverting: z=${zScore.toFixed(2)}`,
          entryI: ri[ri.length - 1].toFixed(2),
          entryJ: rj[rj.length - 1].toFixed(2),
          hedgeRatio: Math.abs(beta).toFixed(3),
          confidence: Math.min(85, Math.round(40 + corr * 30)),
          zScore: zScore.toFixed(2),
          correlation: corr.toFixed(3),
        });
      }

      // REGIME CHANGE: correlation break
      if (BASE_CORR[i][j] > 0.6 && corr < 0.3) {
        signals.push({
          type: 'REGIME',
          pair: `${commodities[i].symbol}/${commodities[j].symbol}`,
          message: `Corr dropped: ${BASE_CORR[i][j].toFixed(2)} → ${corr.toFixed(2)}`,
          entryI: ri[ri.length - 1].toFixed(2),
          entryJ: rj[rj.length - 1].toFixed(2),
          hedgeRatio: Math.abs(beta).toFixed(3),
          confidence: Math.min(90, Math.round(60 + (BASE_CORR[i][j] - corr) * 40)),
          zScore: zScore.toFixed(2),
          correlation: corr.toFixed(3),
        });
      }

      // HEDGE signal
      if (corr > 0.5 && Math.abs(beta) > 0.3) {
        const vol = Math.abs(retI) + Math.abs(retJ);
        if (vol > 0.008) {
          signals.push({
            type: 'HEDGE',
            pair: `${commodities[i].symbol}/${commodities[j].symbol}`,
            message: `β=${beta.toFixed(3)}, hedge ratio suggested`,
            entryI: ri[ri.length - 1].toFixed(2),
            entryJ: rj[rj.length - 1].toFixed(2),
            hedgeRatio: Math.abs(beta).toFixed(3),
            confidence: Math.min(80, Math.round(35 + corr * 25 + Math.abs(beta) * 20)),
            zScore: zScore.toFixed(2),
            correlation: corr.toFixed(3),
            percentile
          });
        }
      }
    }
  }
  return signals;
}

// ── Spread History for sparklines ───────────────────────────────────────────
export function computeSpreadHistory(pricesI, pricesJ, windowSize = 50) {
  const len = Math.min(pricesI.length, pricesJ.length, windowSize);
  const spreads = [];
  for (let k = 0; k < len; k++) {
    const i = pricesI.length - len + k;
    const j = pricesJ.length - len + k;
    spreads.push(pricesI[i] / pricesJ[j]);
  }
  const mean = spreads.reduce((a, b) => a + b, 0) / spreads.length;
  const std = Math.sqrt(spreads.reduce((a, b) => a + (b - mean) ** 2, 0) / spreads.length);
  return { spreads, mean, std };
}

// ── Portfolio VaR calculation ───────────────────────────────────────────────
export function computePortfolioVaR(positions, corrMatrix, priceHistories, commodities) {
  if (!positions.length) return { beta: 0, var95: 0, netDelta: 0 };

  const symbolToIdx = {};
  commodities.forEach((c, i) => { symbolToIdx[c.symbol] = i; });

  let totalValue = 0;
  const weights = [];

  positions.forEach(p => {
    const idx = symbolToIdx[p.symbol];
    if (idx === undefined) return;
    const price = priceHistories[idx]?.[priceHistories[idx].length - 1] || commodities[idx].basePrice;
    const val = price * p.quantity * (p.direction === 'SHORT' ? -1 : 1);
    weights.push({ idx, val });
    totalValue += Math.abs(val);
  });

  if (totalValue === 0) return { beta: 0, var95: 0, netDelta: 0 };

  // Portfolio variance
  let portVar = 0;
  for (let a = 0; a < weights.length; a++) {
    for (let b = 0; b < weights.length; b++) {
      const wi = weights[a].val / totalValue;
      const wj = weights[b].val / totalValue;
      const vol_i = commodities[weights[a].idx].vol;
      const vol_j = commodities[weights[b].idx].vol;
      const corr = corrMatrix[weights[a].idx][weights[b].idx];
      portVar += wi * wj * vol_i * vol_j * corr;
    }
  }

  const portVol = Math.sqrt(Math.abs(portVar));
  const var95 = totalValue * portVol * 1.645; // 95% VaR
  const netDelta = weights.reduce((s, w) => s + w.val, 0);
  const beta = weights.length > 1 ? weights[0].val / totalValue : 1;

  return { beta: beta.toFixed(3), var95: var95.toFixed(0), netDelta: netDelta.toFixed(0) };
}
