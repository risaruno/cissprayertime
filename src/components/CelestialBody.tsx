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

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Sun (Daytime) */}
      {isDaytime && (
        <div 
          className="relative"
          style={{
            animation: 'float-sun 8s ease-in-out infinite, sun-glow 4s ease-in-out infinite'
          }}
        >
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-400 shadow-2xl relative">
            {/* Sun core gradient */}
            <div className="absolute inset-4 rounded-full bg-gradient-radial from-yellow-100 to-transparent" />
            <div className="absolute inset-8 rounded-full bg-gradient-radial from-white to-transparent" />
          </div>
        </div>
      )}

      {/* Moon (Nighttime) */}
      {!isDaytime && (
        <div 
          className="relative"
          style={{
            animation: 'float-moon 10s ease-in-out infinite, moon-glow 5s ease-in-out infinite'
          }}
        >
          <div 
            className="w-48 h-48 rounded-full shadow-2xl relative overflow-hidden"
            style={{
              background: moonStyle.background,
              boxShadow: moonStyle.shadow,
            }}
          >
            {/* Moon craters */}
            <div className="absolute top-8 left-12 w-8 h-8 rounded-full bg-slate-700/30" />
            <div className="absolute top-16 left-28 w-6 h-6 rounded-full bg-slate-700/25" />
            <div className="absolute top-24 left-8 w-10 h-10 rounded-full bg-slate-700/20" />
            <div className="absolute top-28 left-24 w-5 h-5 rounded-full bg-slate-700/30" />
            <div className="absolute top-20 left-20 w-12 h-12 rounded-full bg-slate-700/15" />
            
            {/* Moon highlight */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
          </div>
        </div>
      )}

      {/* Clouds - only shown when weather is cloudy */}
      {showClouds && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {cloudPositions.map((cloud, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                top: `${cloud.top}%`,
                animation: `cloud-drift-${(index % 3) + 1} ${cloud.duration}s linear infinite`,
                animationDelay: `${cloud.delay}s`,
                transform: `scale(${cloud.size})`,
                opacity: cloud.opacity,
              }}
            >
              <svg width="200" height="80" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#cloud-shadow)">
                  {/* Cloud shape */}
                  <ellipse cx="50" cy="50" rx="35" ry="25" fill="white" opacity="0.9" />
                  <ellipse cx="80" cy="45" rx="40" ry="28" fill="white" opacity="0.95" />
                  <ellipse cx="110" cy="50" rx="38" ry="26" fill="white" opacity="0.9" />
                  <ellipse cx="140" cy="48" rx="35" ry="25" fill="white" opacity="0.85" />
                  
                  {/* Bottom fill */}
                  <rect x="30" y="45" width="125" height="20" fill="white" opacity="0.9" />
                  
                  {/* Subtle shading */}
                  <ellipse cx="80" cy="60" rx="50" ry="15" fill="#e2e8f0" opacity="0.4" />
                  <ellipse cx="110" cy="62" rx="45" ry="12" fill="#cbd5e1" opacity="0.3" />
                </g>
                <defs>
                  <filter id="cloud-shadow" x="0" y="0" width="200" height="100" filterUnits="userSpaceOnUse">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                    <feOffset dy="2" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.3"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
              </svg>
            </div>
          ))}
        </div>
      )}
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
