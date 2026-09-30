import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import datetime
import json
import time

# ==========================================
# PAGE CONFIGURATION & RESTRAINED GRAPHITE THEME
# ==========================================
st.set_page_config(
    page_title="VibeTrade Operations Console",
    page_icon="🧊",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS: Institutional Dark Graphite Terminal Theme (No gradients, no rounded cards, no emojis)
st.markdown("""
<style>
    /* Dark Graphite Base Theme */
    .stApp {
        background-color: #121417;
        color: #D1D5DB;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-variant-numeric: tabular-nums;
    }
    .main .block-container {
        padding: 0.75rem 1.25rem;
        max-width: 100%;
    }
    
    /* Top Bar Console */
    .top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #1C2026;
        border: 1px solid #2D333B;
        border-radius: 6px;
        padding: 0.6rem 1rem;
        margin-bottom: 0.75rem;
    }
    .brand-wordmark {
        font-size: 1.15rem;
        font-weight: 700;
        color: #F3F4F6;
        letter-spacing: 0.5px;
    }
    .env-badge {
        background-color: #22272E;
        color: #16A34A;
        border: 1px solid #16A34A;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        margin-left: 10px;
    }
    .top-meta {
        font-size: 0.8rem;
        color: #9CA3AF;
        font-family: monospace;
    }
    .feed-status {
        color: #20B2AA;
        font-weight: 600;
    }
    
    /* Terminal Panel Container */
    .terminal-panel {
        background-color: #1C2026;
        border: 1px solid #2D333B;
        border-radius: 6px;
        padding: 0.85rem;
        margin-bottom: 0.75rem;
    }
    .panel-header {
        font-size: 0.82rem;
        font-weight: 700;
        color: #9CA3AF;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        padding-bottom: 0.4rem;
        border-bottom: 1px solid #2D333B;
        margin-bottom: 0.6rem;
    }
    
    /* Compact OHLCV Data Strip */
    .ohlcv-strip {
        display: flex;
        gap: 1.25rem;
        background-color: #16191D;
        border: 1px solid #2D333B;
        border-radius: 4px;
        padding: 0.4rem 0.8rem;
        font-family: monospace;
        font-size: 0.82rem;
        margin-bottom: 0.5rem;
    }
    .ohlcv-item {
        color: #9CA3AF;
    }
    .ohlcv-val {
        color: #F3F4F6;
        font-weight: 600;
    }

    /* Decision State Banners (No gradients, high contrast) */
    .decision-banner-buy {
        background-color: #142E1F;
        border: 1px solid #16A34A;
        color: #22C55E;
        padding: 0.6rem 0.8rem;
        border-radius: 4px;
        font-size: 1.1rem;
        font-weight: 800;
        letter-spacing: 0.5px;
    }
    .decision-banner-watch {
        background-color: #1E293B;
        border: 1px solid #20B2AA;
        color: #20B2AA;
        padding: 0.6rem 0.8rem;
        border-radius: 4px;
        font-size: 1.1rem;
        font-weight: 800;
        letter-spacing: 0.5px;
    }
    .decision-banner-blocked {
        background-color: #311313;
        border: 1px solid #DC2626;
        color: #EF4444;
        padding: 0.6rem 0.8rem;
        border-radius: 4px;
        font-size: 1.1rem;
        font-weight: 800;
        letter-spacing: 0.5px;
    }

    /* Status Tags */
    .tag-pass { background-color: #142E1F; color: #22C55E; border: 1px solid #16A34A; padding: 1px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; }
    .tag-warn { background-color: #33250D; color: #F59E0B; border: 1px solid #D97706; padding: 1px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; }
    .tag-fail { background-color: #311313; color: #EF4444; border: 1px solid #DC2626; padding: 1px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; }

    /* Key-Value Pair Displays */
    .kv-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.25rem 0;
        border-bottom: 1px solid #22272E;
        font-size: 0.8rem;
    }
    .kv-key { color: #9CA3AF; }
    .kv-val { color: #F3F4F6; font-weight: 600; font-family: monospace; }

    /* Button Tuning */
    div.stButton > button {
        border-radius: 4px;
        border: 1px solid #2D333B;
        background-color: #22272E;
        color: #F3F4F6;
        font-size: 0.8rem;
        font-weight: 600;
    }
    div.stButton > button:hover {
        border-color: #20B2AA;
        color: #20B2AA;
    }
</style>
""", unsafe_allow_html=True)

# ==========================================
# SYNTHETIC MARKET DATA GENERATOR (OFFLINE)
# ==========================================
@st.cache_data(show_spinner=False)
def generate_synthetic_market_data(asset: str, seed: int = 42, length: int = 150) -> pd.DataFrame:
    """Generates synthetic OHLCV price series, VWAP, events, and TA metrics in-memory."""
    np.random.seed(seed + hash(asset) % 10000)
    
    params = {
        "BTC/USD": {"base_price": 64000.0, "volatility": 0.020, "drift": 0.0004},
        "ETH/USD": {"base_price": 3450.0, "volatility": 0.025, "drift": 0.0003},
        "NVDA": {"base_price": 125.0, "volatility": 0.022, "drift": 0.0006},
        "AAPL": {"base_price": 220.0, "volatility": 0.012, "drift": 0.0002},
        "TSLA": {"base_price": 240.0, "volatility": 0.030, "drift": -0.0001}
    }
    config = params.get(asset, {"base_price": 100.0, "volatility": 0.02, "drift": 0.0001})
    
    start_time = datetime.datetime.now() - datetime.timedelta(hours=length)
    dates = [start_time + datetime.timedelta(hours=i) for i in range(length)]
    
    returns = np.random.normal(config["drift"], config["volatility"], length)
    cycles = 0.012 * np.sin(np.linspace(0, 4 * np.pi, length))
    returns += cycles / 10
    
    price_paths = config["base_price"] * np.exp(np.cumsum(returns))
    
    ohlc_data = []
    for idx, price in enumerate(price_paths):
        vol = config["volatility"]
        high = price * (1 + abs(np.random.normal(0, vol * 0.5)))
        low = price * (1 - abs(np.random.normal(0, vol * 0.5)))
        open_p = price * (1 + np.random.normal(0, vol * 0.25)) if idx > 0 else price
        close_p = price
        
        high = max(high, open_p, close_p)
        low = min(low, open_p, close_p)
        volume = int(np.random.uniform(8000, 45000) * (price / 100.0))
        
        # Insert discrete market event triggers for replay scenarios
        event_tag = None
        if idx == 40:
            event_tag = "Normal Trend"
        elif idx == 65:
            event_tag = "Breakout Spike"
            volume = int(volume * 2.8)
            close_p = round(close_p * 1.025, 2)
            high = max(high, close_p)
        elif idx == 90:
            event_tag = "Volatility Spike"
            returns[idx:idx+5] *= 3.5
        elif idx == 115:
            event_tag = "Volume Anomaly"
            volume = int(volume * 3.2)
            
        ohlc_data.append({
            "timestamp": dates[idx],
            "open": round(open_p, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "close": round(close_p, 2),
            "volume": volume,
            "event_tag": event_tag
        })
        
    df = pd.DataFrame(ohlc_data)
    
    # Calculate VWAP, Rolling Volatility & Indicators
    df["typical_price"] = (df["high"] + df["low"] + df["close"]) / 3.0
    df["cum_vol_price"] = (df["typical_price"] * df["volume"]).cumsum()
    df["cum_volume"] = df["volume"].cumsum()
    df["vwap"] = (df["cum_vol_price"] / df["cum_volume"]).round(2)
    
    rolling_vol = df["volume"].rolling(20, min_periods=1).mean()
    df["vol_ratio"] = (df["volume"] / rolling_vol).round(2)
    df["volatility_score"] = (df["close"].pct_change().rolling(20, min_periods=1).std() * np.sqrt(252) * 100).fillna(14.0).round(2)
    
    df["sma_20"] = df["close"].rolling(window=20, min_periods=1).mean().round(2)
    df["sma_50"] = df["close"].rolling(window=50, min_periods=1).mean().round(2)
    
    delta = df["close"].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14, min_periods=1).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14, min_periods=1).mean()
    rs = gain / (loss + 1e-8)
    df["rsi_14"] = (100 - (100 / (1 + rs))).round(2)
    
    ema12 = df["close"].ewm(span=12, adjust=False).mean()
    ema26 = df["close"].ewm(span=26, adjust=False).mean()
    df["macd"] = (ema12 - ema26).round(2)
    df["macd_signal"] = df["macd"].ewm(span=9, adjust=False).mean().round(2)
    df["macd_hist"] = (df["macd"] - df["macd_signal"]).round(2)
    
    return df

