"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/gameLogic";
import {
  calculateGambleWinAmount,
  choiceLabel,
  getCountUpDuration,
  getRotationToSegment,
  getPayoutMultiplier,
  getWinLabel,
  isGambleWin,
  selectFinalSegment,
  WHEEL_LOSS_DISPLAY_MS,
  WHEEL_SPIN_MS,
  COUNT_UP_BASE_MS,
  type WheelChoice,
  type WheelColor,
  type WheelSegment,
  type WinLabel,
} from "@/lib/wheelLogic";
import WheelDisc from "./WheelDisc";

export interface GambleCollectPayload {
  winAmount: number;
  profit: number;
  choice: WheelChoice;
  landed: WheelColor;
  payoutMultiplier: number;
  statusMessage: WinLabel;
}

export interface GambleLossPayload {
  choice: WheelChoice;
  landed: WheelColor;
  profit: number;
}

interface KrakenWheelProps {
  isOpen: boolean;
  entryCashoutAmount: number;
  betAmount: number;
  onCollectNormal: () => void;
  onGambleCollect: (payload: GambleCollectPayload) => void;
  onGambleLoss: (payload: GambleLossPayload) => void;
  onClose: () => void;
}

type WheelView = "entry" | "wheel" | "spinning" | "win" | "loss";

