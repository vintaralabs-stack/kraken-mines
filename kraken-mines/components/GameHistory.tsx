"use client";

import { useState } from "react";
import { formatCurrency, formatMultiplier } from "@/lib/gameLogic";
import { choiceLabel } from "@/lib/wheelLogic";
import type { HistoryEntry } from "@/lib/types";

interface GameHistoryProps {
  history: HistoryEntry[];
}

function historyBadge(entry: HistoryEntry): {
  label: string;
  className: string;
} {
  switch (entry.result) {
    case "cashout":
      return { label: "Loot", className: "history-badge-win" };
    case "kraken":
      return { label: "Kraken", className: "history-badge-loss" };
    case "gamble-win":
      return { label: "G Win", className: "history-badge-gamble-win" };
    case "gamble-loss":
      return { label: "G Loss", className: "history-badge-gamble-loss" };
  }
}

function gambleDetail(entry: HistoryEntry): string | null {
  if (entry.result !== "gamble-win" && entry.result !== "gamble-loss") {
    return null;
  }
  if (!entry.gambleChoice || !entry.gambleLanded) return null;

  const mult =
    entry.gamblePayoutMult !== undefined
      ? `${entry.gamblePayoutMult}x`
      : "0x";

  return `${choiceLabel(entry.gambleChoice)} → ${choiceLabel(entry.gambleLanded)} · ${mult}`;
}

export default function GameHistory({ history }: GameHistoryProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-ocean-700/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-2 text-left hover:bg-ocean-900/30 transition-colors"
        aria-expanded={open}
      >
        <span className="text-ui-label">
          Recent Games
          {history.length > 0 && (
            <span className="ml-2 text-ui-muted normal-case tracking-normal">
              ({history.length})
            </span>
          )}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-ui-muted transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="px-3 sm:px-4 pb-2.5">
          {history.length === 0 ? (
            <p className="text-ui-helper pb-1">No games yet</p>
          ) : (
            <div className="space-y-0 max-h-28 overflow-y-auto scrollbar-thin">
              {history.map((entry) => {
                const badge = historyBadge(entry);
                const detail = gambleDetail(entry);

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between text-ui-body py-1 border-b border-ocean-800/60 last:border-0"
                  >
                    <div className="flex flex-col min-w-0 gap-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`shrink-0 px-1 py-px rounded text-[9px] font-bold uppercase ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-ui-secondary truncate">
                          ${formatCurrency(entry.bet)} · {entry.trapCount} traps
                        </span>
                      </div>
                      {detail && (
                        <span className="text-ui-helper text-[10px] pl-0.5 truncate">
                          {detail}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2 stat-value">
                      <span className="text-ui-secondary">
                        {formatMultiplier(entry.multiplier)}
                      </span>
                      <span
                        className={`font-semibold min-w-[52px] text-right ${
                          entry.profit >= 0 ? "text-gold-300" : "text-crimson-300"
                        }`}
                      >
                        {entry.profit >= 0 ? "+" : "-"}$
                        {formatCurrency(Math.abs(entry.profit))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
