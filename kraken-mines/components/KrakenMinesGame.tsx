"use client";

import { useCallback, useRef, useState } from "react";
import GameControls from "./GameControls";
import GameStats from "./GameStats";
import GameHistory from "./GameHistory";
import MineGrid from "./MineGrid";
import MultiplierPath from "./MultiplierPath";
import SoundToggle from "./SoundToggle";
import KrakenWheel, {
  type GambleCollectPayload,
  type GambleLossPayload,
} from "./KrakenWheel";
import {
  calculateMultiplier,
  calculatePotentialCashout,
  calculateProfit,
  canAffordBet,
  canCashOutRound,
  canPlaceBet,
  canRevealTiles,
  createRoundContext,
  creditPayout,
  deductBet,
  formatCurrency,
  generateHistoryId,
  generateTrapPositions,
  phaseAfterSafeReveal,
} from "@/lib/gameLogic";
import { GAMBLE_UNLOCK_MULTIPLIER } from "@/lib/wheelLogic";
import { SOUND_EVENTS } from "@/lib/sounds";
import { useGameSounds } from "@/hooks/useGameSounds";
import {
  DEFAULT_BET,
  DEFAULT_TRAP_COUNT,
  INITIAL_BALANCE,
  resolveDisplayStatus,
  type GameState,
  type HistoryEntry,
} from "@/lib/types";