# ==========================================
# INITIALIZE SESSION STATE
# ==========================================
def init_session_state():
    if "active_asset" not in st.session_state:
        st.session_state.active_asset = "BTC/USD"
    if "current_tick" not in st.session_state:
        st.session_state.current_tick = 65
    if "volatility_mult" not in st.session_state:
        st.session_state.volatility_mult = 1.0
    if "portfolio" not in st.session_state:
        st.session_state.portfolio = {
            "cash": 100000.0,
            "initial_capital": 100000.0,
            "positions": {},
            "trade_history": [],
            "realized_pnl": 0.0
        }
    if "audit_log" not in st.session_state:
        st.session_state.audit_log = [
            {
                "time": datetime.datetime.now().strftime("%H:%M:%S"),
                "stage": "INIT",
                "event": "Session Initialized",
                "result": "PASSED",
                "details": "VibeTrade paper terminal booted in synthetic mode."
            }
        ]

init_session_state()

def log_audit_event(stage: str, event: str, result: str, details: str):
    st.session_state.audit_log.insert(0, {
        "time": datetime.datetime.now().strftime("%H:%M:%S"),
        "stage": stage,
        "event": event,
        "result": result,
        "details": details
    })

# Load Data for Active Instrument
assets_list = ["BTC/USD", "ETH/USD", "NVDA", "AAPL", "TSLA"]
full_df = generate_synthetic_market_data(st.session_state.active_asset)
max_ticks = len(full_df) - 1

