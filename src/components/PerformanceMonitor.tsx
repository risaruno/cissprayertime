/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    total: number;
    limit: number;
  } | null;
  renderTime: number;
  domNodes: number;
}

function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memory: null,
    renderTime: 0,
    domNodes: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measurePerformance = () => {
      frameCount++;
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      // Update FPS every second
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime);
        
        // Get memory info (only available in Chrome/Edge)
        const memory = (performance as any).memory ? {
          used: Math.round((performance as any).memory.usedJSHeapSize / 1048576), // Convert to MB
          total: Math.round((performance as any).memory.totalJSHeapSize / 1048576),
          limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576),
        } : null;

        // Get render time from Performance API
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const renderTime = navigationTiming ? Math.round(navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart) : 0;

        // Count DOM nodes
        const domNodes = document.getElementsByTagName('*').length;

        setMetrics({
          fps,
          memory,
          renderTime,
          domNodes,
        });

        // Console log for debugging
        // console.log('=== Performance Metrics ===');
        // console.log(`FPS: ${fps}`);
        // if (memory) {
        //   console.log(`Memory Used: ${memory.used} MB / ${memory.total} MB (Limit: ${memory.limit} MB)`);
        //   console.log(`Memory Usage: ${Math.round((memory.used / memory.limit) * 100)}%`);
        // }
        // console.log(`DOM Nodes: ${domNodes}`);
        // console.log(`Initial Render Time: ${renderTime}ms`);
        // console.log('========================\n');

        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(measurePerformance);
    };

    animationFrameId = requestAnimationFrame(measurePerformance);

    // Keyboard shortcut to toggle visibility (Ctrl/Cmd + Shift + P)
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-black/80 text-white px-3 py-2 rounded-lg text-xs font-mono hover:bg-black/90 transition-colors"
        >
          
        </button>
      </div>
    );
  }

  const getFPSColor = (fps: number) => {
    if (fps >= 50) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMemoryColor = (percentage: number) => {
    if (percentage < 60) return 'text-green-400';
    if (percentage < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const memoryPercentage = metrics.memory 
    ? Math.round((metrics.memory.used / metrics.memory.limit) * 100)
    : 0;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-2xl border border-white/20 font-mono text-xs min-w-[280px]">
        <div className="flex items-center justify-between mb-3 border-b border-white/20 pb-2">
          <h3 className="text-sm font-bold text-cyan-400">Performance Monitor</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-2">
          {/* FPS */}
          <div className="flex justify-between items-center">
            <span className="text-white/70">FPS:</span>
            <span className={`font-bold text-lg ${getFPSColor(metrics.fps)}`}>
              {metrics.fps}
            </span>
          </div>

          {/* Memory Usage */}
          {metrics.memory && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Memory:</span>
                <span className={`font-bold ${getMemoryColor(memoryPercentage)}`}>
                  {metrics.memory.used} MB
                </span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    memoryPercentage < 60 ? 'bg-green-500' :
                    memoryPercentage < 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${memoryPercentage}%` }}
                />
              </div>
              
              <div className="flex justify-between text-[10px] text-white/50">
                <span>0 MB</span>
                <span>{metrics.memory.limit} MB</span>
              </div>
            </>
          )}

          {/* DOM Nodes */}
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-white/70">DOM Nodes:</span>
            <span className="font-bold text-blue-400">
              {metrics.domNodes}
            </span>
          </div>

          {/* Initial Render Time */}
          {metrics.renderTime > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-white/70">Load Time:</span>
              <span className="font-bold text-purple-400">
                {metrics.renderTime}ms
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-white/50 text-center">
          Press Ctrl+Shift+P to toggle
        </div>
      </div>
    </div>
  );
}

export default PerformanceMonitor;