function createInitialState(): GameState {
  return {
    balance: INITIAL_BALANCE,
    betAmount: DEFAULT_BET,
    trapCount: DEFAULT_TRAP_COUNT,
    phase: "idle",
    outcome: null,
    round: null,
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
  const payoutLockRef = useRef(false);
  const pendingCashoutToastRef = useRef<number | null>(null);

  const displayStatus = resolveDisplayStatus(state.phase, state.outcome);
  const sounds = useGameSounds(soundMuted);

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

  const showCashoutToast = useCallback(
    (amount: number) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setCashoutToast(`CASHED OUT $${formatCurrency(amount)}`);
      toastTimerRef.current = setTimeout(
        () => setCashoutToast(null),
        CASHOUT_TOAST_MS
      );
    },
    []
  );

  const notifyCashout = useCallback(
    (amount: number) => {
      showCashoutToast(amount);
      sounds.play(SOUND_EVENTS.MINES_CASHOUT);
    },
    [showCashoutToast, sounds]
  );

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
      roundId: prev.round?.id,
      bet: prev.betAmount,
      trapCount: prev.trapCount,
      result,
      multiplier,
      profit,
      ...gamble,
    };
    return [entry, ...prev.gameHistory].slice(0, 10);
  };

  const handleBetChange = (value: number) => {
    setState((prev) => {
      if (!canPlaceBet(prev.phase)) return prev;
      return { ...prev, betAmount: value };
    });
  };

  const handleTrapChange = (value: number) => {
    setState((prev) => {
      if (!canPlaceBet(prev.phase)) return prev;
      return { ...prev, trapCount: value };
    });
  };

  const handleBet = () => {
    setState((prev) => {
      if (!canPlaceBet(prev.phase)) return prev;
      if (!canAffordBet(prev.balance, prev.betAmount)) return prev;

      const trapPositions = generateTrapPositions(prev.trapCount);
      const round = createRoundContext();

      return {
        ...prev,
        phase: "active",
        outcome: null,
        round,
        trapPositions,
        revealedTiles: [],
        safeRevealedCount: 0,
        currentMultiplier: 1,
        profit: 0,
        statusMessage: null,
        balance: deductBet(prev.balance, prev.betAmount),
      };
    });
    setHitTrapIndex(null);
    payoutLockRef.current = false;
  };

  const settleCashOut = useCallback(
    (options?: { fromGambleEntry?: boolean }) => {
      if (payoutLockRef.current) return;

      pendingCashoutToastRef.current = null;

      setState((prev) => {
        if (
          !canCashOutRound(prev, { includeGambling: options?.fromGambleEntry })
        ) {
          return prev;
        }
        if (prev.phase === "finished") return prev;

        const cashout = calculatePotentialCashout(
          prev.betAmount,
          prev.currentMultiplier
        );
        const profit = calculateProfit(prev.betAmount, prev.currentMultiplier);

        payoutLockRef.current = true;
        pendingCashoutToastRef.current = cashout;

        return {
          ...prev,
          phase: "finished",
          outcome: "won",
          balance: creditPayout(prev.balance, cashout),
          profit,
          statusMessage: "Escaped With Loot",
          gameHistory: addHistoryEntry(
            prev,
            "cashout",
            prev.currentMultiplier,
            profit
          ),
        };
      });

      if (pendingCashoutToastRef.current !== null) {
        triggerSuccessGlow();
        notifyCashout(pendingCashoutToastRef.current);
        pendingCashoutToastRef.current = null;
      }
    },
    [triggerSuccessGlow, notifyCashout]
  );

  const performCashOut = useCallback(
    (options?: { fromGambleEntry?: boolean }) => {
      settleCashOut(options);
    },
    [settleCashOut]
  );

  const handleTileClick = (index: number) => {
    if (wheelOpen || state.phase === "gambling") return;
    if (!canRevealTiles(state.phase)) return;

    const alreadyRevealed = state.revealedTiles.some((t) => t.index === index);
    if (alreadyRevealed) return;

    const isTrap = state.trapPositions.includes(index);

    if (!soundMuted) {
      sounds.unlock();
    }

    setState((prev) => {
      if (!canRevealTiles(prev.phase)) return prev;

      const already = prev.revealedTiles.some((t) => t.index === index);
      if (already) return prev;

      if (isTrap) {
        setHitTrapIndex(index);
        return {
          ...prev,
          phase: "finished",
          outcome: "lost",
          revealedTiles: [...prev.revealedTiles, { index, type: "trap" }],
          currentMultiplier: 0,
          profit: -prev.betAmount,
          statusMessage: "THE KRAKEN AWOKE",
          gameHistory: addHistoryEntry(prev, "kraken", 0, -prev.betAmount),
        };
      }

      const newSafeCount = prev.safeRevealedCount + 1;
      const newMultiplier = calculateMultiplier(prev.trapCount, newSafeCount);
      const newProfit = calculateProfit(prev.betAmount, newMultiplier);

      return {
        ...prev,
        phase: phaseAfterSafeReveal(newSafeCount),
        revealedTiles: [
          ...prev.revealedTiles,
          { index, type: "safe" as const },
        ],
        safeRevealedCount: newSafeCount,
        currentMultiplier: newMultiplier,
        profit: newProfit,
      };
    });

    triggerRevealAnim(index);
    sounds.play(
      isTrap ? SOUND_EVENTS.MINES_KRAKEN_HIT : SOUND_EVENTS.MINES_SAFE_REVEAL
    );
  };

  const handleCashOut = useCallback(() => {
    pendingCashoutToastRef.current = null;

    setState((prev) => {
      if (!canCashOutRound(prev)) return prev;
      if (prev.phase === "gambling" || prev.phase === "finished") return prev;

      if (prev.currentMultiplier >= GAMBLE_UNLOCK_MULTIPLIER) {
        setWheelCashoutAmount(
          calculatePotentialCashout(prev.betAmount, prev.currentMultiplier)
        );
        setWheelOpen(true);
        return { ...prev, phase: "gambling" };
      }

      if (payoutLockRef.current) return prev;

      const cashout = calculatePotentialCashout(
        prev.betAmount,
        prev.currentMultiplier
      );
      const profit = calculateProfit(prev.betAmount, prev.currentMultiplier);
      payoutLockRef.current = true;
      pendingCashoutToastRef.current = cashout;

      return {
        ...prev,
        phase: "finished",
        outcome: "won",
        balance: creditPayout(prev.balance, cashout),
        profit,
        statusMessage: "Escaped With Loot",
        gameHistory: addHistoryEntry(
          prev,
          "cashout",
          prev.currentMultiplier,
          profit
        ),
      };
    });

    if (pendingCashoutToastRef.current !== null) {
      triggerSuccessGlow();
      notifyCashout(pendingCashoutToastRef.current);
      pendingCashoutToastRef.current = null;
    }
  }, [triggerSuccessGlow, notifyCashout]);

  const handleWheelCollectNormal = () => {
    performCashOut({ fromGambleEntry: true });
    setWheelOpen(false);
  };

  const handleGambleCollect = (payload: GambleCollectPayload) => {
    if (payoutLockRef.current) return;

    payoutLockRef.current = true;
    triggerSuccessGlow();
    notifyCashout(payload.winAmount);

    setState((prev) => ({
      ...prev,
      phase: "finished",
      outcome: "won",
      balance: creditPayout(prev.balance, payload.winAmount),
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
      phase: "finished",
      outcome: "lost",
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

  const handleWheelClose = () => {
    setWheelOpen(false);
    setState((prev) => {
      if (prev.phase !== "gambling") return prev;
      return { ...prev, phase: "cashout-ready" };
    });
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
            onToggle={() => {
              setSoundMuted((muted) => {
                if (muted) {
                  sounds.unlock();
                }
                return !muted;
              });
            }}
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
              gameStatus={displayStatus}
            />
            <GameControls
              betAmount={state.betAmount}
              trapCount={state.trapCount}
              balance={state.balance}
              gameStatus={displayStatus}
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

          <section className="flex-1 flex flex-col items-center justify-center min-w-0 py-1 lg:py-0">
            <MineGrid
              gameStatus={displayStatus}
              revealedTiles={state.revealedTiles}
              trapPositions={state.trapPositions}
              lastRevealedIndex={lastRevealedIndex}
              hitTrapIndex={hitTrapIndex}
              onTileClick={handleTileClick}
              successGlow={successGlow}
              interactionLocked={wheelOpen || state.phase === "gambling"}
            />
            <MultiplierPath
              trapCount={state.trapCount}
              safeRevealedCount={state.safeRevealedCount}
              isRoundActive={displayStatus === "active"}
            />
          </section>
        </div>

        <GameHistory history={state.gameHistory} />
      </div>

      <KrakenWheel
        isOpen={wheelOpen}
        entryCashoutAmount={wheelCashoutAmount}
        betAmount={state.betAmount}
        sounds={sounds}
        onCollectNormal={handleWheelCollectNormal}
        onGambleCollect={handleGambleCollect}
        onGambleLoss={handleGambleLoss}
        onClose={handleWheelClose}
      />
    </div>
  );
}
