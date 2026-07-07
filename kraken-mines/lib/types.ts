export const TOTAL_TILES = 25;
export const GRID_SIZE = 5;
export const INITIAL_BALANCE = 1000;
export const HOUSE_EDGE = 0.96;
export const MIN_TRAP_COUNT = 1;
export const MAX_TRAP_COUNT = 24;
export const DEFAULT_BET = 10;
export const DEFAULT_TRAP_COUNT = 3;

/** UI-facing status — derived from round phase for child components */
export type GameStatus = "idle" | "active" | "won" | "lost";

/** Internal round lifecycle */
export type RoundPhase =
  | "idle"
  | "active"
  | "cashout-ready"
  | "gambling"
  | "finished";

export type RoundOutcome = "won" | "lost";

/**
 * Per-round metadata for client demo play.
 * Backend provably-fair flow can attach serverSeedHash and verify trap/wheel outcomes.
 */
export interface RoundContext {
  id: string;
  clientSeed: string;
  nonce: number;
  startedAt: number;
  /** Reserved: HMAC/server seed commitment from backend */
  serverSeedHash?: string;
}

export type TileRevealType = "safe" | "trap" | "trap-reveal";

export interface RevealedTile {
  index: number;
  type: TileRevealType;
}

export type HistoryResult = "cashout" | "kraken" | "gamble-win" | "gamble-loss";

export type GambleChoice = "red" | "black" | "green";

export interface HistoryEntry {
  id: string;
  roundId?: string;
  bet: number;
  trapCount: number;
  result: HistoryResult;
  multiplier: number;
  profit: number;
  gambleChoice?: GambleChoice;
  gambleLanded?: GambleChoice;
  gamblePayoutMult?: number;
}

export interface GameState {
  balance: number;
  betAmount: number;
  trapCount: number;
  phase: RoundPhase;
  outcome: RoundOutcome | null;
  round: RoundContext | null;
  trapPositions: number[];
  revealedTiles: RevealedTile[];
  safeRevealedCount: number;
  currentMultiplier: number;
  profit: number;
  gameHistory: HistoryEntry[];
  statusMessage: string | null;
}

/** Map internal phase to legacy GameStatus expected by presentational components */
export function resolveDisplayStatus(
  phase: RoundPhase,
  outcome: RoundOutcome | null
): GameStatus {
  if (phase === "finished") {
    return outcome === "won" ? "won" : "lost";
  }
  if (phase === "idle") return "idle";
  return "active";
}
