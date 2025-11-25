import { useEffect, useState, useMemo } from 'react';

// Constants for weather effects positioning and animation
const CLOUD_POSITION_VARIANCE = 5; // pixels of random variance for cloud positions
const CLOUD_VARIANCE_OFFSET = 2.5; // center offset for variance calculation
const CLOUD_ANIMATION_VARIANTS = 3; // number of different cloud drift animations
const CLOUD_SLOW_MULTIPLIER = 1.5; // speed multiplier when not cloudy
const PRECIPITATION_START_POSITION = '120px'; // top position where rain/snow starts (below clouds)

// Rain and snow particle counts
const RAIN_DROP_COUNT = 100;
const SNOWFLAKE_COUNT = 80;

interface WeatherEffectsProps {
  showClouds: boolean;
  weatherCondition?: string; // 'Rain', 'Snow', 'Thunderstorm', 'Drizzle', etc.
}

interface CloudPosition {
  top: number;
  duration: number;
  delay: number;
  size: number;
  opacity: number;
}

function WeatherEffects({ showClouds, weatherCondition }: WeatherEffectsProps) {
  const [cloudPositions, setCloudPositions] = useState<CloudPosition[]>([
    { top: 5, duration: 70, delay: 0, size: 1.3, opacity: 0.9 },
    { top: 15, duration: 85, delay: 8, size: 1.1, opacity: 0.85 },
    { top: 8, duration: 80, delay: 20, size: 1.2, opacity: 0.88 },
    { top: 12, duration: 90, delay: 35, size: 1.0, opacity: 0.82 },
  ]);

  useEffect(() => {
    // Randomize cloud positions slightly on mount for variety
    setCloudPositions(prev => prev.map(cloud => ({
      ...cloud,
      top: cloud.top + Math.random() * CLOUD_POSITION_VARIANCE - CLOUD_VARIANCE_OFFSET,
    })));
  }, []);

  // Determine how many clouds to show and their opacity
  const cloudsToShow = showClouds ? cloudPositions : cloudPositions.slice(0, 1);
  const cloudOpacityMultiplier = showClouds ? 1 : 0.3;

  // Determine if precipitation should be shown
  const showRain = weatherCondition === 'Rain' || weatherCondition === 'Drizzle' || weatherCondition === 'Thunderstorm';
  const showSnow = weatherCondition === 'Snow';

  // Generate rain drops with useMemo to avoid recalculating on every render
  // Using a seeded approach for more consistent results
  const rainDrops = useMemo(() => {
    if (!showRain) return [];
    return Array.from({ length: RAIN_DROP_COUNT }, (_, i) => ({
      id: i,
      left: (i * 7.3 + 13) % 100, // Deterministic spread pattern
      delay: (i * 0.02) % 2,
      duration: 0.5 + (i % 5) * 0.1,
      opacity: 0.3 + (i % 4) * 0.1,
    }));
  }, [showRain]);

  // Generate snowflakes with useMemo for consistent results
  const snowflakes = useMemo(() => {
    if (!showSnow) return [];
    return Array.from({ length: SNOWFLAKE_COUNT }, (_, i) => ({
      id: i,
      left: (i * 8.7 + 5) % 100, // Deterministic spread pattern
      delay: (i * 0.0625) % 5,
      duration: 3 + (i % 4),
      size: 3 + (i % 5),
      opacity: 0.5 + (i % 5) * 0.1,
      sway: ((i % 6) - 3) * 10, // Range from -30 to 20
    }));
  }, [showSnow]);

  return (
    <>
      {/* Cloud layer - positioned in upper section, behind header content */}
      <div className="fixed top-0 left-0 right-0 h-[200px] pointer-events-none z-[5] overflow-hidden">
        {cloudsToShow.map((cloud, index) => (
          <div
            key={index}
            className="absolute will-change-transform"
            style={{
              top: `${cloud.top}%`,
              animation: `cloud-drift-${(index % CLOUD_ANIMATION_VARIANTS) + 1} ${showClouds ? cloud.duration : cloud.duration * CLOUD_SLOW_MULTIPLIER}s linear infinite`,
              animationDelay: `${cloud.delay}s`,
              transform: `scale(${cloud.size * 2})`,
              opacity: cloud.opacity * cloudOpacityMultiplier,
            }}
          >
            {/* Cloud SVG */}
            <svg width="280" height="112" viewBox="0 0 280 112" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g>
                <ellipse cx="70" cy="70" rx="49" ry="35" fill="white" opacity="0.85" />
                <ellipse cx="112" cy="63" rx="56" ry="39" fill="white" opacity="0.9" />
                <ellipse cx="154" cy="70" rx="53" ry="36" fill="white" opacity="0.85" />
                <rect x="42" y="63" width="175" height="28" fill="white" opacity="0.85" />
              </g>
            </svg>
          </div>
        ))}
      </div>

      {/* Rain effect - positioned below clouds */}
      {showRain && (
        <div 
          className="fixed left-0 right-0 bottom-0 pointer-events-none z-[4] overflow-hidden"
          style={{ top: PRECIPITATION_START_POSITION }}
        >
          {rainDrops.map((drop) => (
            <div
              key={drop.id}
              className="absolute w-[2px] h-[20px] bg-gradient-to-b from-transparent via-blue-300/60 to-blue-400/80 rounded-full"
              style={{
                left: `${drop.left}%`,
                opacity: drop.opacity,
                animation: `rain-fall ${drop.duration}s linear infinite`,
                animationDelay: `${drop.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Snow effect - positioned below clouds */}
      {showSnow && (
        <div 
          className="fixed left-0 right-0 bottom-0 pointer-events-none z-[4] overflow-hidden"
          style={{ top: PRECIPITATION_START_POSITION }}
        >
          {snowflakes.map((flake) => (
            <div
              key={flake.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${flake.left}%`,
                width: `${flake.size}px`,
                height: `${flake.size}px`,
                opacity: flake.opacity,
                animation: `snow-fall ${flake.duration}s linear infinite`,
                animationDelay: `${flake.delay}s`,
                '--sway': `${flake.sway}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default WeatherEffects;
