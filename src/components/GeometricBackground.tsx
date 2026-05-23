import { useMemo } from 'react';

interface GeometricBackgroundProps {
  accentColor: string;
}

/** Generate an 8-pointed star (octagram) SVG path centered at (cx, cy). */
function octagramPath(cx: number, cy: number, outerR: number, innerR: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const angleDeg = -90 + i * 22.5;
    const angleRad = (angleDeg * Math.PI) / 180;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angleRad);
    const y = cy + r * Math.sin(angleRad);
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ') + ' Z';
}

/** Generate a regular octagon path centered at (cx, cy). */
function octagonPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angleDeg = -67.5 + i * 45;
    const angleRad = (angleDeg * Math.PI) / 180;
    pts.push(`${i === 0 ? 'M' : 'L'} ${(cx + r * Math.cos(angleRad)).toFixed(2)},${(cy + r * Math.sin(angleRad)).toFixed(2)}`);
  }
  return pts.join(' ') + ' Z';
}

export default function GeometricBackground({ accentColor }: GeometricBackgroundProps) {
  const T = 120; // tile size
  const H = T / 2; // half

  const paths = useMemo(() => ({
    mainStar:   octagramPath(H, H, 28, 11),
    octagon:    octagonPath(H, H, 40),
    cornerTL:   octagramPath(0,  0,  10, 4),
    cornerTR:   octagramPath(T,  0,  10, 4),
    cornerBL:   octagramPath(0,  T,  10, 4),
    cornerBR:   octagramPath(T,  T,  10, 4),
    edgeTop:    octagramPath(H,  0,  10, 4),
    edgeBottom: octagramPath(H,  T,  10, 4),
    edgeLeft:   octagramPath(0,  H,  10, 4),
    edgeRight:  octagramPath(T,  H,  10, 4),
  }), [H, T]);

  // Tips of the main star for connector lines
  const tipN  = { x: H,              y: H - 28           };
  const tipS  = { x: H,              y: H + 28           };
  const tipW  = { x: H - 28,         y: H                };
  const tipE  = { x: H + 28,         y: H                };
  const tipNE = { x: H + 19.80,      y: H - 19.80        };
  const tipNW = { x: H - 19.80,      y: H - 19.80        };
  const tipSE = { x: H + 19.80,      y: H + 19.80        };
  const tipSW = { x: H - 19.80,      y: H + 19.80        };

  const stroke = accentColor;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, overflow: 'hidden' }}
    >
      {/* Oversized rotating wrapper so corners stay covered during spin */}
      <div
        style={{
          position: 'absolute',
          width: '150%',
          height: '150%',
          top: '-25%',
          left: '-25%',
          transformOrigin: '50% 50%',
          animation: 'geo-rotate 120s linear infinite',
          willChange: 'transform',
        }}
      >
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <defs>
            <pattern
              id="islamic-geo"
              width={T}
              height={T}
              patternUnits="userSpaceOnUse"
            >
              {/* Outer octagon frame */}
              <path d={paths.octagon}   fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.07" />

              {/* Main 8-point star */}
              <path d={paths.mainStar}  fill="none" stroke={stroke} strokeWidth="0.9" opacity="0.13" />

              {/* Centre dot */}
              <circle cx={H} cy={H} r="4.5" fill="none" stroke={stroke} strokeWidth="0.6" opacity="0.1" />

              {/* Cardinal connector lines (star tip → tile edge midpoint) */}
              <line x1={tipN.x}  y1={tipN.y}  x2={H} y2={0} stroke={stroke} strokeWidth="0.5" opacity="0.06" />
              <line x1={tipS.x}  y1={tipS.y}  x2={H} y2={T} stroke={stroke} strokeWidth="0.5" opacity="0.06" />
              <line x1={tipW.x}  y1={tipW.y}  x2={0} y2={H} stroke={stroke} strokeWidth="0.5" opacity="0.06" />
              <line x1={tipE.x}  y1={tipE.y}  x2={T} y2={H} stroke={stroke} strokeWidth="0.5" opacity="0.06" />

              {/* Diagonal connector lines (star tip → tile corner) */}
              <line x1={tipNE.x} y1={tipNE.y} x2={T} y2={0} stroke={stroke} strokeWidth="0.5" opacity="0.06" />
              <line x1={tipNW.x} y1={tipNW.y} x2={0} y2={0} stroke={stroke} strokeWidth="0.5" opacity="0.06" />
              <line x1={tipSE.x} y1={tipSE.y} x2={T} y2={T} stroke={stroke} strokeWidth="0.5" opacity="0.06" />
              <line x1={tipSW.x} y1={tipSW.y} x2={0} y2={T} stroke={stroke} strokeWidth="0.5" opacity="0.06" />

              {/* Corner mini-stars (create tessellation connection) */}
              <path d={paths.cornerTL} fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.08" />
              <path d={paths.cornerTR} fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.08" />
              <path d={paths.cornerBL} fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.08" />
              <path d={paths.cornerBR} fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.08" />

              {/* Edge midpoint mini-stars */}
              <path d={paths.edgeTop}    fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.08" />
              <path d={paths.edgeBottom} fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.08" />
              <path d={paths.edgeLeft}   fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.08" />
              <path d={paths.edgeRight}  fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.08" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-geo)" />
        </svg>
      </div>
    </div>
  );
}
