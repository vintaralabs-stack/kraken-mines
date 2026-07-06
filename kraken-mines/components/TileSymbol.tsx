"use client";

import { useState } from "react";
import { SafeChest, KrakenEmblem } from "./icons";

export const CHEST_ASSET = "/assets/chest.png";
export const KRAKEN_ASSET = "/assets/kraken.png";

interface SafeTileSymbolProps {
  animClass?: string;
}

export function SafeTileSymbol({ animClass = "" }: SafeTileSymbolProps) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return (
      <SafeChest className={`tile-icon ${animClass}`} />
    );
  }

  return (
    <img
      src={CHEST_ASSET}
      alt=""
      aria-hidden
      draggable={false}
      width={1254}
      height={1254}
      decoding="async"
      className="tile-asset tile-asset-safe"
      onError={() => setUseFallback(true)}
    />
  );
}

interface KrakenTileSymbolProps {
  dimmed?: boolean;
  animClass?: string;
}

export function KrakenTileSymbol({
  dimmed = false,
  animClass = "",
}: KrakenTileSymbolProps) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return (
      <KrakenEmblem
        dimmed={dimmed}
        className={`tile-icon ${animClass}`}
      />
    );
  }

  return (
    <img
      src={KRAKEN_ASSET}
      alt=""
      aria-hidden
      draggable={false}
      width={1254}
      height={1254}
      decoding="async"
      className={`tile-asset tile-asset-kraken ${dimmed ? "tile-asset-dim" : ""}`}
      onError={() => setUseFallback(true)}
    />
  );
}
