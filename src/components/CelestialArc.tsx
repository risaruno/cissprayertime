import { useMoonPhase } from './MoonPhaseFetcher';

const DEFAULT_LAT = 37.5665;
const DEFAULT_LON = 126.9780;
const ARC_CX = 200;
const ARC_CY = 195;
const ARC_R  = 140;

interface CelestialArcProps {
  isDaytime: boolean;
  /** 0 = start of arc (left), 1 = end of arc (right) */
  progress: number;
  moonPhase?: number;
  latitude?: number;
  longitude?: number;
}

export default function CelestialArc({
  isDaytime,
  progress,
  latitude = DEFAULT_LAT,
  longitude = DEFAULT_LON,
}: CelestialArcProps) {
  const { moonPhaseImage } = useMoonPhase(latitude, longitude);

  const p = Math.max(0.01, Math.min(0.99, progress));
  // Arc goes from left (π) through top (π/2) to right (0)
  const angle = Math.PI * (1 - p);
  const bodyX = ARC_CX + ARC_R * Math.cos(angle);
  const bodyY = ARC_CY - ARC_R * Math.sin(angle);

  const leftLabel  = isDaytime ? 'Sunrise' : 'Maghrib';
  const rightLabel = isDaytime ? 'Maghrib' : 'Sunrise';

  return (
    <svg
      viewBox="0 0 400 210"
      preserveAspectRatio="xMidYMax meet"
      className="w-full"
      style={{ maxHeight: '150px', display: 'block' }}
    >
      <defs>
        <clipPath id="moon-clip-arc">
          <circle cx="0" cy="0" r="15" />
        </clipPath>
        <filter id="sun-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Horizon line */}
      <line
        x1="20" y1={ARC_CY} x2="380" y2={ARC_CY}
        stroke="rgba(255,255,255,0.08)" strokeWidth="1"
      />

      {/* Dashed arc path */}
      <path
        d={`M 60,${ARC_CY} A ${ARC_R},${ARC_R} 0 0 1 340,${ARC_CY}`}
        fill="none"
        stroke="rgba(255,255,255,0.20)"
        strokeWidth="1.5"
        strokeDasharray="5 9"
      />

      {/* Sun */}
      {isDaytime && (
        <g transform={`translate(${bodyX.toFixed(1)},${bodyY.toFixed(1)})`} filter="url(#sun-glow)">
          <circle r="20" fill="#fbbf24" opacity="0.12" />
          <circle r="14" fill="#fcd34d" opacity="0.88" />
          <circle r="8"  fill="#fef9c3" />
        </g>
      )}

      {/* Moon */}
      {!isDaytime && (
        <g transform={`translate(${bodyX.toFixed(1)},${bodyY.toFixed(1)})`}>
          {moonPhaseImage ? (
            <image
              href={moonPhaseImage}
              x="-16" y="-16" width="32" height="32"
              clipPath="url(#moon-clip-arc)"
              opacity="0.85"
            />
          ) : (
            <circle r="14" fill="#e2e8f0" opacity="0.75" />
          )}
        </g>
      )}

      {/* Arc end labels */}
      <text x="60"  y={ARC_CY} dy="14" textAnchor="middle"
        fill="rgba(255,255,255,0.30)" fontSize="9" fontFamily="Inter, sans-serif">
        {leftLabel}
      </text>
      <text x="340" y={ARC_CY} dy="14" textAnchor="middle"
        fill="rgba(255,255,255,0.30)" fontSize="9" fontFamily="Inter, sans-serif">
        {rightLabel}
      </text>
    </svg>
  );
}
