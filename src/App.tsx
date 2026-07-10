import { useState, useEffect, useCallback } from 'react';
import PerformanceMonitor from './components/PerformanceMonitor';
import WeatherEffects from './components/WeatherEffects';
import GeometricBackground from './components/GeometricBackground';
import TopBar from './components/TopBar';
import HeroPanel from './components/HeroPanel';
import PrayerSidebar from './components/PrayerSidebar';
import { getEffectiveIqamah } from './utils/iqamah';

// Import logos
import LeftLogo from './assets/logo/left.png';
import RightLogo from './assets/logo/right.png';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface WeatherData {
  main: string;
}

interface CalendarData {
  hijri: string;
  gregorian: string;
}

// ── Time-of-day theme palette ────────────────────────────────────────────────
interface TimeTheme {
  bgColor:    string;
  accentColor: string;
  accentRgb:  string;
}

const TIME_THEMES: Record<string, TimeTheme> = {
  night:   { bgColor: '#0a0e1a', accentColor: '#38bdf8', accentRgb: '56,189,248'   },  // sky blue
  fajr:    { bgColor: '#061a14', accentColor: '#2dd4bf', accentRgb: '45,212,191'   },  // teal
  sunrise: { bgColor: '#061219', accentColor: '#22d3ee', accentRgb: '34,211,238'   },  // cyan (was amber)
  dhuha:   { bgColor: '#071320', accentColor: '#0ea5e9', accentRgb: '14,165,233'   },  // sky  (was amber)
  dhuhr:   { bgColor: '#0d1117', accentColor: '#3b82f6', accentRgb: '59,130,246'   },  // blue
  asr:     { bgColor: '#0d1117', accentColor: '#60a5fa', accentRgb: '96,165,250'   },  // lighter blue
  maghrib: { bgColor: '#0a0f1a', accentColor: '#818cf8', accentRgb: '129,140,248'  },  // indigo (was rose-red)
  isha:    { bgColor: '#0e0a1a', accentColor: '#a78bfa', accentRgb: '167,139,250'  },  // violet
};

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const HAS_WEATHER_API_KEY = Boolean(
  WEATHER_API_KEY &&
  WEATHER_API_KEY.trim() !== '' &&
  WEATHER_API_KEY !== 'your_weather_api_key'
);
const DEBUG_MODE = import.meta.env.VITE_DEBUG === 'true';

