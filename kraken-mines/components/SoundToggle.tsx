interface SoundToggleProps {
  muted: boolean;
  onToggle: () => void;
}

export default function SoundToggle({ muted, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      aria-pressed={muted}
      title={muted ? "Sound off" : "Sound on"}
      className="sound-toggle"
    >
      {muted ? (
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden>
          <path
            d="M3 8v4h3l4 3V5L6 8H3z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M14 7l4 4M18 7l-4 4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden>
          <path
            d="M3 8v4h3l4 3V5L6 8H3z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M13 7.5a4 4 0 010 5M15 5a7 7 0 010 10"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
