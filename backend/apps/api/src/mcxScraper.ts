import puppeteer from 'puppeteer';

export interface McxPrice {
  symbol: string;
  ltp: number;
  normalizedUnit: string;
  changePercent: number;
  volume: number;
  updatedAt: string;
}

let cachedPrices: Record<string, McxPrice> = {};
let isScraping = false;

function normalizePrice(symbol: string, ltp: number): { ltp: number; normalizedUnit: string } {
  if (symbol === 'GOLD') {
    // MCX gold contracts are quoted in INR per 10g; normalize to INR per gram.
    return { ltp: ltp / 10, normalizedUnit: 'INR/g' };
  }

  if (symbol === 'SILVER') {
    // MCX silver contracts are quoted in INR per kg; normalize to INR per gram.
    return { ltp: ltp / 1000, normalizedUnit: 'INR/g' };
  }

  return { ltp, normalizedUnit: 'exchange-quoted' };
}

export async function fetchLivePrices() {
  if (isScraping) return cachedPrices;
  isScraping = true;
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36");
    
    // Go to MCX
    await page.goto('https://www.mcxindia.com/en/market-data/market-watch', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for JS rendering
    await new Promise(r => setTimeout(r, 5000)); 

    await page.waitForSelector('table tbody tr td', { timeout: 20000 }).catch(() => undefined);

    const rows = await page.evaluate(() => {
      const selectorCandidates = [
        'table tbody tr',
        '.table-responsive tbody tr',
        'tbody tr',
        'tr'
      ];

      let selectedRows: HTMLTableRowElement[] = [];
      for (const selector of selectorCandidates) {
        const found = Array.from(document.querySelectorAll(selector)) as HTMLTableRowElement[];
        if (found.length > 0) {
          selectedRows = found;
          break;
        }
      }

      return selectedRows
        .map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => td.textContent?.trim() ?? ''))
        .filter((cells) => cells.length >= 5 && Boolean(cells[0]));
    });

    const newData: Record<string, McxPrice> = {};
    const timestamp = new Date().toISOString();

    for (const row of rows) {
      if (row.length < 5) continue;
      
      const symbolStr = row[0].toUpperCase();
      if (symbolStr === 'SELECT') continue;
      
      let baseSymbol = '';
      if (symbolStr.includes('GOLD')) baseSymbol = 'GOLD';
      else if (symbolStr.includes('SILVER')) baseSymbol = 'SILVER';
      else if (symbolStr.includes('CRUDE') || symbolStr.includes('CPO')) baseSymbol = 'CRUDEOIL';
      else if (symbolStr.includes('NATURALGAS')) baseSymbol = 'NATURALGAS';
      else if (symbolStr.includes('COPPER')) baseSymbol = 'COPPER';
      else if (symbolStr.includes('ZINC')) baseSymbol = 'ZINC';
      else if (symbolStr.includes('ALUMINIUM')) baseSymbol = 'ALUMINIUM';
      else if (symbolStr.includes('NICKEL')) baseSymbol = 'NICKEL';
      
      if (!baseSymbol) continue;

      const parseNum = (str: string) => {
        const n = parseFloat(str.replace(/,/g, '').replace(/%/g,''));
        return Number.isFinite(n) ? n : NaN;
      };
      
      // Let's log the row so we can adjust index easily in logs if needed
      console.log(`[scraper] Found row for ${symbolStr}:`, row);

      // On MCX website Market Watch (as of recent versions):
      // Instrument [0], Expiry [1], Open [2], High [3], Low [4], Close [5], LTP [6], %Chg [7], Vol [8], Value [9], ...
      // Let's grab LTP from index 6 and %Chg from index 7
      // Try preferred MCX indices first, then fallback to any parseable numeric cells.
      const numericCells = row
        .map((cell) => parseNum(cell))
        .filter((value) => Number.isFinite(value));
      const ltp = parseNum(row[6]) || numericCells[1] || numericCells[0] || NaN;
      const changePercent = parseNum(row[7]) || numericCells[2] || 0;
      const volume = parseNum(row[8] || '0') || numericCells[3] || 0;

      if (Number.isFinite(ltp) && ltp > 0) {
        const normalized = normalizePrice(baseSymbol, ltp);
        if (!newData[baseSymbol]) { // Store the first match (usually nearest expiry)
          newData[baseSymbol] = {
            symbol: baseSymbol,
            ltp: normalized.ltp,
            normalizedUnit: normalized.normalizedUnit,
            changePercent: isNaN(changePercent) ? 0 : changePercent,
            volume: isNaN(volume) ? 0 : volume,
            updatedAt: timestamp
          };
        }
      }
    }

    if (Object.keys(newData).length > 0) {
      cachedPrices = { ...cachedPrices, ...newData };
      console.log(`[scraper] Updated prices successfully for ${Object.keys(newData).length} commodities.`);
    } else {
      console.log(`[scraper] Rows parsed but no recognizable symbols found or data was empty.`);
      console.log('First 3 rows:', rows.slice(0, 3));
    }

  } catch (error) {
    console.error(`[scraper] Failed to fetch MCX prices:`, error);
  } finally {
    if (browser) await browser.close();
    isScraping = false;
  }
}

export function startScraperPolling() {
  fetchLivePrices();
  setInterval(fetchLivePrices, 30000);
}

export function getCachedPrices() {
  return cachedPrices;
}
