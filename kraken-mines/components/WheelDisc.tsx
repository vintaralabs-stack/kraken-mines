"use client";

import {
  SEGMENT_ANGLE,
  WHEEL_SEGMENT_COLORS,
  WHEEL_SEGMENTS,
} from "@/lib/wheelLogic";

const SIZE = 400;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2;

/** Equal 3.6° slices from 12 o'clock clockwise — no gaps, no strokes */
function segmentPath(index: number): string {
  const startDeg = -90 + index * SEGMENT_ANGLE;
  const endDeg = -90 + (index + 1) * SEGMENT_ANGLE;
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;

  const x1 = CX + R * Math.cos(startRad);
  const y1 = CY + R * Math.sin(startRad);
  const x2 = CX + R * Math.cos(endRad);
  const y2 = CY + R * Math.sin(endRad);

  return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`;
}

interface WheelDiscProps {
  rotation: number;
  spinning: boolean;
  spinDurationMs: number;
}

export default function WheelDisc({
  rotation,
  spinning,
  spinDurationMs,
}: WheelDiscProps) {
  return (
    <>
      <div
        className="wheel-disc-rotor"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? `transform ${spinDurationMs}ms cubic-bezier(0.12, 0.85, 0.18, 1)`
            : "none",
        }}
      >
        <svg
          className="wheel-disc-svg"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-hidden
        >
          {WHEEL_SEGMENTS.map((color, index) => (
            <path
              key={index}
              d={segmentPath(index)}
              fill={WHEEL_SEGMENT_COLORS[color]}
            />
          ))}
        </svg>
      </div>
      <svg
        className="wheel-disc-ring"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden
      >
        <circle
          cx={CX}
          cy={CY}
          r={R - 2}
          fill="none"
          stroke="rgba(212, 175, 55, 0.55)"
          strokeWidth={8}
        />
      </svg>
    </>
  );
}