export default function KrakenWheel({
  isOpen,
  entryCashoutAmount,
  betAmount,
  onCollectNormal,
  onGambleCollect,
  onGambleLoss,
  onClose,
}: KrakenWheelProps) {
  const [view, setView] = useState<WheelView>("entry");
  const [initialGambleAmount, setInitialGambleAmount] = useState(0);
  const [currentGambleAmount, setCurrentGambleAmount] = useState(0);
  const [selectedColor, setSelectedColor] = useState<WheelChoice | null>(null);
  const [landedColor, setLandedColor] = useState<WheelColor | null>(null);
  const [rotation, setRotation] = useState(0);
  const [winLabel, setWinLabel] = useState<WinLabel>("NICE WIN");
  const [winAmount, setWinAmount] = useState(0);
  const [displayAmount, setDisplayAmount] = useState(0);
  const [countUpDone, setCountUpDone] = useState(false);
  const [countUpPulsing, setCountUpPulsing] = useState(false);

  const rotationRef = useRef(0);
  const finalSegmentRef = useRef<WheelSegment | null>(null);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lossTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countUpFrameRef = useRef<number | null>(null);
  const countUpStartRef = useRef(0);
  const countUpDurationRef = useRef(COUNT_UP_BASE_MS);
  const lossHandledRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    if (lossTimerRef.current) clearTimeout(lossTimerRef.current);
    if (countUpFrameRef.current !== null) {
      cancelAnimationFrame(countUpFrameRef.current);
      countUpFrameRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    clearTimers();
    setView("entry");
    setInitialGambleAmount(0);
    setCurrentGambleAmount(0);
    setSelectedColor(null);
    setLandedColor(null);
    setRotation(0);
    rotationRef.current = 0;
    setWinLabel("NICE WIN");
    setWinAmount(0);
    setDisplayAmount(0);
    setCountUpDone(false);
    setCountUpPulsing(false);
    lossHandledRef.current = false;
    finalSegmentRef.current = null;
  }, [clearTimers]);

  useEffect(() => {
    if (!isOpen) resetState();
  }, [isOpen, resetState]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const startCountUp = useCallback(
    (finalAmount: number, initialAmount: number) => {
      const duration = getCountUpDuration(finalAmount, initialAmount);
      countUpDurationRef.current = duration;
      countUpStartRef.current = performance.now();
      setDisplayAmount(0);
      setCountUpDone(false);
      setCountUpPulsing(true);

      const tick = (now: number) => {
        const elapsed = now - countUpStartRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayAmount(Math.round(finalAmount * eased * 100) / 100);

        if (progress < 1) {
          countUpFrameRef.current = requestAnimationFrame(tick);
        } else {
          setDisplayAmount(finalAmount);
          setCountUpDone(true);
          setCountUpPulsing(false);
          countUpFrameRef.current = null;
        }
      };

      countUpFrameRef.current = requestAnimationFrame(tick);
    },
    []
  );

  const skipCountUp = useCallback(() => {
    if (countUpDone || view !== "win") return;
    if (countUpFrameRef.current !== null) {
      cancelAnimationFrame(countUpFrameRef.current);
      countUpFrameRef.current = null;
    }
    setDisplayAmount(winAmount);
    setCountUpDone(true);
    setCountUpPulsing(false);
  }, [countUpDone, view, winAmount]);

  const handleEnterGamble = () => {
    setInitialGambleAmount(entryCashoutAmount);
    setCurrentGambleAmount(entryCashoutAmount);
    setView("wheel");
  };

  const handleChoice = (choice: WheelChoice) => {
    if (view !== "wheel") return;

    // DEMO RNG — production replaces with backend-provided finalSegment
    // finalSegment is the single source of truth for visual landing and result logic.
    const finalSegment = selectFinalSegment();
    finalSegmentRef.current = finalSegment;

    const nextRotation = getRotationToSegment(
      rotationRef.current,
      finalSegment.index
    );
    rotationRef.current = nextRotation;

    setSelectedColor(choice);
    setLandedColor(null);
    setView("spinning");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRotation(nextRotation);
      });
    });

    spinTimerRef.current = setTimeout(() => {
      const seg = finalSegmentRef.current;
      if (!seg) return;

      const landed = seg.color;
      setLandedColor(landed);

      const won = isGambleWin(choice, landed);
      const payout = calculateGambleWinAmount(
        choice,
        landed,
        currentGambleAmount
      );

      if (!won) {
        setView("loss");
        lossHandledRef.current = false;

        lossTimerRef.current = setTimeout(() => {
          if (lossHandledRef.current) return;
          lossHandledRef.current = true;
          onGambleLoss({
            choice,
            landed,
            profit: -betAmount,
          });
          onClose();
        }, WHEEL_LOSS_DISPLAY_MS);
        return;
      }

      const label = getWinLabel(payout, initialGambleAmount, choice);
      setWinAmount(payout);
      setWinLabel(label);
      setView("win");
      startCountUp(payout, initialGambleAmount);
    }, WHEEL_SPIN_MS);
  };

  const handleGambleAgain = () => {
    clearTimers();
    setCurrentGambleAmount(winAmount);
    setSelectedColor(null);
    setLandedColor(null);
    setCountUpDone(false);
    setCountUpPulsing(false);
    setView("wheel");
  };

  const handleCollectWin = () => {
    if (!selectedColor || !landedColor) return;
    skipCountUp();

    onGambleCollect({
      winAmount,
      profit: winAmount - betAmount,
      choice: selectedColor,
      landed: landedColor,
      payoutMultiplier: getPayoutMultiplier(landedColor),
      statusMessage: winLabel,
    });
    onClose();
  };

  const handleCollectEntry = () => {
    onCollectNormal();
    onClose();
  };

  if (!isOpen) return null;

  const locked = view === "spinning" || view === "loss";
  const showWheel =
    view === "wheel" || view === "spinning" || view === "loss" || view === "win";

  return (
    <div
      className="wheel-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Kraken Wheel"
      onClick={view === "win" && !countUpDone ? skipCountUp : undefined}
    >
      <div
        className="wheel-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="wheel-title">KRAKEN WHEEL</h2>

        {view === "entry" && (
          <div className="wheel-entry">
            <p className="wheel-entry-amount stat-value">
              ${formatCurrency(entryCashoutAmount)}
            </p>
            <p className="wheel-entry-tagline">
              Collect your loot or gamble it
            </p>
            <div className="wheel-entry-actions">
              <button
                type="button"
                onClick={handleCollectEntry}
                className="btn-action w-full rounded-lg py-3 flex flex-col items-center gap-0.5"
              >
                <span className="text-ui-label uppercase tracking-[0.16em] font-semibold leading-none">
                  Collect
                </span>
                <span className="text-base font-bold stat-value leading-none text-ocean-950">
                  ${formatCurrency(entryCashoutAmount)}
                </span>
              </button>
              <button
                type="button"
                onClick={handleEnterGamble}
                className="btn-gamble w-full rounded-lg py-3 text-sm font-bold uppercase tracking-[0.2em]"
              >
                Gamble Loot
              </button>
            </div>
          </div>
        )}

        {showWheel && (
          <>
            {view !== "win" && (
              <p className="wheel-risk">
                Gambling{" "}
                <span className="stat-value text-gold-300">
                  ${formatCurrency(currentGambleAmount)}
                </span>
              </p>
            )}

            <div className="wheel-container">
              <div className="wheel-pointer" aria-hidden />
              <WheelDisc
                rotation={rotation}
                spinning={view === "spinning"}
                spinDurationMs={WHEEL_SPIN_MS}
              />
              <div className="wheel-center">
                <img
                  src="/assets/kraken.png"
                  alt=""
                  className="wheel-kraken-img"
                  draggable={false}
                />
              </div>
            </div>

            {(view === "loss" || view === "win") && landedColor && (
              <div className="wheel-landed-badge">
                Landed:{" "}
                <span className={`wheel-landed-${landedColor}`}>
                  {choiceLabel(landedColor).toUpperCase()}
                </span>
              </div>
            )}

            {view === "spinning" && selectedColor && (
              <p className="wheel-spinning-label">
                Spinning on {choiceLabel(selectedColor).toUpperCase()}…
              </p>
            )}

            {view === "loss" && (
              <div className="wheel-result wheel-result-loss">
                <p className="wheel-result-title">The Kraken Took Your Loot</p>
                <p className="wheel-result-amount stat-value">$0.00</p>
              </div>
            )}

            {view === "win" && (
              <div
                className={`wheel-win-panel ${countUpPulsing ? "wheel-win-pulse" : ""}`}
                onClick={!countUpDone ? skipCountUp : undefined}
                role={!countUpDone ? "button" : undefined}
                tabIndex={!countUpDone ? 0 : undefined}
                onKeyDown={(e) => {
                  if (!countUpDone && (e.key === "Enter" || e.key === " ")) {
                    skipCountUp();
                  }
                }}
              >
                <p
                  className={`wheel-win-label ${
                    winLabel === "MEGA WIN" ? "wheel-win-mega" : ""
                  }`}
                >
                  {winLabel}
                </p>
                <p className="wheel-win-amount stat-value">
                  ${formatCurrency(displayAmount)}
                </p>
                {!countUpDone && (
                  <p className="wheel-skip-hint">Tap to skip</p>
                )}
              </div>
            )}

            {view === "wheel" && (
              <div className="wheel-choices">
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => handleChoice("red")}
                  className="wheel-choice wheel-choice-red"
                >
                  Red 2x
                </button>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => handleChoice("green")}
                  className="wheel-choice wheel-choice-green"
                >
                  Green 15x
                </button>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => handleChoice("black")}
                  className="wheel-choice wheel-choice-black"
                >
                  Black 2x
                </button>
              </div>
            )}

            {view === "win" && countUpDone && (
              <div className="wheel-entry-actions">
                <button
                  type="button"
                  onClick={handleCollectWin}
                  className="btn-action w-full rounded-lg py-3 flex flex-col items-center gap-0.5"
                >
                  <span className="text-ui-label uppercase tracking-[0.16em] font-semibold leading-none">
                    Collect
                  </span>
                  <span className="text-base font-bold stat-value leading-none text-ocean-950">
                    ${formatCurrency(winAmount)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleGambleAgain}
                  className="btn-gamble w-full rounded-lg py-3 text-sm font-bold uppercase tracking-[0.2em]"
                >
                  Gamble Again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
