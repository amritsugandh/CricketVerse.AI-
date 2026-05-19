# CricketVerse AI 🏏🤖

**The ultimate real-time cricket engagement platform.** Predict ball-by-ball outcomes, earn XP, climb leaderboards, and experience matches like never before.

![CricketVerse AI](https://cricketverse-ai-269286132991.asia-south1.run.app/favicon.svg)

## Overview

CricketVerse AI transforms the passive cricket viewing experience into a highly interactive, gamified ecosystem. By leveraging real-time WebSockets and an intelligent backend engine, fans can participate in live matchups, see dynamic AI-powered insights, and climb global leaderboards.

### 🌟 Key Features

- **Deep Ball-by-Ball AI Analysis:** Real-time momentum tracking, dot-ball pressure analytics, and format-aware (T20 vs ODI) game phase boundary transitions.
- **Dynamic Predictions Engine:** Earn XP by accurately calling outcomes (Boundaries, Wickets, Dot Balls) before they happen. Features animated score-pop interactions.
- **Live Match Hub:** An immersive stadium-like dashboard broadcasting live scores, run rates, ball-by-ball commentary, and live win probabilities.
- **Real-Time Global Leaderboards:** Climb the ranks against thousands of active predictors with live streak tracking and accuracy metrics.
- **Cricket Calendar:** Interactive, horizontally scrolling widget tracking ongoing and upcoming tournaments worldwide.

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript, orchestrated by Vite.
- **Styling:** Custom Tailwind CSS (v4) with premium glassmorphism and tailored dark-mode gradients.
- **Animations:** Framer Motion for highly responsive UI micro-animations and slide-up transitions.
- **State Management:** Redux Toolkit.

### Backend
- **Framework:** FastAPI (Python) running on Uvicorn.
- **Real-Time Infrastructure:** Event-driven architecture relying on persistent WebSockets to broadcast low-latency match updates and leaderboard shifts.
- **Engine:** Intelligent `LiveMatchEngine` simulating mid-match events, polling RapidAPI data, and calculating deterministic confidence scores.

## 🚀 Live Deployment

The platform is deployed live on Google Cloud Run:
👉 [https://cricketverse-ai-269286132991.asia-south1.run.app](https://cricketverse-ai-269286132991.asia-south1.run.app)

## 💻 Running Locally

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
*The backend will run on `http://127.0.0.1:8000`.*

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173`.*

## 📜 License
CricketVerse AI © 2026. All Rights Reserved.
