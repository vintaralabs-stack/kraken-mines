"use client";

import { useCallback, useRef, useState } from "react";
import GameControls from "./GameControls";
import GameStats from "./GameStats";
import GameHistory from "./GameHistory";
import MineGrid from "./MineGrid";
import SoundToggle from "./SoundToggle";
import KrakenWheel, {
  type GambleCollectPayload,
  type GambleLossPayload,
} from "./KrakenWheel";
import {
  calculateMultiplier,
  calculatePotentialCashout,
  calculateProfit,
  formatCurrency,
  generateHistoryId,
  generateTrapPositions,
} from "@/lib/gameLogic";
import { GAMBLE_UNLOCK_MULTIPLIER } from "@/lib/wheelLogic";
import {
  DEFAULT_BET,
  DEFAULT_TRAP_COUNT,
  INITIAL_BALANCE,
  type GameState,
  type HistoryEntry,
  type RevealedTile,
} from "@/lib/types";

function createInitialState(): GameState {
  return {
    balance: INITIAL_BALANCE,
    betAmount: DEFAULT_BET,
    trapCount: DEFAULT_TRAP_COUNT,
    gameStatus: "idle",
    trapPositions: [],
    revealedTiles: [],
    safeRevealedCount: 0,
    currentMultiplier: 1,
    profit: 0,
    gameHistory: [],
    statusMessage: null,
  };
}

const REVEAL_ANIM_MS = 300;
const SUCCESS_GLOW_MS = 700;
const CASHOUT_TOAST_MS = 1500;

