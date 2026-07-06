"use client";

import { formatCurrency, formatMultiplier } from "@/lib/gameLogic";
import type { GameStatus } from "@/lib/types";

interface GameStatsProps {
  balance: number;
  currentMultiplier: number;
  profit: number;
  safeRevealedCount: number;
  gameStatus: GameStatus;
}

export default function GameStats({
  balance,
  currentMultiplier,
  profit,
  safeRevealedCount,
  gameStatus,
}: GameStatsProps) {
  const isActive = gameStatus === "active";
  const hasProfit = isActive && safeRevealedCount > 0 && profit > 0;
  const hasMultiplier = isActive && safeRevealedCount > 0;

  return (
    <div className="grid grid-cols-2 gap-1.5">
      <StatCard
        label="Balance"
        value={`$${formatCurrency(balance)}`}
        accent="gold"
        active
      />
      <StatCard
        label="Multiplier"
        value={formatMultiplier(currentMultiplier)}
        accent="gold"
        active={hasMultiplier}
      />
      <StatCard
        label="Profit"
        value={
          isActive && safeRevealedCount > 0
            ? `+$${formatCurrency(profit)}`
            : "$0.00"
        }
        accent="gold"
        active={hasProfit}
      />
      <StatCard
        label="Treasures Found"
        value={String(safeRevealedCount)}
        accent="gold"
        active={safeRevealedCount > 0}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "neutral",
  active = false,
}: {
  label: string;
  value: string;
  accent?: "gold" | "crimson" | "neutral";
  active?: boolean;
}) {
  const accentClass =
    accent === "gold"
      ? "stat-card-gold"
      : accent === "crimson"
        ? "stat-card-crimson"
        : "stat-card-neutral";

  return (
    <div
      className={`stat-card ${accentClass} ${active ? "stat-card-active" : ""}`}
    >
      <p className="stat-card-label">{label}</p>
      <p
        className={`stat-card-value stat-value ${
          active ? "stat-card-value-active" : "stat-card-value-idle"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
