import { useEffect, useState } from 'react';

interface CelestialBodyProps {
  isDaytime: boolean;
  moonPhase?: number; // 0-1, where 0/1 = new moon, 0.5 = full moon
  showClouds: boolean;
}

// Moon phase calculation helper
const getMoonPhaseStyle = (phase: number) => {
  // phase: 0 = new moon, 0.25 = first quarter, 0.5 = full moon, 0.75 = last quarter
  const percentage = phase * 100;
  
  if (phase < 0.02 || phase > 0.98) {
    // New moon - completely dark
    return { background: 'radial-gradient(circle, #334155 0%, #1e293b 100%)', shadow: 'inset 10px 10px 30px rgba(0,0,0,0.9)' };
  } else if (phase >= 0.48 && phase <= 0.52) {
    // Full moon - completely bright
    return { background: 'radial-gradient(circle, #f8fafc 0%, #cbd5e1 100%)', shadow: 'inset 0 0 20px rgba(255,255,255,0.3)' };
  } else if (phase < 0.5) {
    // Waxing (growing) - dark left, bright right
    return { 
      background: `linear-gradient(90deg, #1e293b 0%, #1e293b ${100 - percentage * 2}%, #cbd5e1 ${100 - percentage * 2}%, #f8fafc 100%)`,
      shadow: 'inset -5px 0 15px rgba(0,0,0,0.7)'
    };
  } else {
    // Waning (shrinking) - bright left, dark right
    return { 
      background: `linear-gradient(90deg, #f8fafc 0%, #cbd5e1 ${(phase - 0.5) * 200}%, #1e293b ${(phase - 0.5) * 200}%, #1e293b 100%)`,
      shadow: 'inset 5px 0 15px rgba(0,0,0,0.7)'
    };
  }
};

function CelestialBody({ isDaytime, moonPhase = 0.5, showClouds }: CelestialBodyProps) {
  const [cloudPositions, setCloudPositions] = useState([
    { top: 15, duration: 80, delay: 0, size: 1.2, opacity: 0.85 },
    { top: 35, duration: 100, delay: 10, size: 1, opacity: 0.75 },
    { top: 55, duration: 90, delay: 25, size: 1.1, opacity: 0.8 },
  ]);

  useEffect(() => {
    // Randomize cloud positions slightly on mount for variety
    setCloudPositions(prev => prev.map(cloud => ({
      ...cloud,
      top: cloud.top + Math.random() * 10 - 5,
    })));
  }, []);

  const moonStyle = getMoonPhaseStyle(moonPhase);

  // Determine how many clouds to show and their opacity
  const cloudsToShow = showClouds ? cloudPositions.slice(0, 2) : cloudPositions.slice(0, 1); // Show 1 cloud when not cloudy, 2 when cloudy (reduced from 3)
  const cloudOpacityMultiplier = showClouds ? 1 : 0.4; // Lighter clouds when not cloudy

  return (
    <div className="relative h-[400px] flex items-center justify-center">
      {/* Sun (Daytime) - Reduced animations for performance */}
      {isDaytime && (
        <div 
          className="relative z-20"
          style={{
            animation: 'float-sun 12s ease-in-out infinite', // Removed sun-glow, slower float (was 8s)
          }}
        >
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-400 shadow-2xl relative">
            {/* Simplified sun - removed extra gradient layers */}
            <div className="absolute inset-8 rounded-full bg-gradient-radial from-white/60 to-transparent" />
          </div>
        </div>
      )}

      {/* Moon (Nighttime) - Reduced animations for performance */}
      {!isDaytime && (
        <div 
          className="relative z-20"
          style={{
            animation: 'float-moon 15s ease-in-out infinite', // Removed moon-glow, slower float (was 10s)
          }}
        >
          <div 
            className="w-48 h-48 rounded-full shadow-2xl relative overflow-hidden"
            style={{
              background: moonStyle.background,
              boxShadow: moonStyle.shadow,
            }}
          >
            {/* Simplified moon craters - reduced from 5 to 3 */}
            <div className="absolute top-8 left-12 w-8 h-8 rounded-full bg-slate-700/30" />
            <div className="absolute top-24 left-8 w-10 h-10 rounded-full bg-slate-700/20" />
            <div className="absolute top-20 left-20 w-12 h-12 rounded-full bg-slate-700/15" />
          </div>
        </div>
      )}

      {/* Clouds - Reduced count and slower animation */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {cloudsToShow.map((cloud, index) => (
          <div
            key={index}
            className="absolute will-change-transform" // GPU acceleration hint
            style={{
              top: `${cloud.top}%`,
              animation: `cloud-drift-${(index % 3) + 1} ${cloud.duration * 1.5}s linear infinite`, // 1.5x slower
              animationDelay: `${cloud.delay}s`,
              transform: `scale(${cloud.size * 2})`,
              opacity: cloud.opacity * cloudOpacityMultiplier,
            }}
          >
            {/* Simplified cloud SVG - removed filter for better performance */}
            <svg width="280" height="112" viewBox="0 0 280 112" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g>
                {/* Simplified cloud shape - fewer ellipses */}
                <ellipse cx="70" cy="70" rx="49" ry="35" fill="white" opacity="0.85" />
                <ellipse cx="112" cy="63" rx="56" ry="39" fill="white" opacity="0.9" />
                <ellipse cx="154" cy="70" rx="53" ry="36" fill="white" opacity="0.85" />
                
                {/* Bottom fill */}
                <rect x="42" y="63" width="175" height="28" fill="white" opacity="0.85" />
              </g>
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

// Add sun rays animation
const style = document.createElement('style');
style.textContent = `
  @keyframes sun-rays {
    0% {
      opacity: 0.4;
      height: 70px;
    }
    100% {
      opacity: 0.8;
      height: 95px;
    }
  }
`;
document.head.appendChild(style);

export default CelestialBody;
