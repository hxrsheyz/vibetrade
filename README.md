# VibeTrade 📈 (SIMULATION ONLY)

> **⚠️ HACKATHON PAPER-TRADING DEMO**
> **SIMULATION ONLY**: VibeTrade uses purely synthetic, in-memory market data generated locally in Python. It does **NOT** connect to any live broker, exchange, bank account, market data API, or news source. No API keys are required or requested.

---

## 🌟 Overview

**VibeTrade** is a feature-packed, single-page algorithmic & paper-trading simulation dashboard built for hackathons and strategy prototyping. It provides an intuitive interface to inspect market indicators, review AI-generated trade signals (with deterministic offline fallbacks), test risk management rules, execute paper orders, and maintain an immutable audit trail.

---

## 🚀 Key Features

1. **Title & Prominent Simulation Disclaimer**: Immediate visual confirmation of sandbox environment with no real financial risks.
2. **Market-Data Replay Controls**: Step through synthetic time-series data, toggle auto-replay, adjust market volatility, and switch between synthetic assets (`BTC/USD`, `ETH/USD`, `NVDA`, `AAPL`, `TSLA`).
3. **Current Market Metrics & Charts**: Real-time KPI summary (Price, 24h %, RSI-14, Volume, Volatility) plus dynamic Plotly technical charts (Candlesticks, Moving Averages, Buy/Sell trade execution flags).
4. **AI Signal Panel**: Synthetic indicator-driven AI strategy engine featuring confidence scores, target entry/exit prices, and deterministic offline signal rationale explanations.
5. **Deterministic Risk-Check Panel**: Pre-trade evaluation rules validating position sizes, account capital adequacy, volatility spikes, and daily trade limits with clear `PASSED` / `FLAGGED` / `BLOCKED` status tags.
6. **Simulated Trade Panel**: Order entry form for Market & Limit orders, instant fill simulator, and live portfolio accounting (Cash Balance, Open Positions, Unrealized P&L, Realized P&L).
7. **Audit Timeline**: Structured event log tracking tick updates, signal evaluations, risk checks, and trade fills with downloadable JSON log exports.

---

## 💻 Quick Start

### Prerequisites
- Python 3.9 or higher

### Installation & Launch

1. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

2. Start the Streamlit application on port 5000:
   ```bash
   python -m streamlit run app.py --server.address 0.0.0.0 --server.port 5000 --server.headless true --server.enableCORS=false
   ```

3. Open your browser at `http://localhost:5000` to view the VibeTrade dashboard.

## ☁️ Streamlit Community Cloud Deployment

VibeTrade is 100% compatible with **Streamlit Community Cloud**:

1. Push this repository to GitHub.
2. Log into [share.streamlit.io](https://share.streamlit.io/).
3. Click **New app** and select your repository.
4. Set **Main file path** to `app.py`.
5. Click **Deploy!**

> **Note**: No secrets or API keys are required. All dependencies in `requirements.txt` (`streamlit`, `pandas`, `numpy`, `plotly`) will automatically install during deployment.

---

## 🔒 Security & Privacy Notice
VibeTrade operates entirely in-memory. No trade telemetry, secrets, or market simulation data leaves the local Python runtime. No live brokers or financial APIs are connected.