df_slice = full_df.iloc[:st.session_state.current_tick + 1].copy()
latest_row = df_slice.iloc[-1]
prev_row = df_slice.iloc[-2] if len(df_slice) > 1 else latest_row

price_change = latest_row["close"] - prev_row["close"]
price_change_pct = (price_change / prev_row["close"]) * 100 if prev_row["close"] > 0 else 0.0

# ==========================================
# TOP BAR CONSOLE
# ==========================================
col_top1, col_top2 = st.columns([2.5, 2])

with col_top1:
    st.markdown(f"""
    <div class="top-bar">
        <div style="display: flex; align-items: center; gap: 12px;">
            <span class="brand-wordmark">VibeTrade</span>
            <span class="env-badge">Paper Environment</span>
            <span style="color: #9CA3AF; font-size: 0.8rem; font-family: monospace;">DEMO / SYNTH</span>
        </div>
        <div class="top-meta">
            Feed: <span class="feed-status">Synthetic Feed</span> | Timestamp: {latest_row['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}
        </div>
    </div>
    """, unsafe_allow_html=True)

with col_top2:
    ctrl_col1, ctrl_col2, ctrl_col3, ctrl_col4 = st.columns([1.2, 1, 1, 1])
    with ctrl_col1:
        sel_asset = st.selectbox("Instrument", assets_list, index=assets_list.index(st.session_state.active_asset), label_visibility="collapsed")
        if sel_asset != st.session_state.active_asset:
            st.session_state.active_asset = sel_asset
            log_audit_event("MARKET", "Instrument Changed", "PASSED", f"Switched feed to {sel_asset}")
            st.rerun()
    with ctrl_col2:
        if st.button("Reset Feed", use_container_width=True):
            st.session_state.current_tick = 40
            st.session_state.volatility_mult = 1.0
            log_audit_event("REPLAY", "Reset Replay", "PASSED", "Timeline reset to tick 40")
            st.rerun()
    with ctrl_col3:
        if st.button("Reset Cash", use_container_width=True):
            st.session_state.portfolio["cash"] = 100000.0
            st.session_state.portfolio["positions"] = {}
            st.session_state.portfolio["realized_pnl"] = 0.0
            log_audit_event("PORTFOLIO", "Reset Portfolio", "PASSED", "Cash restored to $100,000.00")
            st.rerun()
    with ctrl_col4:
        st.session_state.volatility_mult = st.selectbox("Vol Mult", [0.8, 1.0, 1.5, 2.5], index=[0.8, 1.0, 1.5, 2.5].index(st.session_state.volatility_mult) if st.session_state.volatility_mult in [0.8, 1.0, 1.5, 2.5] else 1, label_visibility="collapsed")

