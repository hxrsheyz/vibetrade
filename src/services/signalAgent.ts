import { Candle, SignalOutput, SignalType } from "../types";

export async function analyzeSignal(marketData: Candle): Promise<SignalOutput> {
  const { close, vwap, volume_ratio, volatility, timestamp } = marketData;

  let signal: SignalType = "NO_TRADE";
  let confidence = 0.40;
  let defaultReasons: string[] = [];
  let defaultRisks: string[] = [];

  const priceAboveVwap = close > vwap;
  const priceBelowVwap = close < vwap;
  const highVolumeRatio = volume_ratio > 1.8;
  const lowVolatility = volatility < 0.05;

  if (priceAboveVwap && highVolumeRatio && lowVolatility) {
    signal = "WATCH_LONG";
    confidence = 0.84;
    defaultReasons = [
      `Price ($${close.toFixed(2)}) is trading above VWAP ($${vwap.toFixed(2)}), signaling bullish momentum.`,
      `Volume ratio of ${volume_ratio.toFixed(2)}x indicates strong institutional interest above normal baseline.`,
      `Market volatility is stable at ${(volatility * 100).toFixed(2)}%, below the 5.0% risk threshold.`
    ];
    defaultRisks = [
      "Potential fakeout if high-volume momentum suddenly subsides.",
      "Resistance levels at recent highs could trigger brief pullbacks."
    ];
  } else if (priceBelowVwap && highVolumeRatio && lowVolatility) {
    signal = "EXIT_WATCH";
    confidence = 0.76;
    defaultReasons = [
      `Price ($${close.toFixed(2)}) dropped below VWAP ($${vwap.toFixed(2)}) on heightened volume.`,
      `Volume ratio of ${volume_ratio.toFixed(2)}x confirms persistent selling pressure.`
    ];
    defaultRisks = [
      "Oversold conditions may cause short-term technical bounce."
    ];
  } else if (volatility >= 0.05) {
    signal = priceAboveVwap ? "WATCH_LONG" : "NO_TRADE";
    confidence = priceAboveVwap ? 0.78 : 0.35;
    defaultReasons = [
      priceAboveVwap ? `Price ($${close.toFixed(2)}) is above VWAP with high volume.` : `High volatility environment detected.`
    ];
    defaultRisks = [
      `CRITICAL RISK: Volatility is elevated at ${(volatility * 100).toFixed(2)}% (exceeds 5.0% max limit).`,
      "Severe slippage and wide bid-ask spread risk during extreme fluctuations."
    ];
  } else {
    signal = "NO_TRADE";
    confidence = 0.42;
    defaultReasons = [
      `Price is trading near VWAP ($${vwap.toFixed(2)}) without clear directional bias.`,
      `Volume ratio (${volume_ratio.toFixed(2)}x) does not satisfy the 1.8x breakout threshold.`
    ];
    defaultRisks = [
      "Capital lockup risk in low-conviction, sideways market conditions."
    ];
  }

  let llmEnhanced = false;
  let finalReasons = defaultReasons;
  let finalRisks = defaultRisks;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const llmResult = await fetchLLMSummary({
        symbol: "DEMO",
        close,
        vwap,
        volume_ratio,
        volatility,
        signal,
        confidence
      }, apiKey);

      if (llmResult) {
        finalReasons = llmResult.reasons;
        finalRisks = llmResult.risks;
        llmEnhanced = true;
      }
    } catch (err) {
      console.warn("LLM explanation generator failed or timed out. Falling back to deterministic agent reasons.");
    }
  }

  return {
    symbol: "DEMO",
    signal,
    confidence: Number(confidence.toFixed(2)),
    reasons: finalReasons,
    risks: finalRisks,
    data_timestamp: timestamp,
    llm_enhanced: llmEnhanced
  };
}

async function fetchLLMSummary(
  input: {
    symbol: string;
    close: number;
    vwap: number;
    volume_ratio: number;
    volatility: number;
    signal: SignalType;
    confidence: number;
  },
  apiKey: string
): Promise<{ reasons: string[]; risks: string[] } | null> {
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const systemPrompt = `You are a financial AI agent. Given quantitative market metrics and a predetermined signal, produce concise bullet points for 'reasons' (2 items) and 'risks' (2 items).
Do NOT change the signal, confidence, or invent new numbers. Return valid JSON only with structure:
{"reasons": ["..."], "risks": ["..."]}`;

  const userPrompt = JSON.stringify(input);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const json: any = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.reasons) && Array.isArray(parsed.risks)) {
      return {
        reasons: parsed.reasons.map((s: any) => String(s)),
        risks: parsed.risks.map((s: any) => String(s))
      };
    }
    return null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
