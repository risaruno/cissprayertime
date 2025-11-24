import { useEffect, useState, useMemo } from 'react';

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
      top: cloud.top + Math.random() * 5 - 2.5,
    })));
  }, []);

  // Determine how many clouds to show and their opacity
  const cloudsToShow = showClouds ? cloudPositions : cloudPositions.slice(0, 1);
  const cloudOpacityMultiplier = showClouds ? 1 : 0.3;

  // Determine if precipitation should be shown
  const showRain = weatherCondition === 'Rain' || weatherCondition === 'Drizzle' || weatherCondition === 'Thunderstorm';
  const showSnow = weatherCondition === 'Snow';

  // Generate rain drops or snowflakes
  const rainDrops = useMemo(() => {
    if (!showRain) return [];
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 0.5 + Math.random() * 0.5,
      opacity: 0.3 + Math.random() * 0.4,
    }));
  }, [showRain]);

  const snowflakes = useMemo(() => {
    if (!showSnow) return [];
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 3 + Math.random() * 5,
      opacity: 0.5 + Math.random() * 0.5,
      sway: Math.random() * 30 - 15,
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
              animation: `cloud-drift-${(index % 3) + 1} ${showClouds ? cloud.duration : cloud.duration * 1.5}s linear infinite`,
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
        <div className="fixed top-[120px] left-0 right-0 bottom-0 pointer-events-none z-[4] overflow-hidden">
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
        <div className="fixed top-[120px] left-0 right-0 bottom-0 pointer-events-none z-[4] overflow-hidden">
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
