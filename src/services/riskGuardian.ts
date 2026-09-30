import { AccountInfo, Candle, RiskChecks, RiskOutput, SignalOutput } from "../types";

export const DEFAULT_ACCOUNT_INFO: AccountInfo = {
  balance: 100000,
  daily_pnl: -250,
  max_notional: 100000,
  max_shares: 1000,
  stop_loss_pct: 0.02
};

export function riskGate(
  signal: SignalOutput,
  market: Candle,
  account: AccountInfo = DEFAULT_ACCOUNT_INFO,
  stopLossProvided: boolean = true
): RiskOutput {
  const checks: RiskChecks = {
    confidence: "passed",
    volatility: "passed",
    notional: "passed",
    daily_loss: "passed",
    position_size: "passed",
    stop_loss: "passed"
  };

  const rejections: string[] = [];

  if (signal.confidence < 0.70) {
    checks.confidence = "failed";
    rejections.push(`Signal confidence (${(signal.confidence * 100).toFixed(0)}%) is below required 70% threshold.`);
  }

  if (market.volatility > 0.05) {
    checks.volatility = "failed";
    rejections.push(`Market volatility (${(market.volatility * 100).toFixed(2)}%) exceeds maximum risk threshold (5.00%).`);
  }

  const proposedShares = Math.floor(Math.min(account.max_notional / market.close, account.max_shares));
  const proposedNotional = proposedShares * market.close;

  if (proposedShares <= 0) {
    checks.position_size = "failed";
    rejections.push(`Calculated position size (${proposedShares} shares) is invalid or zero.`);
  }

  if (proposedNotional > 100000) {
    checks.notional = "failed";
    rejections.push(`Proposed trade notional value ($${proposedNotional.toLocaleString()}) exceeds $100,000 ceiling.`);
  }

  if (account.daily_pnl <= -5000) {
    checks.daily_loss = "failed";
    rejections.push(`Account daily loss limit reached ($${account.daily_pnl.toLocaleString()} <= -$5,000 threshold).`);
  }

  if (!stopLossProvided || !account.stop_loss_pct || account.stop_loss_pct <= 0) {
    checks.stop_loss = "failed";
    rejections.push("Mandatory stop-loss rule parameters are missing or disabled.");
  }

  if (signal.signal === "NO_TRADE") {
    rejections.push("Signal Agent generated 'NO_TRADE' action.");
  }

  const approved = rejections.length === 0;
  const rejection_reason = approved ? null : rejections.join(" | ");

  return {
    approved,
    checks,
    rejection_reason
  };
}
