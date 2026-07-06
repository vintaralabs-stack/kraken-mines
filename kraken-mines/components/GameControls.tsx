"use client";

import { formatCurrency } from "@/lib/gameLogic";
import {
  MAX_TRAP_COUNT,
  MIN_TRAP_COUNT,
  type GameStatus,
} from "@/lib/types";

interface GameControlsProps {
  betAmount: number;
  trapCount: number;
  balance: number;
  gameStatus: GameStatus;
  safeRevealedCount: number;
  cashoutAmount: number;
  statusMessage: string | null;
  successGlow?: boolean;
  onBetChange: (value: number) => void;
  onTrapChange: (value: number) => void;
  onBet: () => void;
  onCashOut: () => void;
}

const QUICK_BETS = [5, 10, 25, 50, 100];

export default function GameControls({
  betAmount,
  trapCount,
  balance,
  gameStatus,
  safeRevealedCount,
  cashoutAmount,
  statusMessage,
  successGlow = false,
  onBetChange,
  onTrapChange,
  onBet,
  onCashOut,
}: GameControlsProps) {
  const isActive = gameStatus === "active";
  const isRoundOver = gameStatus === "won" || gameStatus === "lost";
  const controlsLocked = isActive;

  const canBet = !isActive && betAmount > 0 && betAmount <= balance;
  const canCashOut = isActive && safeRevealedCount >= 1;

  const handleBetInput = (raw: string) => {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0) {
      onBetChange(Math.round(parsed * 100) / 100);
    } else if (raw === "") {
      onBetChange(0);
    }
  };

  const flashClass = successGlow ? "cashout-btn-flash" : "";

  return (
    <div
      className={`flex flex-col gap-2.5 w-full rounded-xl ${
        successGlow ? "cashout-controls-flash" : ""
      }`}
    >
      {statusMessage && isRoundOver && (
        <div
          className={`
            rounded-lg px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide
            ${
              gameStatus === "won"
                ? "status-banner-win"
                : "status-banner-loss animate-crimson-status"
            }
          `}
        >
          {statusMessage}
        </div>
      )}

      <div>
        <label
          htmlFor="bet-amount"
          className="text-ui-label block mb-1"
        >
          Bet Amount
        </label>
        <div className="flex gap-1.5">
          <input
            id="bet-amount"
            type="number"
            min={1}
            max={balance}
            step={1}
            value={betAmount || ""}
            onChange={(e) => handleBetInput(e.target.value)}
            disabled={controlsLocked}
            className="input-field flex-1 rounded-lg px-2.5 py-2 text-sm stat-value"
          />
          <button
            type="button"
            onClick={() =>
              onBetChange(Math.min(balance, Math.round(balance * 100) / 100))
            }
            disabled={controlsLocked}
            className="btn-outline rounded-lg px-2.5 py-2 text-[10px] font-bold shrink-0"
          >
            MAX
          </button>
        </div>
        <div className="grid grid-cols-5 gap-1 mt-1.5">
          {QUICK_BETS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => onBetChange(Math.min(amount, balance))}
              disabled={controlsLocked || amount > balance}
              className={`
                bet-preset text-[11px] py-1.5 rounded-md font-medium stat-value
                transition-all disabled:opacity-35 disabled:cursor-not-allowed
                ${betAmount === amount ? "bet-preset-active" : "bet-preset-idle"}
              `}
            >
              {amount}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="trap-count"
            className="text-ui-label"
          >
            Kraken Traps
          </label>
          <span className="text-sm font-semibold text-crimson-300 stat-value">
            {trapCount}
          </span>
        </div>
        <input
          id="trap-count"
          type="range"
          min={MIN_TRAP_COUNT}
          max={MAX_TRAP_COUNT}
          value={trapCount}
          onChange={(e) => onTrapChange(parseInt(e.target.value, 10))}
          disabled={controlsLocked}
          className="trap-slider w-full"
        />
        <div className="flex justify-between text-ui-helper mt-0.5">
          <span>{MIN_TRAP_COUNT}</span>
          <span>{MAX_TRAP_COUNT}</span>
        </div>
      </div>

      <div className="pt-0.5">
        {isActive ? (
          <button
            type="button"
            onClick={onCashOut}
            disabled={!canCashOut}
            className={`btn-action w-full rounded-lg py-2.5 flex flex-col items-center gap-0.5 ${
              !canCashOut ? "btn-action-disabled" : ""
            } ${flashClass}`}
          >
            <span className="text-ui-label uppercase tracking-[0.18em] font-semibold leading-none">
              Cash Out
            </span>
            <span className="text-base font-bold stat-value leading-none text-ocean-950">
              ${formatCurrency(cashoutAmount)}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onBet}
            disabled={!canBet}
            className={`btn-action w-full rounded-lg py-2.5 text-sm font-bold uppercase tracking-[0.22em] ${
              !canBet ? "btn-action-disabled" : ""
            } ${flashClass}`}
          >
            Bet
          </button>
        )}
      </div>

      {!isActive && betAmount > balance && (
        <p className="text-ui-helper text-crimson-300 text-center">
          Insufficient balance
        </p>
      )}
    </div>
  );
}
