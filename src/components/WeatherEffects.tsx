import { useMemo } from 'react';

// Constants for weather effects positioning and animation
const PRECIPITATION_START_POSITION = '0px'; // top position where rain/snow starts

// Rain and snow particle counts - Optimized for low-end devices like Android TV
const RAIN_DROP_COUNT = 40;
const SNOWFLAKE_COUNT = 30;

interface WeatherEffectsProps {
  weatherCondition?: string; // 'Rain', 'Snow', 'Thunderstorm', 'Drizzle', etc.
  showClouds?: boolean; // Keep for backward compatibility but not used
}

function WeatherEffects({ weatherCondition }: WeatherEffectsProps) {
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
      {/* Rain effect */}
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

      {/* Snow effect */}
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