# ==========================================
# MAIN CONTENT: TWO-COLUMN LAYOUT
# ==========================================
left_col, right_col = st.columns([2.3, 1.1])

# --- LEFT COLUMN: OHLCV + CHART + REPLAY CONTROLS ---
with left_col:
    # Compact OHLCV Data Strip
    st.markdown(f"""
    <div class="ohlcv-strip">
        <div><span class="ohlcv-item">INSTRUMENT:</span> <span class="ohlcv-val">{st.session_state.active_asset}</span></div>
        <div><span class="ohlcv-item">OPEN:</span> <span class="ohlcv-val">${latest_row['open']:,.2f}</span></div>
        <div><span class="ohlcv-item">HIGH:</span> <span class="ohlcv-val">${latest_row['high']:,.2f}</span></div>
        <div><span class="ohlcv-item">LOW:</span> <span class="ohlcv-val">${latest_row['low']:,.2f}</span></div>
        <div><span class="ohlcv-item">CLOSE:</span> <span class="ohlcv-val">${latest_row['close']:,.2f}</span></div>
        <div><span class="ohlcv-item">VOLUME:</span> <span class="ohlcv-val">{latest_row['volume']:,}</span></div>
        <div><span class="ohlcv-item">CHANGE:</span> <span class="ohlcv-val" style="color: {'#16A34A' if price_change >= 0 else '#DC2626'};">{'+' if price_change >= 0 else ''}${price_change:.2f} ({price_change_pct:+.2f}%)</span></div>
    </div>
    """, unsafe_allow_html=True)

    # Dominant Plotly Candlestick & VWAP Chart
    fig = make_subplots(rows=2, cols=1, shared_xaxes=True, vertical_spacing=0.04, row_heights=[0.78, 0.22])

    fig.add_trace(go.Candlestick(
        x=df_slice["timestamp"], open=df_slice["open"], high=df_slice["high"], low=df_slice["low"], close=df_slice["close"],
        name="Price OHLC",
        increasing_line_color="#16A34A", decreasing_line_color="#DC2626"
    ), row=1, col=1)

    fig.add_trace(go.Scatter(
        x=df_slice["timestamp"], y=df_slice["vwap"], mode="lines", name="VWAP", line=dict(color="#20B2AA", width=1.5, dash="dash")
    ), row=1, col=1)

    fig.add_trace(go.Scatter(
        x=df_slice["timestamp"], y=df_slice["sma_20"], mode="lines", name="SMA 20", line=dict(color="#3B82F6", width=1)
    ), row=1, col=1)

    # Add Event Markers on Chart (Breakout, Volume Spike, Signal)
    event_rows = df_slice[df_slice["event_tag"].notnull()]
    if not event_rows.empty:
        fig.add_trace(go.Scatter(
            x=event_rows["timestamp"], y=event_rows["high"] * 1.008, mode="markers+text",
            marker=dict(symbol="diamond", size=9, color="#F59E0B"),
            text=event_rows["event_tag"], textposition="top center",
            textfont=dict(color="#F59E0B", size=10),
            name="Event Annotation"
        ), row=1, col=1)

    # Trade Execution Markers
    buy_pts, sell_pts = [], []
    for t in st.session_state.portfolio["trade_history"]:
        if t["asset"] == st.session_state.active_asset and t.get("timestamp") in df_slice["timestamp"].values:
            if t["action"] == "BUY":
                buy_pts.append((t["timestamp"], t["price"]))
            else:
                sell_pts.append((t["timestamp"], t["price"]))

    if buy_pts:
        bx, by = zip(*buy_pts)
        fig.add_trace(go.Scatter(x=bx, y=by, mode="markers", marker=dict(symbol="triangle-up", size=12, color="#16A34A"), name="Exec Buy"), row=1, col=1)
    if sell_pts:
        sx, sy = zip(*sell_pts)
        fig.add_trace(go.Scatter(x=sx, y=sy, mode="markers", marker=dict(symbol="triangle-down", size=12, color="#DC2626"), name="Exec Sell"), row=1, col=1)

    # Subplot: Volume & Vol Ratio
    fig.add_trace(go.Bar(
        x=df_slice["timestamp"], y=df_slice["volume"], name="Volume", marker_color="#374151"
    ), row=2, col=1)

    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="#1C2026",
        plot_bgcolor="#121417",
        height=400,
        margin=dict(l=10, r=10, t=10, b=10),
        xaxis_rangeslider_visible=False,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(size=10))
    )
    st.plotly_chart(fig, use_container_width=True)

    # Replay Controls directly below chart
    r_col1, r_col2, r_col3, r_col4 = st.columns([1.5, 1.2, 1.2, 3])
    with r_col1:
        if st.button("Replay Next Event", use_container_width=True, type="primary"):
            st.session_state.current_tick = min(max_ticks, st.session_state.current_tick + 1)
            log_audit_event("REPLAY", "Signal Detected", "PASSED", f"Replay advanced to tick {st.session_state.current_tick}")
            st.rerun()
    with r_col2:
        if st.button("Previous Event", use_container_width=True):
            st.session_state.current_tick = max(20, st.session_state.current_tick - 1)
            log_audit_event("REPLAY", "Previous Event", "PASSED", f"Replay stepped back to tick {st.session_state.current_tick}")
            st.rerun()
    with r_col3:
        if st.button("Reset Replay", use_container_width=True):
            st.session_state.current_tick = 40
            log_audit_event("REPLAY", "Reset Replay", "PASSED", "Timeline reset to tick 40")
            st.rerun()
    with r_col4:
        r_slider = st.slider("Timeline Step", min_value=20, max_value=max_ticks, value=min(st.session_state.current_tick, max_ticks), label_visibility="collapsed")
        if r_slider != st.session_state.current_tick:
            st.session_state.current_tick = r_slider
            st.rerun()

