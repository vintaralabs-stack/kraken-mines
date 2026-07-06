"use client";

import { KrakenTileSymbol, SafeTileSymbol } from "./TileSymbol";
import type { TileRevealType } from "@/lib/types";

interface TileProps {
  index: number;
  isRevealed: boolean;
  revealType?: TileRevealType;
  disabled: boolean;
  roundActive: boolean;
  isJustRevealed: boolean;
  isHitTrap: boolean;
  onClick: (index: number) => void;
}

export default function Tile({
  index,
  isRevealed,
  revealType,
  disabled,
  roundActive,
  isJustRevealed,
  isHitTrap,
  onClick,
}: TileProps) {
  const handleClick = () => {
    if (!disabled && !isRevealed) {
      onClick(index);
    }
  };

  if (!isRevealed) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={`Hidden tile ${index + 1}`}
        className={`
          tile-closed relative overflow-hidden aspect-square w-full
          rounded-[10px] sm:rounded-xl
          min-h-[52px] sm:min-h-[64px] md:min-h-[72px]
          transition-all duration-200 ease-out
          disabled:cursor-default disabled:opacity-45
          ${roundActive ? "tile-closed-active cursor-pointer" : ""}
        `}
      >
        <span className="tile-wave-texture" aria-hidden />
      </button>
    );
  }

  const isTrap = revealType === "trap";
  const isTrapReveal = revealType === "trap-reveal";
  const isSafe = revealType === "safe";
  const chestAnimating = isSafe && isJustRevealed;
  const krakenHitAnimating = isHitTrap && isJustRevealed;

  let tileClass = "tile-trap-reveal";
  if (isSafe) tileClass = "tile-safe";
  else if (isHitTrap) tileClass = "tile-trap-hit";
  else if (isTrap) tileClass = "tile-trap";

  return (
    <div
      className={`
        ${tileClass} relative overflow-hidden
        aspect-square w-full rounded-[10px] sm:rounded-xl
        min-h-[52px] sm:min-h-[64px] md:min-h-[72px]
        flex items-center justify-center
        ${krakenHitAnimating ? "tile-shake-hit" : ""}
      `}
      aria-label={
        isSafe
          ? `Treasure at tile ${index + 1}`
          : `Kraken trap at tile ${index + 1}`
      }
    >
      {isSafe && (
        <div
          className={`tile-symbol-wrap tile-symbol-safe ${
            chestAnimating ? "chest-reveal-active" : "chest-reveal-settled"
          }`}
        >
          <SafeTileSymbol />
        </div>
      )}
      {(isTrap || isTrapReveal) && (
        <div
          className={`
            tile-symbol-wrap tile-symbol-trap
            ${isHitTrap ? "tile-symbol-trap-hit" : ""}
            ${isTrapReveal ? "tile-symbol-trap-dim" : ""}
            ${krakenHitAnimating ? "kraken-reveal-hit" : ""}
          `}
        >
          <KrakenTileSymbol dimmed={isTrapReveal} />
        </div>
      )}
    </div>
  );
}
