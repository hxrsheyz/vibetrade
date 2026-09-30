import { Candle } from "../types";

function calculateVWAP(candles: Array<{ close: number; volume: number }>): number {
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  for (const c of candles) {
    cumulativeTPV += c.close * c.volume;
    cumulativeVolume += c.volume;
  }
  return cumulativeVolume > 0 ? Number((cumulativeTPV / cumulativeVolume).toFixed(2)) : candles[candles.length - 1].close;
}

function calculateVolumeRatio(candles: Array<{ volume: number }>, currentIndex: number): number {
  const windowSize = 10;
  const start = Math.max(0, currentIndex - windowSize + 1);
  const slice = candles.slice(start, currentIndex + 1);
  const sum = slice.reduce((acc, c) => acc + c.volume, 0);
  const avg = sum / slice.length;
  const currentVol = candles[currentIndex].volume;
  return avg > 0 ? Number((currentVol / avg).toFixed(2)) : 1.0;
}

function calculateVolatility(candles: Array<{ close: number }>, currentIndex: number): number {
  const windowSize = 10;
  if (currentIndex < 1) return 0.015;
  const start = Math.max(0, currentIndex - windowSize + 1);
  const slice = candles.slice(start, currentIndex + 1);

  const returns: number[] = [];
  for (let i = 1; i < slice.length; i++) {
    const prev = slice[i - 1].close;
    const curr = slice[i].close;
    returns.push((curr - prev) / prev);
  }

  if (returns.length === 0) return 0.015;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Number(Math.sqrt(variance).toFixed(4));
}

export function generateSyntheticCandles(): Candle[] {
  const baseTime = new Date("2026-09-30T09:30:00Z");

  const rawData: Array<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    overrideVol?: number;
    note?: string;
  }> = [
    { open: 95.0, high: 95.5, low: 94.8, close: 95.2, volume: 1000, note: "Initial Market Open - Consolidation" },
    { open: 95.2, high: 95.8, low: 95.0, close: 95.6, volume: 1100 },
    { open: 95.6, high: 96.0, low: 95.3, close: 95.4, volume: 950 },
    { open: 95.4, high: 95.9, low: 95.2, close: 95.8, volume: 1050 },
    { open: 95.8, high: 96.2, low: 95.5, close: 96.0, volume: 1000 },
    { open: 96.0, high: 96.3, low: 95.8, close: 96.1, volume: 1150 },
    { open: 96.1, high: 96.4, low: 95.9, close: 96.2, volume: 980 },
    { open: 96.2, high: 96.5, low: 96.0, close: 96.3, volume: 1020 },
    { open: 96.3, high: 96.6, low: 96.1, close: 96.4, volume: 1050 },
    { open: 96.4, high: 96.8, low: 96.2, close: 96.5, volume: 1100 },

    // CANDLE 10: BREAKOUT PREPARATION
    { open: 96.5, high: 97.8, low: 96.4, close: 97.5, volume: 2200, note: "[DEMO SCENARIO 1] Volume spike beginning" },

    // CANDLE 11: DEMO SCENARIO 1 - APPROVED BREAKOUT TRADE!
    { open: 97.5, high: 98.9, low: 97.4, close: 98.6, volume: 2850, overrideVol: 0.024, note: "[DEMO SCENARIO 1] PERFECT BREAKOUT: Price > VWAP, Volume Ratio 2.45x, Volatility 0.024 -> APPROVED TRADE" },

    // CANDLE 12: CONTINUATION OF BREAKOUT
    { open: 98.6, high: 99.8, low: 98.5, close: 99.4, volume: 2400, note: "[DEMO SCENARIO 1] Exit target reached for Candle 11 position (+0.80 P&L)" },

    { open: 99.4, high: 100.2, low: 99.0, close: 99.8, volume: 1400 },
    { open: 99.8, high: 100.5, low: 99.5, close: 100.1, volume: 1200 },
    { open: 100.1, high: 100.4, low: 99.7, close: 99.9, volume: 1100 },
    { open: 99.9, high: 100.2, low: 99.2, close: 99.5, volume: 1000 },
    { open: 99.5, high: 99.9, low: 99.0, close: 99.2, volume: 950 },
    { open: 99.2, high: 99.6, low: 98.8, close: 99.0, volume: 900 },
    { open: 99.0, high: 99.5, low: 98.6, close: 99.1, volume: 1050 },

    // CANDLE 20: VOLATILITY SPIKE BEGINNING
    { open: 99.1, high: 104.5, low: 94.2, close: 103.8, volume: 3200, note: "[DEMO SCENARIO 2] Sudden wild price swing" },

    // CANDLE 21: DEMO SCENARIO 2 - BLOCKED BY RISK GUARDIAN!
    { open: 103.8, high: 108.5, low: 92.1, close: 105.2, volume: 3800, overrideVol: 0.078, note: "[DEMO SCENARIO 2] HIGH RISK: Signal WATCH_LONG triggered, but Volatility 0.078 > 0.05 -> BLOCKED BY RISK GUARDIAN" },

    // CANDLE 22: VOLATILITY RECOIL
    { open: 105.2, high: 106.0, low: 96.5, close: 97.2, volume: 3100, overrideVol: 0.085, note: "[DEMO SCENARIO 2] Market crashed down - Risk Guardian saved the account from massive loss!" },

    { open: 97.2, high: 98.0, low: 96.5, close: 97.8, volume: 1200 },
    { open: 97.8, high: 98.2, low: 97.0, close: 97.1, volume: 1100 },
    { open: 97.1, high: 97.5, low: 96.0, close: 96.2, volume: 1900, note: "Exit watch signal candidate (Price < VWAP with high volume)" },
    { open: 96.2, high: 96.8, low: 95.8, close: 96.0, volume: 1000 },
    { open: 96.0, high: 96.5, low: 95.5, close: 95.8, volume: 900 },
    { open: 95.8, high: 96.2, low: 95.4, close: 95.6, volume: 850 },
    { open: 95.6, high: 96.0, low: 95.0, close: 95.2, volume: 800, note: "Final session candle" }
  ];

  const candles: Candle[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const raw = rawData[i];
    const timestamp = new Date(baseTime.getTime() + i * 60 * 1000).toISOString();

    const cumulative = rawData.slice(0, i + 1);
    const vwap = calculateVWAP(cumulative);
    const volume_ratio = calculateVolumeRatio(rawData, i);
    const calculatedVolatility = calculateVolatility(rawData, i);
    const volatility = raw.overrideVol !== undefined ? raw.overrideVol : calculatedVolatility;

    const price_relative_to_vwap = Number((((raw.close - vwap) / vwap) * 100).toFixed(2));

    candles.push({
      index: i,
      timestamp,
      open: raw.open,
      high: raw.high,
      low: raw.low,
      close: raw.close,
      volume: raw.volume,
      vwap,
      volume_ratio,
      volatility,
      price_relative_to_vwap,
      note: raw.note
    });
  }

  return candles;
}

export const SYNTHETIC_CANDLES: Candle[] = generateSyntheticCandles();