# --- RIGHT COLUMN: DECISION PANEL ---
rsi = latest_row["rsi_14"]
macd_hist = latest_row["macd_hist"]
close_p = latest_row["close"]
vwap_p = latest_row["vwap"]
sma20 = latest_row["sma_20"]
vol_ratio = latest_row["vol_ratio"]
eff_volatility = latest_row["volatility_score"] * st.session_state.volatility_mult

# Deterministic Risk Evaluation Matrix
proposed_val = close_p * 10.0
total_equity = st.session_state.portfolio["cash"] + sum(p["qty"] * close_p for p in st.session_state.portfolio["positions"].values())

rule_cash = st.session_state.portfolio["cash"] >= proposed_val
rule_sizing = (proposed_val / total_equity) <= 0.25
rule_volatility = eff_volatility <= 22.0
rule_drawdown = ((total_equity - 100000.0) / 100000.0) >= -0.15

risk_gate_passed = rule_cash and rule_sizing and rule_volatility and rule_drawdown

# Deterministic Signal Model
if rsi < 35 and macd_hist > 0 and vol_ratio >= 1.2:
    decision_state = "PAPER BUY" if risk_gate_passed else "BLOCKED"
    confidence = 88
    thesis = "Mean-reversion momentum breakout with volume anomaly confirmation above support."
    evidence = [f"RSI oversold ({rsi:.1f}) < 35 threshold", f"Volume spike ratio: {vol_ratio:.2f}x average", f"MACD crossover histogram: +{macd_hist:.2f}"]
    risk_flags = ["Distance to stop-loss: 2.1%", "Elevated intra-candle volatility"]
elif rsi > 65 and macd_hist < 0:
    decision_state = "WATCH"
    confidence = 74
    thesis = "Distribution exhaustion near upper resistance. Short bias under observation."
    evidence = [f"RSI overbought ({rsi:.1f}) > 65 threshold", f"Negative MACD momentum ({macd_hist:.2f})"]
    risk_flags = ["Upper resistance test in progress"]
elif close_p > vwap_p and vol_ratio > 1.5 and risk_gate_passed:
    decision_state = "PAPER BUY"
    confidence = 82
    thesis = "VWAP expansion breakout with positive institutional volume ratio."
    evidence = [f"Price (${close_p:,.2f}) trading above VWAP (${vwap_p:,.2f})", f"Volume anomaly ratio: {vol_ratio:.2f}x"]
    risk_flags = ["Volatility threshold approaching limit"]
else:
    if not risk_gate_passed:
        decision_state = "BLOCKED"
        confidence = 45
        thesis = "Execution gate blocked due to active risk limit parameter violation."
        evidence = ["Risk rule failure detected"]
        risk_flags = ["Volatility threshold exceeded" if not rule_volatility else "Risk gate failure"]
    else:
        decision_state = "WATCH"
        confidence = 58
        thesis = "Consolidation regime. No high-probability technical edge detected."
        evidence = [f"RSI neutral ({rsi:.1f})", f"VWAP spread: ${(close_p - vwap_p):.2f}"]
        risk_flags = ["Range-bound price action"]

