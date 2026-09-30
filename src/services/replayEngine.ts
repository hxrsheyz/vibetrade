import { SYNTHETIC_CANDLES } from "../data/syntheticData";
import { AccountInfo, AuditEvent, Candle, ReplayState, StepProcessResult } from "../types";
import { DEFAULT_ACCOUNT_INFO, riskGate } from "./riskGuardian";
import { analyzeSignal } from "./signalAgent";
import { simulateTrade } from "./tradeSimulator";

export class ReplayEngine {
  private candles: Candle[];
  private currentIndex: number;
  private auditLogs: AuditEvent[];

  constructor() {
    this.candles = SYNTHETIC_CANDLES;
    this.currentIndex = 0;
    this.auditLogs = [];
  }

  public getState(): ReplayState {
    const currentCandle = this.candles[this.currentIndex] || null;
    return {
      current_index: this.currentIndex,
      total_candles: this.candles.length,
      current_candle: currentCandle,
      is_complete: this.currentIndex >= this.candles.length - 1,
      history: [...this.auditLogs]
    };
  }

  public reset(): ReplayState {
    this.currentIndex = 0;
    this.auditLogs = [];
    return this.getState();
  }

  public setIndex(index: number): ReplayState {
    if (index >= 0 && index < this.candles.length) {
      this.currentIndex = index;
    }
    return this.getState();
  }

  public async step(account: AccountInfo = DEFAULT_ACCOUNT_INFO): Promise<StepProcessResult> {
    const candle = this.candles[this.currentIndex];

    const signal = await analyzeSignal(candle);
    const risk = riskGate(signal, candle, account);
    const trade = simulateTrade(candle, this.candles, risk, account);

    let outcome: "TRADE_EXECUTED" | "TRADE_REJECTED" | "NO_SIGNAL" = "NO_SIGNAL";
    if (signal.signal === "WATCH_LONG") {
      outcome = risk.approved ? "TRADE_EXECUTED" : "TRADE_REJECTED";
    }

    const auditEvent: AuditEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      candle_index: candle.index,
      candle_timestamp: candle.timestamp,
      symbol: candle.note || "DEMO",
      price: candle.close,
      signal,
      risk_decision: risk,
      simulated_trade: trade,
      outcome
    };

    const existingIndex = this.auditLogs.findIndex(e => e.candle_index === candle.index);
    if (existingIndex >= 0) {
      this.auditLogs[existingIndex] = auditEvent;
    } else {
      this.auditLogs.push(auditEvent);
    }

    const isComplete = this.currentIndex >= this.candles.length - 1;

    if (!isComplete) {
      this.currentIndex += 1;
    }

    return {
      candle,
      signal,
      risk,
      trade,
      audit_event: auditEvent,
      replay_state: {
        current_index: this.currentIndex,
        total_candles: this.candles.length,
        is_complete: isComplete
      }
    };
  }

  public getAuditLogs(): AuditEvent[] {
    return [...this.auditLogs];
  }
}

export const replayEngine = new ReplayEngine();
