# VibeTrade Backend - API Documentation for Frontend Integration

> **IMPORTANT DISCLAIMER**: This backend is for a paper-trading hackathon demo only. It **NEVER** connects to live brokers, bank accounts, or real trading exchanges.

Welcome! This documentation is specifically designed for your frontend teammate to easily integrate the React + TypeScript frontend with this Express backend.

---

## 🚀 Quick Setup & Base URL

- **Local Base URL**: `http://localhost:5000/api`
- **CORS Policy**: Enabled for all origins (`*`)
- **Content-Type**: `application/json`

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/candles` | Fetch all 30 synthetic dataset candles with indicators |
| `GET` | `/api/candles/:index` | Fetch a single candle by index (`0` to `29`) |
| `GET` | `/api/replay/state` | Get current market replay engine state |
| `POST` | `/api/replay/next` | Replay next candle & process full pipeline (Signal -> Risk -> Trade) |
| `POST` | `/api/replay/reset` | Reset replay engine back to candle `0` & clear audit logs |
| `POST` | `/api/replay/jump` | Jump directly to a candle index (`{"index": 11}`) |
| `POST` | `/api/signal/analyze` | Run AI Signal Agent on market data |
| `POST` | `/api/risk/evaluate` | Run deterministic Risk Guardian checks on a signal |
| `POST` | `/api/trade/simulate` | Execute paper trade simulation |
| `GET` | `/api/audit/logs` | Fetch full audit timeline event logs |
| `GET` | `/api/scenarios` | Fetch demo judging scenario shortcuts |

---

## 📋 Endpoint Details & Payload Specs

### 1. `GET /api/candles`
Returns all 30 precomputed candles for symbol `"DEMO"`.

**Response Example:**
```json
{
  "symbol": "DEMO",
  "total": 30,
  "candles": [
    {
      "index": 11,
      "timestamp": "2026-09-30T09:41:00.000Z",
      "open": 97.5,
      "high": 98.9,
      "low": 97.4,
      "close": 98.6,
      "volume": 2850,
      "vwap": 96.5,
      "volume_ratio": 2.45,
      "volatility": 0.024,
      "price_relative_to_vwap": 2.18,
      "note": "[DEMO SCENARIO 1] PERFECT BREAKOUT..."
    }
  ]
}
```

---

### 2. `POST /api/replay/next`
Advances replay by 1 step, computes AI Signal, evaluates Risk Gate, executes Trade Simulator, and logs to Audit Timeline.

**Request Body (Optional Account Override):**
```json
{
  "account": {
    "balance": 100000,
    "daily_pnl": -250,
    "max_notional": 100000,
    "max_shares": 1000
  }
}
```

**Response Example:**
```json
{
  "candle": {
    "index": 11,
    "close": 98.6,
    "vwap": 96.5,
    "volume_ratio": 2.45,
    "volatility": 0.024
  },
  "signal": {
    "symbol": "DEMO",
    "signal": "WATCH_LONG",
    "confidence": 0.84,
    "reasons": [
      "Price ($98.60) is trading above VWAP ($96.50), signaling bullish momentum.",
      "Volume ratio of 2.45x indicates strong institutional interest."
    ],
    "risks": [
      "Potential fakeout if high-volume momentum suddenly subsides."
    ],
    "data_timestamp": "2026-09-30T09:41:00.000Z",
    "llm_enhanced": false
  },
  "risk": {
    "approved": true,
    "checks": {
      "confidence": "passed",
      "volatility": "passed",
      "notional": "passed",
      "daily_loss": "passed",
      "position_size": "passed",
      "stop_loss": "passed"
    },
    "rejection_reason": null
  },
  "trade": {
    "entry_price": 98.7,
    "quantity": 1000,
    "slippage": 0.0986,
    "fees": 1.0,
    "exit_price": 99.8,
    "exit_candle_index": 14,
    "pnl": 1099.0,
    "pnl_percentage": 1.11,
    "status": "APPROVED (PAPER)",
    "disclaimer": "SIMULATION ONLY – NO LIVE ORDERS"
  },
  "audit_event": {
    "id": "evt_1759223000_a8x9f",
    "timestamp": "2026-09-30T14:30:00.000Z",
    "candle_index": 11,
    "outcome": "TRADE_EXECUTED"
  },
  "replay_state": {
    "current_index": 12,
    "total_candles": 30,
    "is_complete": false
  }
}
```

---

### 3. `POST /api/replay/jump`
Directly sets replay candle position.

**Request Body:**
```json
{
  "index": 21
}
```

---

## 🎯 Rehearsing the 4-Minute Demo (For Frontend Developer)

1. **Start Screen**: Click **Reset Replay** (`POST /api/replay/reset`).
2. **Breakout Demo (Trade Approved)**: Click **Jump to Breakout** (`POST /api/replay/jump` with `index: 11`) or click **Next Event** 11 times.
   - Show **Signal Agent** panel: `"WATCH_LONG"`, confidence `0.84`.
   - Show **Risk Guardian** panel: All checks green (`passed`), `approved: true`.
   - Show **Trade Simulator** panel: Status `"APPROVED (PAPER)"`, positive simulated P&L.
3. **High Volatility Risk Demo (Trade Blocked)**: Click **Jump to Risk Event** (`POST /api/replay/jump` with `index: 21`).
   - Show **Signal Agent** panel: `"WATCH_LONG"` triggered by price surge.
   - Show **Risk Guardian** panel: Volatility check turns **RED (`failed`)**, `approved: false`.
   - Show **Rejection Reason**: `"Market volatility (7.80%) exceeds maximum risk threshold (5.00%)."`
   - Show **Trade Simulator** panel: Status `"BLOCKED BY RISK"`.
4. **Audit Timeline**: Highlight how every single market event, AI signal, risk decision, and outcome is logged chronologically for regulatory compliance.

---

## 💡 Frontend TypeScript Interface Snippets

```typescript
export interface Candle {
  index: number;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
  volume_ratio: number;
  volatility: number;
  price_relative_to_vwap: number;
  note?: string;
}

export interface SignalOutput {
  symbol: string;
  signal: "WATCH_LONG" | "NO_TRADE" | "EXIT_WATCH";
  confidence: number;
  reasons: string[];
  risks: string[];
  data_timestamp: string;
  llm_enhanced?: boolean;
}

export interface RiskChecks {
  confidence: "passed" | "failed";
  volatility: "passed" | "failed";
  notional: "passed" | "failed";
  daily_loss: "passed" | "failed";
  position_size: "passed" | "failed";
  stop_loss: "passed" | "failed";
}

export interface RiskOutput {
  approved: boolean;
  checks: RiskChecks;
  rejection_reason: string | null;
}

export interface TradeSimulation {
  entry_price: number;
  quantity: number;
  slippage: number;
  fees: number;
  exit_price: number;
  exit_candle_index: number;
  pnl: number;
  pnl_percentage: number;
  status: "APPROVED (PAPER)" | "BLOCKED BY RISK";
  disclaimer: "SIMULATION ONLY – NO LIVE ORDERS";
}
```
