# 🃏 Poker Tracker

A full-stack web app for tracking poker session results, with charts and stats.

## Tech Stack

- **Frontend**: React + TypeScript, Vite, Recharts
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (via better-sqlite3)

## Getting Started

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Start the backend

```bash
cd server
npm run dev
```

The API runs at `http://localhost:3001`.

### 3. Start the frontend

```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

## Features

- **Log Sessions** — Date, location, game type, buy-in, cash-out, duration, notes
- **Dashboard** — Total profit, win rate, hourly rate, charts
- **Session History** — Sortable table with edit/delete
- **Visualizations** — Cumulative profit line chart, profit by location bar chart
