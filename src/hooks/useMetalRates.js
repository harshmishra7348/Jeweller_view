/**
 * useMetalRates — Live Gold & Silver prices from Yahoo Finance (no API key needed).
 *
 * Data sources (unofficial Yahoo Finance endpoints, free & CORS-friendly):
 *   GC=F     → Gold Futures (USD per troy oz)
 *   SI=F     → Silver Futures (USD per troy oz)
 *   USDINR=X → USD / INR exchange rate
 *
 * Conversion: price_INR_per_gram = (price_USD_per_troy_oz × USD_INR) / 31.1035
 */
import { useState, useEffect, useCallback } from "react";

const TROY_OZ_TO_GRAM = 31.1035;

// We use query2 to avoid occasional CORS blocks on query1
const YF_BASE = "https://query2.finance.yahoo.com/v8/finance/chart";
const SYMBOLS = ["GC=F", "SI=F", "USDINR=X"];

async function fetchMeta(symbol) {
  const res = await fetch(
    `${YF_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`${symbol}: HTTP ${res.status}`);
  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error(`${symbol}: no meta`);
  return {
    price: meta.regularMarketPrice,
    prevClose: meta.chartPreviousClose,
  };
}

export function useMetalRates() {
  const [rates, setRates] = useState(null);   // null = loading
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [gold, silver, usdInr] = await Promise.all(SYMBOLS.map(fetchMeta));

      const goldPerGram24K = (gold.price * usdInr.price) / TROY_OZ_TO_GRAM;
      const goldPerGram22K = goldPerGram24K * (22 / 24);
      const silverPerGram  = (silver.price * usdInr.price) / TROY_OZ_TO_GRAM;
      const silver925PerGram = silverPerGram * 0.925;

      // % change vs previous close
      const goldChange   = ((gold.price   - gold.prevClose)   / gold.prevClose)   * 100;
      const silverChange = ((silver.price - silver.prevClose) / silver.prevClose) * 100;

      setRates({
        gold24K:  Math.round(goldPerGram24K),
        gold22K:  Math.round(goldPerGram22K),
        silver925: Math.round(silver925PerGram),
        goldChangePct:   goldChange,
        silverChangePct: silverChange,
        usdInr: usdInr.price,
      });
      setUpdatedAt(new Date());
    } catch (err) {
      console.warn("useMetalRates: could not fetch live rates —", err.message);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
    // Refresh every 5 minutes
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  return { rates, error, updatedAt, reload: load };
}
