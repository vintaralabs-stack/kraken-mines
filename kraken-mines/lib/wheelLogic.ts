export type WheelColor = "red" | "black" | "green";
export type WheelChoice = WheelColor;

export const GAMBLE_UNLOCK_MULTIPLIER = 6;
export const WHEEL_SEGMENT_COUNT = 100;
export const WHEEL_SPIN_MS = 3500;
export const WHEEL_LOSS_DISPLAY_MS = 2000;
export const MEGA_WIN_RATIO = 18;
export const COUNT_UP_BASE_MS = 3000;
export const COUNT_UP_MAX_MS = 4500;

export const SEGMENT_ANGLE = 360 / WHEEL_SEGMENT_COUNT;

/** Wheel payout multipliers — separate from Mines RTP */
export const WHEEL_PAYOUTS = {
  red: 2.05,
  black: 2.05,
  green: 16,
} as const;

/** Segment fills — black is dark but visible, not a transparent gap */
export const WHEEL_SEGMENT_COLORS: Record<WheelColor, string> = {
  red: "#c41e3a",
  black: "#252532",
  green: "#1a9e4a",
};

/** Classic high-volatility wheel distribution (must sum to WHEEL_SEGMENT_COUNT) */
export const WHEEL_SEGMENT_COUNTS = {
  red: 47,
  black: 47,
  green: 6,
} as const;

/** Evenly space `slotCount` green slices around the wheel */
function computeEvenlySpacedIndexes(
  slotCount: number,
  total: number
): number[] {
  return Array.from({ length: slotCount }, (_, i) =>
    Math.floor((i * total) / slotCount)
  );
}

function buildWheelSegments(): WheelColor[] {
  const { red, black, green } = WHEEL_SEGMENT_COUNTS;

  if (red + black + green !== WHEEL_SEGMENT_COUNT) {
    throw new Error("Wheel segment counts must sum to WHEEL_SEGMENT_COUNT");
  }

  const segments: WheelColor[] = new Array(WHEEL_SEGMENT_COUNT);
  const greenIndexes = new Set(
    computeEvenlySpacedIndexes(green, WHEEL_SEGMENT_COUNT)
  );

  for (const idx of greenIndexes) {
    segments[idx] = "green";
  }

  let useRed = true;
  for (let i = 0; i < WHEEL_SEGMENT_COUNT; i++) {
    if (greenIndexes.has(i)) continue;
    segments[i] = useRed ? "red" : "black";
    useRed = !useRed;
  }

  return segments;
}

/** Fixed 100-segment roulette layout: 47 red, 47 black, 6 green — one array for render + logic */
export const WHEEL_SEGMENTS: WheelColor[] = buildWheelSegments();

export interface WheelSegment {
  index: number;
  color: WheelColor;
}

/**
 * Deterministic gamble result derived only from finalSegment + player choice.
 * finalSegment is the single source of truth for visual landing and result logic.
 */
export interface GambleOutcome {
  finalSegment: WheelSegment;
  landedColor: WheelColor;
  won: boolean;
  payout: number;
  payoutMultiplier: number;
}

/**
 * DEMO RNG — production must use backend-authoritative,
 * provably fair wheel outcome verification.
 *
 * finalSegment is the single source of truth for visual landing and result logic.
 */
export function selectFinalSegment(): WheelSegment {
  const index = Math.floor(Math.random() * WHEEL_SEGMENT_COUNT);
  return {
    index,
    color: WHEEL_SEGMENTS[index],
  };
}

/**
 * Resolves win/loss and payout from the chosen segment — no separate color inference.
 */
export function resolveGambleOutcome(
  finalSegment: WheelSegment,
  selectedColor: WheelChoice,
  gambleAmount: number
): GambleOutcome {
  const landedColor = finalSegment.color;
  const won = selectedColor === landedColor;
  const payout = won
    ? calculateGambleWinAmountForLanded(gambleAmount, landedColor)
    : 0;
  const payoutMultiplier = won ? getPayoutMultiplier(landedColor) : 0;

  return {
    finalSegment,
    landedColor,
    won,
    payout,
    payoutMultiplier,
  };
}

export function getSegmentCenterAngle(segmentIndex: number): number {
  return segmentIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
}

/**
 * Rotate wheel clockwise so finalSegment center sits under the fixed top pointer.
 */
export function getRotationToSegment(
  currentRotation: number,
  segmentIndex: number,
  fullSpins = 5
): number {
  const centerAngle = getSegmentCenterAngle(segmentIndex);
  const targetMod = (360 - centerAngle) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  const delta = (targetMod - currentMod + 360) % 360;
  return currentRotation + fullSpins * 360 + delta;
}

export function isGambleWin(
  selectedColor: WheelChoice,
  landedColor: WheelColor
): boolean {
  return selectedColor === landedColor;
}

export function calculateGambleWinAmount(
  selectedColor: WheelChoice,
  landedColor: WheelColor,
  gambleAmount: number
): number {
  if (!isGambleWin(selectedColor, landedColor)) return 0;
  return calculateGambleWinAmountForLanded(gambleAmount, landedColor);
}

function calculateGambleWinAmountForLanded(
  gambleAmount: number,
  landedColor: WheelColor
): number {
  const mult =
    landedColor === "green" ? WHEEL_PAYOUTS.green : WHEEL_PAYOUTS.red;

  return Math.round(gambleAmount * mult * 100) / 100;
}

export function getPayoutMultiplier(landedColor: WheelColor): number {
  return landedColor === "green" ? WHEEL_PAYOUTS.green : WHEEL_PAYOUTS.red;
}

export type WinLabel = "NICE WIN" | "EPIC WIN" | "MEGA WIN";

export function getWinLabel(
  winAmount: number,
  initialGambleAmount: number,
  selectedColor: WheelChoice
): WinLabel {
  if (
    initialGambleAmount > 0 &&
    winAmount / initialGambleAmount >= MEGA_WIN_RATIO
  ) {
    return "MEGA WIN";
  }
  if (selectedColor === "green") return "EPIC WIN";
  return "NICE WIN";
}

export function getCountUpDuration(
  winAmount: number,
  initialGambleAmount: number
): number {
  const ratio = initialGambleAmount > 0 ? winAmount / initialGambleAmount : 1;
  if (ratio <= 2) return COUNT_UP_BASE_MS;
  if (ratio <= 15) return 3500;
  return COUNT_UP_MAX_MS;
}

export function choiceLabel(choice: WheelChoice): string {
  return choice.charAt(0).toUpperCase() + choice.slice(1);
}
