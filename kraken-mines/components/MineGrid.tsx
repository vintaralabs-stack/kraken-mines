"use client";

import Tile from "./Tile";
import { GRID_SIZE, TOTAL_TILES } from "@/lib/types";
import type { GameStatus, RevealedTile } from "@/lib/types";

interface MineGridProps {
  gameStatus: GameStatus;
  revealedTiles: RevealedTile[];
  trapPositions: number[];
  lastRevealedIndex: number | null;
  hitTrapIndex: number | null;
  onTileClick: (index: number) => void;
  successGlow?: boolean;
  interactionLocked?: boolean;
}

export default function MineGrid({
  gameStatus,
  revealedTiles,
  trapPositions,
  lastRevealedIndex,
  hitTrapIndex,
  onTileClick,
  successGlow = false,
  interactionLocked = false,
}: MineGridProps) {
  const revealedMap = new Map(revealedTiles.map((t) => [t.index, t]));
  const isRoundEnded = gameStatus === "won" || gameStatus === "lost";
  const roundActive = gameStatus === "active";

  const getTileState = (index: number) => {
    const revealed = revealedMap.get(index);
    if (revealed) {
      return {
        isRevealed: true,
        revealType: revealed.type,
      };
    }

    if (isRoundEnded && trapPositions.includes(index)) {
      return {
        isRevealed: true,
        revealType: "trap-reveal" as const,
      };
    }

    return { isRevealed: false };
  };

  const tilesDisabled = !roundActive || interactionLocked;

  return (
    <div
      className={`
        w-full max-w-[580px] mx-auto relative
        ${successGlow ? "cashout-grid-flash rounded-xl" : ""}
      `}
    >
      <div
        className="grid gap-2.5 sm:gap-3 p-3.5 sm:p-4 grid-frame rounded-xl"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
        }}
        role="grid"
        aria-label="5 by 5 ocean map grid"
      >
        {Array.from({ length: TOTAL_TILES }, (_, index) => {
          const tileState = getTileState(index);
          return (
            <Tile
              key={index}
              index={index}
              isRevealed={tileState.isRevealed}
              revealType={tileState.revealType}
              disabled={tilesDisabled || tileState.isRevealed}
              roundActive={roundActive}
              isJustRevealed={lastRevealedIndex === index}
              isHitTrap={hitTrapIndex === index}
              onClick={onTileClick}
            />
          );
        })}
      </div>
    </div>
  );
}