with right_col:
    st.markdown("""<div class="terminal-panel"><div class="panel-header">Decision Console</div>""", unsafe_allow_html=True)
    
    # Decision Banner
    if decision_state == "PAPER BUY":
        banner_html = f'<div class="decision-banner-buy">DECISION: PAPER BUY ({confidence}% CONFIDENCE)</div>'
    elif decision_state == "BLOCKED":
        banner_html = f'<div class="decision-banner-blocked">DECISION: BLOCKED (RISK GATE FAILED)</div>'
    else:
        banner_html = f'<div class="decision-banner-watch">DECISION: WATCH ({confidence}% CONFIDENCE)</div>'
    st.markdown(banner_html, unsafe_allow_html=True)
    
    st.markdown(f"<div style='font-size: 0.8rem; margin: 8px 0; color: #D1D5DB;'><strong>Thesis:</strong> {thesis}</div>", unsafe_allow_html=True)
    
    st.markdown("<div style='font-size: 0.78rem; font-weight: 700; color: #20B2AA; margin-top: 6px;'>Evidence List:</div>", unsafe_allow_html=True)
    for ev in evidence:
        st.markdown(f"<div style='font-size: 0.76rem; color: #9CA3AF;'>• {ev}</div>", unsafe_allow_html=True)

    st.markdown("<div style='font-size: 0.78rem; font-weight: 700; color: #F59E0B; margin-top: 6px;'>Risk Flags:</div>", unsafe_allow_html=True)
    for rf in risk_flags:
        st.markdown(f"<div style='font-size: 0.76rem; color: #9CA3AF;'>• {rf}</div>", unsafe_allow_html=True)

    st.markdown("<hr style='border-color: #2D333B; margin: 10px 0;'>", unsafe_allow_html=True)

    # Paper Execution Form & Button (DISABLED when risk gate blocks order!)
    with st.form("decision_execution_form"):
        exec_qty = st.number_input("Order Quantity", value=10.0, min_value=1.0, step=5.0)
        exec_notional = exec_qty * close_p
        
        st.markdown(f"""
        <div class="kv-row"><span class="kv-key">Intended Notional:</span><span class="kv-val">${exec_notional:,.2f}</span></div>
        <div class="kv-row"><span class="kv-key">Risk Gate Status:</span><span class="kv-val">{'<span class="tag-pass">GATE PASSED</span>' if risk_gate_passed else '<span class="tag-fail">GATE BLOCKED</span>'}</span></div>
        """, unsafe_allow_html=True)
        
        # Disabled when risk gate blocks the trade
        btn_label = "Simulate Order Execution" if risk_gate_passed else "Order Blocked by Risk Gate"
        btn_submitted = st.form_submit_button(btn_label, disabled=not risk_gate_passed, use_container_width=True)
        
        if btn_submitted:
            fee = exec_notional * 0.0005
            st.session_state.portfolio["cash"] -= (exec_notional + fee)
            prev_p = st.session_state.portfolio["positions"].get(st.session_state.active_asset, {"qty": 0.0, "avg_price": 0.0})
            new_q = prev_p["qty"] + exec_qty
            new_avg = ((prev_p["qty"] * prev_p["avg_price"]) + exec_notional) / new_q
            st.session_state.portfolio["positions"][st.session_state.active_asset] = {"qty": new_q, "avg_price": new_avg}
            
            st.session_state.portfolio["trade_history"].append({
                "asset": st.session_state.active_asset, "action": "BUY", "quantity": exec_qty,
                "price": close_p, "total": exec_notional, "timestamp": latest_row["timestamp"]
            })
            log_audit_event("EXECUTION", "Execution Simulated", "PASSED", f"BUY {exec_qty} {st.session_state.active_asset} @ ${close_p:,.2f}")
            st.success("Execution simulated successfully")
            time.sleep(0.3)
            st.rerun()

    st.markdown("</div>", unsafe_allow_html=True)

# ==========================================
# LOWER SECTION: THREE COMPACT DATA PANELS
# ==========================================
l_col1, l_col2, l_col3 = st.columns(3)

