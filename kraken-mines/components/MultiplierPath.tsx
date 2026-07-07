"use client";

import { useMemo } from "react";
import { calculateMultiplier, formatMultiplier } from "@/lib/gameLogic";
import { TOTAL_TILES } from "@/lib/types";

const VISIBLE_WINDOW = 7;

interface MultiplierPathProps {
  trapCount: number;
  safeRevealedCount: number;
  isRoundActive: boolean;
}

type StepState = "completed" | "current" | "future";

function getStepState(
  step: number,
  safeRevealedCount: number,
  isRoundActive: boolean
): StepState {
  if (step <= safeRevealedCount) return "completed";
  if (isRoundActive && step === safeRevealedCount + 1) return "current";
  return "future";
}

function getVisibleRange(
  safeRevealedCount: number,
  maxSafe: number,
  windowSize: number,
  isRoundActive: boolean
): { start: number; end: number } {
  if (maxSafe <= windowSize) {
    return { start: 1, end: maxSafe };
  }

  const anchor = isRoundActive
    ? Math.min(safeRevealedCount + 1, maxSafe)
    : 1;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, anchor - half);
  let end = Math.min(maxSafe, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  return { start, end };
}

export default function MultiplierPath({
  trapCount,
  safeRevealedCount,
  isRoundActive,
}: MultiplierPathProps) {
  const maxSafe = TOTAL_TILES - trapCount;

  const steps = useMemo(() => {
    return Array.from({ length: maxSafe }, (_, i) => {
      const step = i + 1;
      return {
        step,
        multiplier: calculateMultiplier(trapCount, step),
        state: getStepState(step, safeRevealedCount, isRoundActive),
      };
    });
  }, [trapCount, maxSafe, safeRevealedCount, isRoundActive]);

  const { start, end } = getVisibleRange(
    safeRevealedCount,
    maxSafe,
    VISIBLE_WINDOW,
    isRoundActive
  );
  const visibleSteps = steps.slice(start - 1, end);
  const showLeadingEllipsis = start > 1;
  const showTrailingEllipsis = end < maxSafe;

  if (maxSafe === 0) return null;

  return (
    <div className="multiplier-path w-full max-w-[580px] mx-auto mt-2.5 px-1">
      <p className="text-ui-label text-center mb-1.5 tracking-[0.14em]">
        Multiplier Path
      </p>
      <div className="multiplier-path-track flex items-stretch gap-1 justify-center">
        {showLeadingEllipsis && (
          <span className="multiplier-path-ellipsis" aria-hidden>
            …
          </span>
        )}
        {visibleSteps.map(({ step, multiplier, state }) => (
          <div
            key={step}
            className={`multiplier-path-step multiplier-path-step-${state}`}
            aria-current={state === "current" ? "step" : undefined}
            title={`Treasure ${step}: ${formatMultiplier(multiplier)}`}
          >
            {state === "completed" && (
              <svg
                className="multiplier-path-check"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span className="multiplier-path-value stat-value">
              {formatMultiplier(multiplier)}
            </span>
          </div>
        ))}
        {showTrailingEllipsis && (
          <span className="multiplier-path-ellipsis" aria-hidden>
            …
          </span>
        )}
      </div>
    </div>
  );
}
