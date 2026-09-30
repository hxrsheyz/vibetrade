import { Router, Request, Response } from "express";
import { SYNTHETIC_CANDLES } from "../data/syntheticData";
import { replayEngine } from "../services/replayEngine";
import { analyzeSignal } from "../services/signalAgent";
import { riskGate, DEFAULT_ACCOUNT_INFO } from "../services/riskGuardian";
import { simulateTrade } from "../services/tradeSimulator";

const router = Router();

router.get("/candles", (req: Request, res: Response) => {
  res.json({
    symbol: "DEMO",
    total: SYNTHETIC_CANDLES.length,
    candles: SYNTHETIC_CANDLES
  });
});

router.get("/candles/:index", (req: Request, res: Response) => {
  const index = parseInt(req.params.index, 10);
  if (isNaN(index) || index < 0 || index >= SYNTHETIC_CANDLES.length) {
    return res.status(404).json({ error: "Candle index out of range (0 to 29)." });
  }
  res.json(SYNTHETIC_CANDLES[index]);
});

router.get("/replay/state", (req: Request, res: Response) => {
  res.json(replayEngine.getState());
});

router.post("/replay/next", async (req: Request, res: Response) => {
  try {
    const accountInfo = req.body.account ? { ...DEFAULT_ACCOUNT_INFO, ...req.body.account } : DEFAULT_ACCOUNT_INFO;
    const result = await replayEngine.step(accountInfo);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to process replay step.", details: error.message });
  }
});

router.post("/replay/reset", (req: Request, res: Response) => {
  const state = replayEngine.reset();
  res.json({ message: "Replay engine reset to index 0.", state });
});

router.post("/replay/jump", (req: Request, res: Response) => {
  const index = parseInt(req.body.index, 10);
  if (isNaN(index) || index < 0 || index >= SYNTHETIC_CANDLES.length) {
    return res.status(400).json({ error: "Invalid candle index provided." });
  }
  const state = replayEngine.setIndex(index);
  res.json({ message: `Jumped to candle index ${index}.`, state });
});

router.post("/signal/analyze", async (req: Request, res: Response) => {
  try {
    const marketData = req.body.marketData || SYNTHETIC_CANDLES[replayEngine.getState().current_index];
    if (!marketData) {
      return res.status(400).json({ error: "No market data provided or found." });
    }
    const signal = await analyzeSignal(marketData);
    res.json(signal);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to analyze signal.", details: error.message });
  }
});

router.post("/risk/evaluate", (req: Request, res: Response) => {
  try {
    const { signal, market, account } = req.body;
    const currentMarket = market || SYNTHETIC_CANDLES[replayEngine.getState().current_index];

    if (!signal) {
      return res.status(400).json({ error: "Signal object required for risk evaluation." });
    }

    const accountConfig = account ? { ...DEFAULT_ACCOUNT_INFO, ...account } : DEFAULT_ACCOUNT_INFO;
    const riskResult = riskGate(signal, currentMarket, accountConfig);

    res.json(riskResult);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to evaluate risk gate.", details: error.message });
  }
});

router.post("/trade/simulate", (req: Request, res: Response) => {
  try {
    const { market, riskResult, account } = req.body;
    const currentCandle = market || SYNTHETIC_CANDLES[replayEngine.getState().current_index];

    if (!riskResult) {
      return res.status(400).json({ error: "Risk evaluation result required." });
    }

    const accountConfig = account ? { ...DEFAULT_ACCOUNT_INFO, ...account } : DEFAULT_ACCOUNT_INFO;
    const simulation = simulateTrade(currentCandle, SYNTHETIC_CANDLES, riskResult, accountConfig);

    res.json(simulation);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to simulate trade.", details: error.message });
  }
});

router.get("/audit/logs", (req: Request, res: Response) => {
  res.json({
    total: replayEngine.getAuditLogs().length,
    logs: replayEngine.getAuditLogs()
  });
});

router.get("/scenarios", (req: Request, res: Response) => {
  res.json({
    scenarios: [
      {
        name: "Breakout (Trade Approved)",
        candle_index: 11,
        description: "Price > VWAP ($98.60 vs $96.50), Volume Ratio 2.45x > 1.8x, Low Volatility 0.024 < 0.05. Risk Guardian approves paper trade.",
        expected_outcome: "APPROVED (PAPER)"
      },
      {
        name: "High Volatility Spike (Trade Blocked)",
        candle_index: 21,
        description: "Bullish signal triggered by price momentum, but Volatility is 0.078 (> 0.05 limit). Risk Guardian strictly BLOCKS trade.",
        expected_outcome: "BLOCKED BY RISK"
      }
    ]
  });
});

export default router;
