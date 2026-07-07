/**
 * Centralized sound events and asset paths for Kraken Mines.
 * Replace placeholder files under /public/assets/sounds/ with premium assets.
 */

export const SOUND_EVENTS = {
  MINES_SAFE_REVEAL: "mines.safeReveal",
  MINES_KRAKEN_HIT: "mines.krakenHit",
  MINES_CASHOUT: "mines.cashout",
  WHEEL_SPIN_START: "wheel.spinStart",
  WHEEL_TICK: "wheel.tick",
  WHEEL_GAMBLE_WIN: "wheel.gambleWin",
  WHEEL_GREEN_JACKPOT: "wheel.greenJackpot",
  WHEEL_GAMBLE_LOSS: "wheel.gambleLoss",
} as const;

export type SoundEvent = (typeof SOUND_EVENTS)[keyof typeof SOUND_EVENTS];

/** Placeholder paths — drop matching .mp3 or .ogg files here when assets are ready */
export const SOUND_PATHS: Record<SoundEvent, string> = {
  [SOUND_EVENTS.MINES_SAFE_REVEAL]: "/assets/sounds/mines-safe-reveal.mp3",
  [SOUND_EVENTS.MINES_KRAKEN_HIT]: "/assets/sounds/mines-kraken-hit.mp3",
  [SOUND_EVENTS.MINES_CASHOUT]: "/assets/sounds/mines-cashout.mp3",
  [SOUND_EVENTS.WHEEL_SPIN_START]: "/assets/sounds/wheel-spin-start.mp3",
  [SOUND_EVENTS.WHEEL_TICK]: "/assets/sounds/wheel-tick.mp3",
  [SOUND_EVENTS.WHEEL_GAMBLE_WIN]: "/assets/sounds/wheel-gamble-win.mp3",
  [SOUND_EVENTS.WHEEL_GREEN_JACKPOT]: "/assets/sounds/wheel-green-jackpot.mp3",
  [SOUND_EVENTS.WHEEL_GAMBLE_LOSS]: "/assets/sounds/wheel-gamble-loss.mp3",
};

export interface GameSoundApi {
  play: (event: SoundEvent) => void;
  startWheelTicks: (durationMs: number) => void;
  stopWheelTicks: () => void;
  unlock: () => void;
}

const WHEEL_TICK_INTERVAL_MS = 220;

class SoundManager implements GameSoundApi {
  private muted = true;
  private unlocked = false;
  private readonly cache = new Map<SoundEvent, HTMLAudioElement>();
  private readonly unavailable = new Set<SoundEvent>();
  private wheelTickTimer: ReturnType<typeof setInterval> | null = null;
  private wheelTickStopTimer: ReturnType<typeof setTimeout> | null = null;

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopWheelTicks();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Call after a user gesture to satisfy browser autoplay policies */
  unlock(): void {
    if (typeof window === "undefined" || this.unlocked) return;

    const silent = new Audio();
    silent.volume = 0.001;
    silent
      .play()
      .then(() => {
        silent.pause();
        this.unlocked = true;
      })
      .catch(() => {
        // Gesture may still unlock on first real play attempt
      });
  }

  async play(event: SoundEvent): Promise<void> {
    if (typeof window === "undefined" || this.muted) return;
    if (this.unavailable.has(event)) return;

    const audio = this.getOrCreateAudio(event);
    if (!audio) return;

    try {
      audio.currentTime = 0;
      await audio.play();
      this.unlocked = true;
    } catch {
      // Missing asset or autoplay blocked — fail silently
    }
  }

  startWheelTicks(durationMs: number): void {
    if (typeof window === "undefined" || this.muted) return;

    this.stopWheelTicks();

    const tick = () => {
      void this.play(SOUND_EVENTS.WHEEL_TICK);
    };

    tick();
    this.wheelTickTimer = setInterval(tick, WHEEL_TICK_INTERVAL_MS);
    this.wheelTickStopTimer = setTimeout(
      () => this.stopWheelTicks(),
      durationMs
    );
  }

  stopWheelTicks(): void {
    if (this.wheelTickTimer !== null) {
      clearInterval(this.wheelTickTimer);
      this.wheelTickTimer = null;
    }
    if (this.wheelTickStopTimer !== null) {
      clearTimeout(this.wheelTickStopTimer);
      this.wheelTickStopTimer = null;
    }
  }

  private getOrCreateAudio(event: SoundEvent): HTMLAudioElement | null {
    if (this.unavailable.has(event)) return null;

    let audio = this.cache.get(event);
    if (!audio) {
      audio = new Audio(SOUND_PATHS[event]);
      audio.preload = "auto";

      audio.addEventListener(
        "error",
        () => {
          this.unavailable.add(event);
          this.cache.delete(event);
        },
        { once: true }
      );

      this.cache.set(event, audio);
    }

    return audio;
  }
}

let soundManagerInstance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
}