function App() {
  const [location, setLocation] = useState('Seoul');
  const [loading, setLoading] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<{ name: string; time: Date } | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null); // The upcoming prayer
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [timeTheme, setTimeTheme] = useState<TimeTheme>(TIME_THEMES.night);
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [lastFetchDate, setLastFetchDate] = useState<string>('');

  // Debug: Override time for testing using offset from real time
  const [debugTimeOffset, setDebugTimeOffset] = useState<number>(0); // Offset in milliseconds from real time (0 = real time)
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showIqamahPanel, setShowIqamahPanel] = useState(false);

  // Debug: Weather effects override
  const [debugWeatherEffect, setDebugWeatherEffect] = useState<string | null>(null); // 'Rain', 'Snow', or null for actual weather
  
  // Iqamah times (minutes after adhan)
  const [iqamahTimes, setIqamahTimes] = useState<{ [key: string]: number }>({
    'Fajr': 30,
    'Sunrise': 15,
    'Dhuhr': 30,
    'Asr': 30,
    'Maghrib': 20,
    'Isha': 30
  });

  // format current time - Update less frequently to save resources
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      if (debugTimeOffset !== 0) {
        // If debug offset is set, add it to current real time
        setCurrentTime(new Date(Date.now() + debugTimeOffset));
      } else {
        // Use real time
        setCurrentTime(new Date());
      }
    }, 1000); // Keep at 1s for smooth clock
    return () => clearInterval(timer);
  }, [debugTimeOffset]);
  

  // Fetch weather condition for ambient effects
  const fetchWeather = useCallback(async (city: string) => {
    if (!HAS_WEATHER_API_KEY) {
      setWeather(null);
      console.warn('Skipping weather fetch: VITE_WEATHER_API_KEY is missing or still using the example placeholder.');
      return;
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
      );
      const data = await response.json();

      if (!response.ok || data.cod !== 200) {
        console.warn('Weather API request failed:', data?.message || response.statusText);
        setWeather(null);
        return;
      }

      setWeather({
        main: data.weather[0].main,
      });
    } catch (err) {
      console.error('Error fetching weather:', err);
      setWeather(null);
    }
  }, []);

  // Update current and next prayer
  const updateNextPrayer = useCallback((times: PrayerTimes, currentTimeParam?: Date) => {
    const now = currentTimeParam || new Date();
    // Exclude Sunrise from next prayer calculation (it's not a prayer time)
    const prayers = Object.entries(times).filter(([name]) => name !== 'Sunrise');
    const todayPrayers = prayers.map(([name, time]) => {
      const [hours, minutes] = time.split(':');
      const prayerTime = new Date();
      prayerTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const iqamahMinutes = iqamahTimes[name] || 0;
      const effective = getEffectiveIqamah(time, iqamahMinutes, name, now);
      const iqamahTime = new Date(prayerTime.getTime() + effective.effectiveMinutes * 60 * 1000);

      return { name, time: prayerTime, iqamahTime };
    });

    todayPrayers.sort((a, b) => a.time.getTime() - b.time.getTime());

    // Find next prayer based on iqamah time (stays active until iqamah passes)
    const next = todayPrayers.find(prayer => prayer.iqamahTime > now);

    // Find the current prayer (most recent prayer that has passed)
    const passedPrayers = todayPrayers.filter(prayer => prayer.time <= now);
    const current = passedPrayers.length > 0 ? passedPrayers[passedPrayers.length - 1] : null;

    // Set next prayer
    if (!next && todayPrayers.length > 0) {
      const tomorrowPrayer = {
        name: todayPrayers[0].name,
        time: new Date(todayPrayers[0].time.getTime() + 24 * 60 * 60 * 1000)
      };
      setNextPrayer(tomorrowPrayer);
    } else {
      setNextPrayer(next || null);
    }

    // Set current prayer
    if (current) {
      setCurrentPrayer(current);
    } else {
      // If no prayer has passed today, we're before Fajr, so current prayer is Isha from yesterday
      const lastPrayer = todayPrayers[todayPrayers.length - 1];
      const yesterdayPrayer = {
        name: lastPrayer.name,
        time: new Date(lastPrayer.time.getTime() - 24 * 60 * 60 * 1000)
      };
      setCurrentPrayer(yesterdayPrayer);
    }
  }, [iqamahTimes]);

  // Fetch prayer times
  const fetchPrayerTimes = useCallback(async (city: string) => {
    setLoading(true);
    try {
      const date = new Date();
      const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      
      const response = await fetch(
        `https://api.aladhan.com/v1/timingsByCity/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?city=${city}&country=&method=3`
      );
      const data = await response.json();
      
      if (data.code === 200) {
        const filteredTimings: PrayerTimes = {
          Fajr: data.data.timings.Fajr,
          Sunrise: data.data.timings.Sunrise,
          Dhuhr: data.data.timings.Dhuhr,
          Asr: data.data.timings.Asr,
          Maghrib: data.data.timings.Maghrib,
          Isha: data.data.timings.Isha,
        };
        
        setPrayerTimes(filteredTimings);
        updateNextPrayer(filteredTimings);
        
        // Set calendar data
        setCalendar({
          hijri: `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year} H`,
          gregorian: `${data.data.date.gregorian.weekday.en}, ${data.data.date.gregorian.day} ${data.data.date.gregorian.month.en} ${data.data.date.gregorian.year}`
        });
        
        // Update last fetch date
        setLastFetchDate(dateString);
      }
    } catch (err) {
      console.error('Error fetching prayer times:', err);
    }
    setLoading(false);
  }, [updateNextPrayer]);

  // Determine time-of-day theme based on prayer times
  const updateBackground = useCallback((times: PrayerTimes | null, currentTimeParam?: Date) => {
    if (!times) return;

    const now = currentTimeParam || new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinutes;

    // Parse prayer times to minutes
    const parseTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const fajr    = parseTime(times.Fajr);
    const sunrise = parseTime(times.Sunrise);
    const dhuhr   = parseTime(times.Dhuhr);
    const asr     = parseTime(times.Asr);
    const maghrib = parseTime(times.Maghrib);
    const isha    = parseTime(times.Isha);

    // Map time periods to themes
    if (currentTimeInMinutes >= 0 && currentTimeInMinutes < fajr) {
      setTimeTheme(TIME_THEMES.night);
    } else if (currentTimeInMinutes >= fajr && currentTimeInMinutes < sunrise) {
      setTimeTheme(TIME_THEMES.fajr);
    } else if (currentTimeInMinutes >= sunrise && currentTimeInMinutes < sunrise + 60) {
      setTimeTheme(TIME_THEMES.sunrise);
    } else if (currentTimeInMinutes >= sunrise + 60 && currentTimeInMinutes < dhuhr) {
      setTimeTheme(TIME_THEMES.dhuha);
    } else if (currentTimeInMinutes >= dhuhr && currentTimeInMinutes < asr) {
      setTimeTheme(TIME_THEMES.dhuhr);
    } else if (currentTimeInMinutes >= asr && currentTimeInMinutes < maghrib) {
      setTimeTheme(TIME_THEMES.asr);
    } else if (currentTimeInMinutes >= maghrib && currentTimeInMinutes < isha) {
      setTimeTheme(TIME_THEMES.maghrib);
    } else {
      setTimeTheme(TIME_THEMES.isha);
    }
  }, []);

  // Initialize and fetch data
  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}`
            );
            const data = await response.json();
            if (data.city) {
              setLocation(data.city);
              fetchPrayerTimes(data.city);
              fetchWeather(data.city);
            }
          } catch (err) {
            console.error('Error getting location:', err);
            fetchPrayerTimes(location);
            fetchWeather(location);
          }
        },
        () => {
          // Fallback to default location
          fetchPrayerTimes(location);
          fetchWeather(location);
        }
      );
    } else {
      fetchPrayerTimes(location);
      fetchWeather(location);
    }
  }, [fetchPrayerTimes, fetchWeather, location]);

  // Update background every minute
  useEffect(() => {
    updateBackground(prayerTimes, currentTime);
    const interval = setInterval(() => {
      updateBackground(prayerTimes, currentTime);
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [prayerTimes, updateBackground, currentTime]);

  // Update next prayer and background when currentTime changes (for debug mode)
  useEffect(() => {
    if (prayerTimes) {
      updateNextPrayer(prayerTimes, currentTime);
      updateBackground(prayerTimes, currentTime);
    }
  }, [currentTime, prayerTimes, updateNextPrayer, updateBackground]);

  // Auto-refresh prayer times daily at midnight for Smart TVs
  useEffect(() => {
    const checkAndRefresh = () => {
      const now = new Date();
      const currentDateString = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      
      // If the date has changed since last fetch, refresh data
      if (lastFetchDate && currentDateString !== lastFetchDate) {
        console.log('Day changed - refreshing prayer times and weather');
        fetchPrayerTimes(location);
        fetchWeather(location);
      }
    };
    
    // Check every minute for day change
    const interval = setInterval(checkAndRefresh, 60000);
    
    return () => clearInterval(interval);
  }, [lastFetchDate, location, fetchPrayerTimes, fetchWeather]);


  // Simplified prayer names for display
  const displayPrayerName = (name: string) => {
    const nameMap: { [key: string]: string } = {
      'Fajr': 'Subuh',
      'Sunrise': 'Syuruq',
      'Dhuhr': 'Dzuhur',
      'Asr': 'Ashar',
      'Maghrib': 'Maghrib',
      'Isha': 'Isya'
    };
    return nameMap[name] || name;
  };

  return (
    /* ── Root: dark background ───────────────────────────────────────────── */
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: timeTheme.bgColor }}
    >
      {/* ── Animated Islamic geometric background ────────────────────────── */}
      <GeometricBackground accentColor={timeTheme.accentColor} />

      {/* ── Weather effects (rain / snow) ────────────────────────────────── */}
      <WeatherEffects
        showClouds={false}
        weatherCondition={debugWeatherEffect || weather?.main}
      />

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <TopBar
        calendar={calendar}
        location={location}
        loading={loading}
        leftLogo={LeftLogo}
        rightLogo={RightLogo}
        accentColor={timeTheme.accentColor}
      />

      {/* ── Main body: hero (left 60%) + prayer sidebar (right 40%) ─────── */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        <HeroPanel
          currentTime={currentTime}
          nextPrayer={nextPrayer}
          prayerTimes={prayerTimes}
          iqamahTimes={iqamahTimes}
          displayPrayerName={displayPrayerName}
          accentColor={timeTheme.accentColor}
          accentRgb={timeTheme.accentRgb}
        />

        {/* Prayer sidebar — only rendered once prayer times are loaded */}
        <div className="relative z-10 flex-1 overflow-hidden">
          {prayerTimes ? (
            <PrayerSidebar
              prayerTimes={prayerTimes}
              nextPrayer={nextPrayer}
              currentTime={currentTime}
              iqamahTimes={iqamahTimes}
              displayPrayerName={displayPrayerName}
              accentColor={timeTheme.accentColor}
              accentRgb={timeTheme.accentRgb}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/30 text-sm">Loading prayer times…</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Static bank-account footer ───────────────────────────────────── */}
      <div
        className="relative z-10 flex-shrink-0 flex items-center justify-center gap-6 px-6 py-2"
        style={{
          borderTop: `1px solid ${timeTheme.accentColor}40`,
          backgroundColor: 'rgba(0,0,0,0.40)',
        }}
      >
        {/* Bank icon */}
        <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#fbbf24' }}
             fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>

        <span className="text-white/50 text-xs font-medium uppercase tracking-widest">
          Donasi / Donation
        </span>

        <span className="text-white font-semibold font-mono"
              style={{ fontSize: 'clamp(0.85rem, 1.4vw, 1.1rem)' }}>
          Woori Bank&ensp;1005-904-584-084
        </span>

        <span className="text-white/50 text-sm">(서울이슬람교육센터)</span>

        <span style={{ color: timeTheme.accentColor + '70' }} className="text-sm">☪</span>

        <span className="text-white/40 text-xs italic">
          Center of Islamic Studies Seoul
        </span>
      </div>

      {/* ── Performance monitor ──────────────────────────────────────────── */}
      <PerformanceMonitor />

      {/* ── Debug time panel ─────────────────────────────────────────────── */}
      {DEBUG_MODE && (
        <div className="fixed top-4 right-4 z-50">
          {!showDebugPanel ? (
            <button
              onClick={() => setShowDebugPanel(true)}
              className="bg-purple-600/90 hover:bg-purple-700/90 text-white px-4 py-2 rounded-lg shadow-xl font-mono text-sm backdrop-blur-sm transition-colors"
            >
              🕐 Debug Time
            </button>
          ) : (
            <div className="bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-2xl border border-purple-500/50 font-mono text-sm min-w-[320px]">
              <div className="flex items-center justify-between mb-3 border-b border-white/20 pb-2">
                <h3 className="font-bold text-purple-400">⏰ Time Debug Control</h3>
                <button onClick={() => setShowDebugPanel(false)} className="text-white/60 hover:text-white transition-colors">✕</button>
              </div>
              <div className="space-y-3">
                <div className="bg-purple-900/30 p-2 rounded border border-purple-500/30">
                  <div className="text-xs text-purple-300 mb-1">Current Time:</div>
                  <div className="text-lg font-bold text-white">
                    {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false })}
                  </div>
                  <div className="text-xs text-white/70">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {debugTimeOffset !== 0 && (
                    <div className="text-xs text-green-400 mt-1">
                      ✓ Debug mode active (offset: {Math.round(debugTimeOffset / 60000)} min)
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-white/70 block mb-1">Set Debug Time (hh:mm:ss):</label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-purple-500/50 focus:border-purple-400 focus:outline-none"
                      onChange={(e) => {
                        if (e.target.value) {
                          const [hours, minutes] = e.target.value.split(':');
                          const targetTime = new Date();
                          targetTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                          setDebugTimeOffset(targetTime.getTime() - Date.now());
                        }
                      }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="ss"
                      className="w-16 bg-gray-800 text-white px-2 py-2 rounded border border-purple-500/50 focus:border-purple-400 focus:outline-none text-center"
                      onChange={(e) => {
                        const s = parseInt(e.target.value) || 0;
                        setDebugTimeOffset((prev) => {
                          const realNow = Date.now();
                          const currentDebug = realNow + prev;
                          const d = new Date(currentDebug);
                          d.setSeconds(s, 0);
                          return d.getTime() - realNow;
                        });
                      }}
                    />
                  </div>
                  <div className="text-xs text-white/50 mt-1">Clock will continue running from set time</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[['Fajr (05:00)', 5, 0], ['Dhuhr (12:30)', 12, 30], ['Asr (15:30)', 15, 30], ['Maghrib (18:00)', 18, 0]].map(([label, h, m]) => (
                    <button
                      key={label as string}
                      onClick={() => {
                        const t = new Date();
                        t.setHours(h as number, m as number, 0, 0);
                        setDebugTimeOffset(t.getTime() - Date.now());
                      }}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-xs transition-colors"
                    >
                      {label as string}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-green-400 block mb-1">🔊 Jump 2s before Iqamah:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => {
                      const timeStr = prayerTimes?.[prayer as keyof typeof prayerTimes];
                      if (!timeStr) return null;
                      const [h, m] = timeStr.split(':').map(Number);
                      const adhanMs = new Date();
                      adhanMs.setHours(h, m, 0, 0);
                      const eff = getEffectiveIqamah(timeStr, iqamahTimes[prayer] || 0, prayer, adhanMs);
                      const iqMs = adhanMs.getTime() + eff.effectiveMinutes * 60_000;
                      const targetMs = iqMs - 2000; // 2 seconds before iqamah
                      return (
                        <button
                          key={`iq-${prayer}`}
                          onClick={() => {
                            setDebugTimeOffset(targetMs - Date.now());
                          }}
                          className="bg-green-700 hover:bg-green-600 px-3 py-2 rounded text-xs transition-colors"
                        >
                          {displayPrayerName(prayer)} 🔊
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={() => setDebugTimeOffset(0)}
                  className="w-full bg-red-600/80 hover:bg-red-700/80 px-3 py-2 rounded text-sm transition-colors font-semibold"
                >
                  ↻ Reset to Real Time
                </button>
                <div className="border-t border-white/20 pt-3 mt-2">
                  <label className="text-xs text-white/70 block mb-2">Weather Effects Override:</label>
                  <div className="space-y-2">
                    {[
                      [null,   'Auto (Actual Weather)', 'green'],
                      ['Rain', '🌧️ Force Rain',         'blue'],
                      ['Snow', '❄️ Force Snow',          'cyan'],
                    ].map(([val, lbl, col]) => (
                      <button
                        key={String(lbl)}
                        onClick={() => setDebugWeatherEffect(val as string | null)}
                        className={`w-full px-3 py-2 rounded text-xs transition-colors ${
                          debugWeatherEffect === val
                            ? `bg-${col}-600 text-white`
                            : 'bg-gray-700 hover:bg-gray-600 text-white/70'
                        }`}
                      >
                        {debugWeatherEffect === val ? '✓ ' : ''}{lbl as string}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Iqamah settings panel ─────────────────────────────────────────── */}
      {DEBUG_MODE && (
        <div className="fixed top-4 right-4 z-50" style={{ marginTop: showDebugPanel ? '680px' : '60px' }}>
          {!showIqamahPanel ? (
            <button
              onClick={() => setShowIqamahPanel(true)}
              className="bg-orange-600/90 hover:bg-orange-700/90 text-white px-4 py-2 rounded-lg shadow-xl font-mono text-sm backdrop-blur-sm transition-colors"
            >
              ⏱️ Iqamah Settings
            </button>
          ) : (
            <div className="bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-2xl border border-orange-500/50 font-mono text-sm min-w-[320px]">
              <div className="flex items-center justify-between mb-3 border-b border-white/20 pb-2">
                <h3 className="font-bold text-orange-400">⏱️ Iqamah Time Control</h3>
                <button onClick={() => setShowIqamahPanel(false)} className="text-white/60 hover:text-white transition-colors">✕</button>
              </div>
              <div className="space-y-3">
                <div className="bg-orange-900/30 p-2 rounded border border-orange-500/30 mb-3">
                  <p className="text-xs text-orange-200">Configure when iqamah starts after each adhan time</p>
                </div>
                <h4 className="text-xs text-orange-300 font-bold mb-2">Minutes After Adhan:</h4>
                <div className="space-y-2">
                  {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                    <div key={prayer} className="flex items-center justify-between bg-gray-800/50 p-2 rounded">
                      <label className="text-sm text-white font-semibold w-24">{prayer}:</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIqamahTimes({ ...iqamahTimes, [prayer]: Math.max(0, iqamahTimes[prayer] - 1) })}
                          className="bg-orange-700 hover:bg-orange-800 px-2 py-1 rounded text-xs transition-colors"
                        >-</button>
                        <input
                          type="number" min="0" max="60"
                          value={iqamahTimes[prayer]}
                          onChange={(e) => setIqamahTimes({ ...iqamahTimes, [prayer]: parseInt(e.target.value) || 0 })}
                          className="w-16 bg-gray-800 text-white px-2 py-1 rounded border border-orange-500/50 focus:border-orange-400 focus:outline-none text-center text-sm"
                        />
                        <button
                          onClick={() => setIqamahTimes({ ...iqamahTimes, [prayer]: Math.min(60, iqamahTimes[prayer] + 1) })}
                          className="bg-orange-700 hover:bg-orange-800 px-2 py-1 rounded text-xs transition-colors"
                        >+</button>
                        <span className="text-xs text-white/70 ml-1 w-8">min</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
