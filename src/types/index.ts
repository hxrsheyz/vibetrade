/**
 * VibeTrade Backend Data Types
 * DO NOT CONNECT TO LIVE BROKER APIs IN THIS DEMO.
 * Synthetic paper trading engine context only.
 */

export interface Candle {
  index: number;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
  volume_ratio: number; // current volume / average of last 10 candles
  volatility: number;   // rolling standard deviation of returns
  price_relative_to_vwap: number; // percentage diff: ((close - vwap) / vwap) * 100
  note?: string;        // Scenario hint for demo rehearsal
}

export type SignalType = "WATCH_LONG" | "NO_TRADE" | "EXIT_WATCH";

export interface SignalOutput {
  symbol: string;
  signal: SignalType;
  confidence: number;
  reasons: string[];
  risks: string[];
  data_timestamp: string;
  llm_enhanced?: boolean;
}

export interface AccountInfo {
  balance: number;
  daily_pnl: number;
  max_notional: number;
  max_shares: number;
  stop_loss_pct?: number;
}

export type CheckResult = "passed" | "failed";

export interface RiskChecks {
  confidence: CheckResult;
  volatility: CheckResult;
  notional: CheckResult;
  daily_loss: CheckResult;
  position_size: CheckResult;
  stop_loss: CheckResult;
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

export interface AuditEvent {
  id: string;
  timestamp: string;
  candle_index: number;
  candle_timestamp: string;
  symbol: string;
  price: number;
  signal: SignalOutput;
  risk_decision: RiskOutput;
  simulated_trade: TradeSimulation | null;
  outcome: "TRADE_EXECUTED" | "TRADE_REJECTED" | "NO_SIGNAL";
}

export interface ReplayState {
  current_index: number;
  total_candles: number;
  current_candle: Candle | null;
  is_complete: boolean;
  history: AuditEvent[];
}

export interface StepProcessResult {
  candle: Candle;
  signal: SignalOutput;
  risk: RiskOutput;
  trade: TradeSimulation | null;
  audit_event: AuditEvent;
  replay_state: {
    current_index: number;
    total_candles: number;
    is_complete: boolean;
  };
}