# PANEL 1: SIGNAL BREAKDOWN
with l_col1:
    st.markdown("""<div class="terminal-panel"><div class="panel-header">1. Signal Breakdown</div>""", unsafe_allow_html=True)
    st.markdown(f"""
    <div class="kv-row"><span class="kv-key">Momentum Index (RSI):</span><span class="kv-val">{rsi:.1f}</span></div>
    <div class="kv-row"><span class="kv-key">Volume Anomaly:</span><span class="kv-val">{vol_ratio:.2f}x avg</span></div>
    <div class="kv-row"><span class="kv-key">VWAP Relationship:</span><span class="kv-val">${(close_p - vwap_p):+.2f}</span></div>
    <div class="kv-row"><span class="kv-key">Event Context:</span><span class="kv-val">{latest_row['event_tag'] if latest_row['event_tag'] else 'Standard Bar'}</span></div>
    """, unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

# PANEL 2: RISK CONTROLS DATA TABLE
with l_col2:
    st.markdown("""<div class="terminal-panel"><div class="panel-header">2. Risk Controls</div>""", unsafe_allow_html=True)
    risk_df = pd.DataFrame([
        {"Rule": "Capital Check", "Actual": f"${st.session_state.portfolio['cash']:,.0f}", "Threshold": f"${proposed_val:,.0f}", "Status": "PASSED" if rule_cash else "FAILED"},
        {"Rule": "Position Cap", "Actual": f"{(proposed_val/total_equity)*100:.1f}%", "Threshold": "25.0%", "Status": "PASSED" if rule_sizing else "WARNING"},
        {"Rule": "Vol Threshold", "Actual": f"{eff_volatility:.1f}%", "Threshold": "22.0%", "Status": "PASSED" if rule_volatility else "BLOCKED"},
        {"Rule": "Drawdown Limit", "Actual": f"{((total_equity-100000.0)/100000.0)*100:+.1f}%", "Threshold": "-15.0%", "Status": "PASSED" if rule_drawdown else "BLOCKED"}
    ])
    st.dataframe(risk_df, use_container_width=True, hide_index=True)
    st.markdown("</div>", unsafe_allow_html=True)

# PANEL 3: EXECUTION PREVIEW
with l_col3:
    st.markdown("""<div class="terminal-panel"><div class="panel-header">3. Execution Preview</div>""", unsafe_allow_html=True)
    est_notional = 10.0 * close_p
    est_slippage = est_notional * 0.0001
    est_fees = est_notional * 0.0005
    est_risk = est_notional * 0.02
    
    st.markdown(f"""
    <div class="kv-row"><span class="kv-key">Intended Quantity:</span><span class="kv-val">10.00 units</span></div>
    <div class="kv-row"><span class="kv-key">Estimated Notional:</span><span class="kv-val">${est_notional:,.2f}</span></div>
    <div class="kv-row"><span class="kv-key">Est. Slippage (1 bps):</span><span class="kv-val">${est_slippage:.2f}</span></div>
    <div class="kv-row"><span class="kv-key">Est. Fees (5 bps):</span><span class="kv-val">${est_fees:.2f}</span></div>
    <div class="kv-row"><span class="kv-key">Stop-Loss Target:</span><span class="kv-val">${(close_p * 0.98):,.2f}</span></div>
    <div class="kv-row"><span class="kv-key">Estimated Risk:</span><span class="kv-val">${est_risk:,.2f}</span></div>
    """, unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

# ==========================================
# BOTTOM: FULL-WIDTH AUDIT LOG TABLE
# ==========================================
st.markdown("""<div class="terminal-panel"><div class="panel-header">Audit Trail Log</div>""", unsafe_allow_html=True)
audit_df = pd.DataFrame(st.session_state.audit_log)
st.dataframe(audit_df[["time", "stage", "event", "result", "details"]], use_container_width=True, hide_index=True)
st.markdown("</div>", unsafe_allow_html=True)

# Operational Disclaimer Footer
st.markdown(
    "<div style='text-align: center; color: #4B5563; font-size: 0.75rem; margin-top: 10px; font-family: monospace;'>"
    "VibeTrade Operational Console • Paper Environment Only • Synthetic Data Feed • Zero External Network Connections"
    "</div>",
    unsafe_allow_html=True
)
