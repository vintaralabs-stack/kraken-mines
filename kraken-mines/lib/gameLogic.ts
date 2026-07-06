import { HOUSE_EDGE, TOTAL_TILES } from "./types";

/**
 * Demo multiplier formula with ~3% house edge.
 *
 * REAL-MONEY CASINO NOTE:
 * Production use requires verified math, backend validation, secure RNG,
 * and a provably fair system. Replace this client-side logic with
 * server-authoritative round generation and payout verification.
 */
export function calculateMultiplier(
  trapCount: number,
  safeRevealedCount: number
): number {
  if (safeRevealedCount === 0) return 1;

  const totalSafe = TOTAL_TILES - trapCount;
  let multiplier = HOUSE_EDGE;

  for (let i = 0; i < safeRevealedCount; i++) {
    const remainingTiles = TOTAL_TILES - i;
    const remainingSafe = totalSafe - i;
    multiplier *= remainingTiles / remainingSafe;
  }

  return Math.round(multiplier * 100) / 100;
}

export function calculatePotentialCashout(
  betAmount: number,
  multiplier: number
): number {
  return Math.round(betAmount * multiplier * 100) / 100;
}

export function calculateProfit(
  betAmount: number,
  multiplier: number
): number {
  return (
    Math.round((betAmount * multiplier - betAmount) * 100) / 100
  );
}

/**
 * CLIENT-SIDE RNG — replace with backend-provided trap positions
 * from a provably fair seed in production.
 */
export function generateTrapPositions(
  trapCount: number
): number[] {
  const positions = Array.from({ length: TOTAL_TILES }, (_, i) => i);

  // Fisher-Yates shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  return positions.slice(0, trapCount).sort((a, b) => a - b);
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(2)}×`;
}

export function generateHistoryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
