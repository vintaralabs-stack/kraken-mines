import {
  HOUSE_EDGE,
  TOTAL_TILES,
  type GameState,
  type RoundContext,
  type RoundPhase,
} from "./types";

/** Central RTP config — adjust house edge here for future tuning */
export const MINES_RTP = {
  houseEdge: HOUSE_EDGE,
} as const;

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
  safeRevealedCount: number,
  houseEdge: number = MINES_RTP.houseEdge
): number {
  if (safeRevealedCount === 0) return 1;

  const totalSafe = TOTAL_TILES - trapCount;
  let multiplier = houseEdge;

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
  return Math.round((betAmount * multiplier - betAmount) * 100) / 100;
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function deductBet(balance: number, betAmount: number): number {
  return roundMoney(balance - betAmount);
}

export function creditPayout(balance: number, payout: number): number {
  return roundMoney(balance + payout);
}

export function canAffordBet(balance: number, betAmount: number): boolean {
  return betAmount > 0 && betAmount <= balance;
}

export function canPlaceBet(phase: RoundPhase): boolean {
  return phase === "idle" || phase === "finished";
}

export function canRevealTiles(phase: RoundPhase): boolean {
  return phase === "active" || phase === "cashout-ready";
}

export function canCashOutRound(
  state: Pick<GameState, "phase" | "safeRevealedCount">,
  options?: { includeGambling?: boolean }
): boolean {
  if (state.safeRevealedCount < 1) return false;

  const allowedPhases: RoundPhase[] = ["active", "cashout-ready"];
  if (options?.includeGambling) {
    allowedPhases.push("gambling");
  }

  return allowedPhases.includes(state.phase);
}

export function phaseAfterSafeReveal(
  safeRevealedCount: number
): "active" | "cashout-ready" {
  return safeRevealedCount >= 1 ? "cashout-ready" : "active";
}

export function generateRoundId(): string {
  return `rnd-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function generateClientSeed(): string {
  return Math.random().toString(36).slice(2, 15);
}

/** Creates round metadata for demo play; backend can supply verified seeds later */
export function createRoundContext(nonce = 0): RoundContext {
  return {
    id: generateRoundId(),
    clientSeed: generateClientSeed(),
    nonce,
    startedAt: Date.now(),
  };
}

/**
 * CLIENT-SIDE RNG — replace with backend-provided trap positions
 * from a provably fair seed in production.
 */
export function generateTrapPositions(trapCount: number): number[] {
  const positions = Array.from({ length: TOTAL_TILES }, (_, i) => i);

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
