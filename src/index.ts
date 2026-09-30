import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/api";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({
    app: "VibeTrade Backend Engine",
    version: "1.0.0",
    status: "online",
    mode: "PAPER TRADING / DEMO ONLY",
    disclaimer: "SIMULATION ONLY – NO LIVE ORDERS OR BROKER CONNECTIONS.",
    endpoints: {
      candles: "/api/candles",
      replay_state: "/api/replay/state",
      replay_next: "POST /api/replay/next",
      replay_reset: "POST /api/replay/reset",
      replay_jump: "POST /api/replay/jump",
      signal_analyze: "POST /api/signal/analyze",
      risk_evaluate: "POST /api/risk/evaluate",
      trade_simulate: "POST /api/trade/simulate",
      audit_logs: "/api/audit/logs",
      scenarios: "/api/scenarios"
    }
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`
  ===============================================================
  🚀 VIBETRADE BACKEND ENGINE IS RUNNING ON PORT ${PORT}
  ===============================================================
  ⚠️  SAFETY DISCLAIMER: PAPER-TRADING DEMO ONLY.
  ⚠️  NO LIVE BROKER APIs, EXCHANGE CONNECTIONS, OR BANK ACCOUNTS.
  ===============================================================
  📡 API Base URL: http://localhost:${PORT}/api
  🔍 Health Check: http://localhost:${PORT}/health
  📊 Demo Scenarios:
     - Candle 11: Breakout Scenario (Trade APPROVED)
     - Candle 21: High Volatility Scenario (Trade BLOCKED)
  ===============================================================
  `);
});

export default app;
