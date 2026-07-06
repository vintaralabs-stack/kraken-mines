# Kraken Mines

A premium pirate/ocean themed Mines casino game demo built with Next.js and React.

## Features

- 5×5 grid with 1–24 configurable Kraken Traps
- Dynamic multiplier with ~3% house edge
- Bet controls, cash out, and round history
- Premium dark ocean UI with smooth tile animations
- Fully client-side prototype (ready for backend integration)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Game Rules

1. Set your **Bet Amount** and **Kraken Traps** count
2. Click **Start Voyage** — traps are randomly placed
3. Click tiles to reveal treasure or traps
4. **Cash Out** after at least one safe tile to collect winnings
5. Hit a trap and **The Kraken Awoke** — you lose your bet

## Production Notes

This is a demo prototype. Real-money deployment requires:

- Server-authoritative game logic
- Provably fair RNG with verifiable seeds
- Backend payout validation
- Licensed regulatory compliance

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