export default function KrakenMinesGame() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [successGlow, setSuccessGlow] = useState(false);
  const [lastRevealedIndex, setLastRevealedIndex] = useState<number | null>(
    null
  );
  const [hitTrapIndex, setHitTrapIndex] = useState<number | null>(null);
  const [cashoutToast, setCashoutToast] = useState<string | null>(null);
  const [soundMuted, setSoundMuted] = useState(true);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [wheelCashoutAmount, setWheelCashoutAmount] = useState(0);

  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerRevealAnim = useCallback((index: number) => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    setLastRevealedIndex(index);
    revealTimerRef.current = setTimeout(() => {
      setLastRevealedIndex(null);
    }, REVEAL_ANIM_MS);
  }, []);

  const triggerSuccessGlow = useCallback(() => {
    if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    setSuccessGlow(true);
    glowTimerRef.current = setTimeout(
      () => setSuccessGlow(false),
      SUCCESS_GLOW_MS
    );
  }, []);

  const showCashoutToast = useCallback((amount: number) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setCashoutToast(`CASHED OUT $${formatCurrency(amount)}`);
    toastTimerRef.current = setTimeout(
      () => setCashoutToast(null),
      CASHOUT_TOAST_MS
    );
  }, []);

  const handleBetChange = (value: number) => {
    setState((prev) => ({
      ...prev,
      betAmount: value,
    }));
  };

  const handleTrapChange = (value: number) => {
    setState((prev) => ({
      ...prev,
      trapCount: value,
    }));
  };

  const handleBet = () => {
    if (state.gameStatus === "active") return;
    if (state.betAmount <= 0 || state.betAmount > state.balance) return;

    setHitTrapIndex(null);

    const trapPositions = generateTrapPositions(state.trapCount);

    setState((prev) => ({
      ...prev,
      gameStatus: "active",
      trapPositions,
      revealedTiles: [],
      safeRevealedCount: 0,
      currentMultiplier: 1,
      profit: 0,
      statusMessage: null,
      balance: prev.balance - prev.betAmount,
    }));
  };

  const addHistoryEntry = (
    prev: GameState,
    result: HistoryEntry["result"],
    multiplier: number,
    profit: number,
    gamble?: Pick<
      HistoryEntry,
      "gambleChoice" | "gambleLanded" | "gamblePayoutMult"
    >
  ): HistoryEntry[] => {
    const entry: HistoryEntry = {
      id: generateHistoryId(),
      bet: prev.betAmount,
      trapCount: prev.trapCount,
      result,
      multiplier,
      profit,
      ...gamble,
    };
    return [entry, ...prev.gameHistory].slice(0, 10);
  };

  const performCashOut = () => {
    const cashout = calculatePotentialCashout(
      state.betAmount,
      state.currentMultiplier
    );
    const profit = calculateProfit(state.betAmount, state.currentMultiplier);

    triggerSuccessGlow();
    showCashoutToast(cashout);

    setState((prev) => ({
      ...prev,
      gameStatus: "won",
      balance: prev.balance + cashout,
      profit,
      statusMessage: "Escaped With Loot",
      gameHistory: addHistoryEntry(
        prev,
        "cashout",
        prev.currentMultiplier,
        profit
      ),
    }));
  };

  const handleTileClick = (index: number) => {
    if (wheelOpen) return;
    if (state.gameStatus !== "active") return;

    const alreadyRevealed = state.revealedTiles.some((t) => t.index === index);
    if (alreadyRevealed) return;

    const isTrap = state.trapPositions.includes(index);

    triggerRevealAnim(index);

    if (isTrap) {
      const hitTile: RevealedTile = {
        index,
        type: "trap",
      };

      setHitTrapIndex(index);

      setState((prev) => ({
        ...prev,
        gameStatus: "lost",
        revealedTiles: [...prev.revealedTiles, hitTile],
        currentMultiplier: 0,
        profit: -prev.betAmount,
        statusMessage: "THE KRAKEN AWOKE",
        gameHistory: addHistoryEntry(prev, "kraken", 0, -prev.betAmount),
      }));
      return;
    }

    const newSafeCount = state.safeRevealedCount + 1;
    const newMultiplier = calculateMultiplier(state.trapCount, newSafeCount);
    const newProfit = calculateProfit(state.betAmount, newMultiplier);

    const safeTile: RevealedTile = {
      index,
      type: "safe",
    };

    setState((prev) => ({
      ...prev,
      revealedTiles: [...prev.revealedTiles, safeTile],
      safeRevealedCount: newSafeCount,
      currentMultiplier: newMultiplier,
      profit: newProfit,
    }));
  };

  const handleCashOut = () => {
    if (state.gameStatus !== "active") return;
    if (state.safeRevealedCount < 1) return;

    if (state.currentMultiplier >= GAMBLE_UNLOCK_MULTIPLIER) {
      setWheelCashoutAmount(
        calculatePotentialCashout(state.betAmount, state.currentMultiplier)
      );
      setWheelOpen(true);
      return;
    }

    performCashOut();
  };

  const handleWheelCollectNormal = () => {
    performCashOut();
  };

  const handleGambleCollect = (payload: GambleCollectPayload) => {
    triggerSuccessGlow();
    showCashoutToast(payload.winAmount);

    setState((prev) => ({
      ...prev,
      gameStatus: "won",
      balance: prev.balance + payload.winAmount,
      profit: payload.profit,
      statusMessage: payload.statusMessage,
      gameHistory: addHistoryEntry(
        prev,
        "gamble-win",
        prev.currentMultiplier,
        payload.profit,
        {
          gambleChoice: payload.choice,
          gambleLanded: payload.landed,
          gamblePayoutMult: payload.payoutMultiplier,
        }
      ),
    }));
  };

  const handleGambleLoss = (payload: GambleLossPayload) => {
    setState((prev) => ({
      ...prev,
      gameStatus: "lost",
      currentMultiplier: 0,
      profit: payload.profit,
      statusMessage: "THE KRAKEN TOOK YOUR LOOT",
      gameHistory: addHistoryEntry(
        prev,
        "gamble-loss",
        prev.currentMultiplier,
        payload.profit,
        {
          gambleChoice: payload.choice,
          gambleLanded: payload.landed,
          gamblePayoutMult: 0,
        }
      ),
    }));
  };

  const cashoutAmount = calculatePotentialCashout(
    state.betAmount,
    state.currentMultiplier
  );

  return (
    <div className="w-full max-w-6xl flex flex-col">
      <header className="text-center mb-3 shrink-0">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gold-300 tracking-wide leading-tight">
          Kraken Mines
        </h1>
      </header>

      <div
        className={`game-cabinet rounded-2xl overflow-hidden flex flex-col relative ${
          successGlow ? "cashout-flash" : ""
        }`}
      >
        <div className="absolute top-2.5 right-2.5 z-20">
          <SoundToggle
            muted={soundMuted}
            onToggle={() => setSoundMuted((m) => !m)}
          />
        </div>

        {cashoutToast && (
          <div className="cashout-toast" role="status" aria-live="polite">
            {cashoutToast}
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5 p-3 sm:p-4">
          <aside className="w-full lg:w-[272px] shrink-0 flex flex-col gap-3">
            <GameStats
              balance={state.balance}
              currentMultiplier={state.currentMultiplier}
              profit={state.profit}
              safeRevealedCount={state.safeRevealedCount}
              gameStatus={state.gameStatus}
            />
            <GameControls
              betAmount={state.betAmount}
              trapCount={state.trapCount}
              balance={state.balance}
              gameStatus={state.gameStatus}
              safeRevealedCount={state.safeRevealedCount}
              cashoutAmount={cashoutAmount}
              statusMessage={state.statusMessage}
              successGlow={successGlow}
              onBetChange={handleBetChange}
              onTrapChange={handleTrapChange}
              onBet={handleBet}
              onCashOut={handleCashOut}
            />
          </aside>

          <section className="flex-1 flex items-center justify-center min-w-0 py-1 lg:py-0">
            <MineGrid
              gameStatus={state.gameStatus}
              revealedTiles={state.revealedTiles}
              trapPositions={state.trapPositions}
              lastRevealedIndex={lastRevealedIndex}
              hitTrapIndex={hitTrapIndex}
              onTileClick={handleTileClick}
              successGlow={successGlow}
              interactionLocked={wheelOpen}
            />
          </section>
        </div>

        <GameHistory history={state.gameHistory} />
      </div>

      <KrakenWheel
        isOpen={wheelOpen}
        entryCashoutAmount={wheelCashoutAmount}
        betAmount={state.betAmount}
        onCollectNormal={handleWheelCollectNormal}
        onGambleCollect={handleGambleCollect}
        onGambleLoss={handleGambleLoss}
        onClose={() => setWheelOpen(false)}
      />
    </div>
  );
}
