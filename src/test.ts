import { generateSyntheticCandles } from "./data/syntheticData";
import { analyzeSignal } from "./services/signalAgent";
import { riskGate } from "./services/riskGuardian";
import { simulateTrade } from "./services/tradeSimulator";
import { ReplayEngine } from "./services/replayEngine";

async function runTests() {
  console.log("=========================================");
  console.log("🧪 RUNNING VIBETRADE BACKEND TESTS");
  console.log("=========================================\n");

  const candles = generateSyntheticCandles();
  console.log(`✅ Generated ${candles.length} synthetic candles.`);

  // Test 1: Candle 11 (Breakout - Trade Approved)
  console.log("\n--- TEST 1: Candle 11 (Breakout Approved Scenario) ---");
  const candle11 = candles[11];
  console.log(`Candle 11: Close=$${candle11.close}, VWAP=$${candle11.vwap}, VolRatio=${candle11.volume_ratio}x, Volatility=${candle11.volatility}`);

  const signal11 = await analyzeSignal(candle11);
  console.log("Signal Agent Output:", JSON.stringify(signal11, null, 2));

  const risk11 = riskGate(signal11, candle11);
  console.log("Risk Guardian Output:", JSON.stringify(risk11, null, 2));

  const trade11 = simulateTrade(candle11, candles, risk11);
  console.log("Trade Simulator Output:", JSON.stringify(trade11, null, 2));

  if (signal11.signal === "WATCH_LONG" && risk11.approved && trade11?.status === "APPROVED (PAPER)") {
    console.log("🎉 TEST 1 PASSED: Candle 11 correctly generated WATCH_LONG, APPROVED by Risk Gate, & EXECUTED trade!");
  } else {
    console.error("❌ TEST 1 FAILED!");
    process.exit(1);
  }

  // Test 2: Candle 21 (High Volatility - Trade Blocked)
  console.log("\n--- TEST 2: Candle 21 (High Volatility Blocked Scenario) ---");
  const candle21 = candles[21];
  console.log(`Candle 21: Close=$${candle21.close}, VWAP=$${candle21.vwap}, VolRatio=${candle21.volume_ratio}x, Volatility=${candle21.volatility}`);

  const signal21 = await analyzeSignal(candle21);
  console.log("Signal Agent Output:", JSON.stringify(signal21, null, 2));

  const risk21 = riskGate(signal21, candle21);
  console.log("Risk Guardian Output:", JSON.stringify(risk21, null, 2));

  const trade21 = simulateTrade(candle21, candles, risk21);
  console.log("Trade Simulator Output:", JSON.stringify(trade21, null, 2));

  if (!risk21.approved && risk21.checks.volatility === "failed" && trade21?.status === "BLOCKED BY RISK") {
    console.log("🎉 TEST 2 PASSED: Candle 21 was correctly BLOCKED by Risk Guardian due to high volatility!");
  } else {
    console.error("❌ TEST 2 FAILED!");
    process.exit(1);
  }

  // Test 3: Replay Engine pipeline execution
  console.log("\n--- TEST 3: Replay Engine Pipeline ---");
  const engine = new ReplayEngine();
  engine.setIndex(11);
  const stepRes = await engine.step();
  console.log("Step Result Candle Index:", stepRes.candle.index);
  console.log("Audit Event Logged ID:", stepRes.audit_event.id);
  console.log("Replay Engine State:", engine.getState());

  console.log("\n=========================================");
  console.log("✅ ALL VIBETRADE BACKEND TESTS COMPLETED SUCCESSFULLY");
  console.log("=========================================\n");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
