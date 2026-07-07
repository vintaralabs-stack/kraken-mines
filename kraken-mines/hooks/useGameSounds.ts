"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  getSoundManager,
  type GameSoundApi,
  type SoundEvent,
} from "@/lib/sounds";

export function useGameSounds(muted: boolean): GameSoundApi {
  const manager = useMemo(() => getSoundManager(), []);

  useEffect(() => {
    manager.setMuted(muted);
  }, [manager, muted]);

  const unlock = useCallback(() => {
    manager.unlock();
  }, [manager]);

  const play = useCallback(
    (event: SoundEvent) => {
      void manager.play(event);
    },
    [manager]
  );

  const startWheelTicks = useCallback(
    (durationMs: number) => {
      manager.startWheelTicks(durationMs);
    },
    [manager]
  );

  const stopWheelTicks = useCallback(() => {
    manager.stopWheelTicks();
  }, [manager]);

  return useMemo(
    () => ({
      play,
      unlock,
      startWheelTicks,
      stopWheelTicks,
    }),
    [play, unlock, startWheelTicks, stopWheelTicks]
  );
}
