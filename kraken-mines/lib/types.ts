export const TOTAL_TILES = 25;
export const GRID_SIZE = 5;
export const INITIAL_BALANCE = 1000;
export const HOUSE_EDGE = 0.97;
export const MIN_TRAP_COUNT = 1;
export const MAX_TRAP_COUNT = 24;
export const DEFAULT_BET = 10;
export const DEFAULT_TRAP_COUNT = 3;

export type GameStatus = "idle" | "active" | "won" | "lost";

export type TileRevealType = "safe" | "trap" | "trap-reveal";

export interface RevealedTile {
  index: number;
  type: TileRevealType;
}

export type HistoryResult = "cashout" | "kraken" | "gamble-win" | "gamble-loss";

export type GambleChoice = "red" | "black" | "green";

export interface HistoryEntry {
  id: string;
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
  gameStatus: GameStatus;
  trapPositions: number[];
  revealedTiles: RevealedTile[];
  safeRevealedCount: number;
  currentMultiplier: number;
  profit: number;
  gameHistory: HistoryEntry[];
  statusMessage: string | null;
}
