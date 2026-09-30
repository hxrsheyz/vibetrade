import { AccountInfo, Candle, RiskOutput, TradeSimulation } from "../types";
import { DEFAULT_ACCOUNT_INFO } from "./riskGuardian";

const SLIPPAGE_PCT = 0.001;
const FIXED_FEE = 1.00;

export function simulateTrade(
  currentCandle: Candle,
  allCandles: Candle[],
  riskResult: RiskOutput,
  account: AccountInfo = DEFAULT_ACCOUNT_INFO,
  exitCandleOffset: number = 3
): TradeSimulation | null {
  if (!riskResult.approved) {
    return {
      entry_price: Number((currentCandle.close * (1 + SLIPPAGE_PCT)).toFixed(2)),
      quantity: 0,
      slippage: Number((currentCandle.close * SLIPPAGE_PCT).toFixed(4)),
      fees: 0,
      exit_price: 0,
      exit_candle_index: currentCandle.index,
      pnl: 0,
      pnl_percentage: 0,
      status: "BLOCKED BY RISK",
      disclaimer: "SIMULATION ONLY – NO LIVE ORDERS"
    };
  }

  const rawQty = Math.floor(Math.min(account.max_notional / currentCandle.close, account.max_shares));
  const quantity = Math.max(1, rawQty);

  const rawSlippage = currentCandle.close * SLIPPAGE_PCT;
  const entry_price = Number((currentCandle.close + rawSlippage).toFixed(2));
  const slippage = Number(rawSlippage.toFixed(4));

  const exitIndex = Math.min(allCandles.length - 1, currentCandle.index + exitCandleOffset);
  const exitCandle = allCandles[exitIndex];
  const exit_price = Number(exitCandle.close.toFixed(2));

  const grossPnl = (exit_price - entry_price) * quantity;
  const fees = FIXED_FEE;
  const netPnl = Number((grossPnl - fees).toFixed(2));
  const investedCapital = entry_price * quantity;
  const pnl_percentage = Number(((netPnl / investedCapital) * 100).toFixed(2));

  return {
    entry_price,
    quantity,
    slippage,
    fees,
    exit_price,
    exit_candle_index: exitIndex,
    pnl: netPnl,
    pnl_percentage,
    status: "APPROVED (PAPER)",
    disclaimer: "SIMULATION ONLY – NO LIVE ORDERS"
  };
}
