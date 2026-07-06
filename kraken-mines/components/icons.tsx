interface SafeChestProps {
  className?: string;
}

/**
 * Brand-new Kraken Mines safe symbol — stylized gold chest.
 * Lid state driven by CSS classes on parent (.chest-reveal-active / .chest-reveal-open).
 */
export function SafeChest({ className = "w-6 h-6" }: SafeChestProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden
    >
      <g className="chest-inner-glow">
        <ellipse cx="28" cy="30" rx="11" ry="7" fill="#FBBF24" opacity="0.22" />
        <ellipse cx="28" cy="29" rx="6" ry="3.5" fill="#FDE68A" opacity="0.4" />
        <path
          d="M17 28 L39 28 L36 24 C28 21 20 24 17 28 Z"
          fill="#FBBF24"
          opacity="0.6"
        />
      </g>

      <rect
        x="12"
        y="28"
        width="32"
        height="18"
        rx="2.5"
        fill="#6B4F0A"
        stroke="#C9A227"
        strokeWidth="1.6"
      />
      <rect x="12" y="28" width="32" height="5" rx="1" fill="#8B6914" opacity="0.55" />

      <rect x="24" y="33" width="8" height="9" rx="1.2" fill="#D4AF37" />
      <circle cx="28" cy="37.5" r="1.4" fill="#0A1220" />

      <g className="chest-lid-group">
        <path
          d="M12 28 L12 22 C12 17 28 14 44 17 L44 22 L44 28 Z"
          fill="#9A7618"
          stroke="#D4AF37"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <rect x="14" y="24" width="28" height="3" rx="0.5" fill="#C9A227" opacity="0.75" />
      </g>
    </svg>
  );
}

interface KrakenEmblemProps {
  className?: string;
  dimmed?: boolean;
}

/**
 * Brand-new Kraken Mines trap symbol — heraldic Kraken emblem.
 */
export function KrakenEmblem({
  className = "w-6 h-6",
  dimmed = false,
}: KrakenEmblemProps) {
  const head = dimmed ? "#3D0C14" : "#5C1018";
  const headEdge = dimmed ? "#6B1520" : "#991B1B";
  const eyeRing = dimmed ? "#4A1018" : "#0A1220";
  const iris = dimmed ? "#7F1D1D" : "#DC2626";
  const tentacle = dimmed ? "#6B1520" : "#B91C1C";
  const highlight = dimmed ? 0.2 : 0.55;

  return (
    <svg
      className={className}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden
    >
      <path
        d="M8 42 C14 36 18 40 22 44 C24 46 26 44 28 40 C30 44 32 46 34 44 C38 40 42 36 48 42"
        stroke={tentacle}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        opacity={dimmed ? 0.4 : 0.85}
      />
      <path
        d="M14 48 C20 44 24 47 28 43 C32 47 36 44 42 48"
        stroke={tentacle}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity={dimmed ? 0.3 : 0.6}
      />
      <path
        d="M22 50 Q28 47 34 50"
        stroke={tentacle}
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity={dimmed ? 0.25 : 0.45}
      />

      <path
        d="M28 8 C38 8 44 14 44 22 C44 30 38 36 28 38 C18 36 12 30 12 22 C12 14 18 8 28 8 Z"
        fill={head}
        stroke={headEdge}
        strokeWidth="1.6"
      />
      <path
        d="M18 20 Q28 16 38 20"
        stroke={headEdge}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity={dimmed ? 0.5 : 0.8}
      />

      <circle cx="28" cy="23" r="7.5" fill={eyeRing} stroke={headEdge} strokeWidth="1.2" />
      <circle cx="28" cy="23" r="4.5" fill={iris} />
      <circle cx="29.8" cy="21.2" r="1.5" fill="#FCA5A5" opacity={highlight} />
    </svg>
  );
}
