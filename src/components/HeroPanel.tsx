import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import CelestialArc from './CelestialArc';
import RotatingVerse from './RotatingVerse';

interface PrayerTimes {
  Fajr:    string;
  Sunrise: string;
  Dhuhr:   string;
  Asr:     string;
  Maghrib: string;
  Isha:    string;
}

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  location: string;
  main: string;
  moonPhase?: number;
  latitude?: number;
  longitude?: number;
}

interface HeroPanelProps {
  currentTime: Date;
  nextPrayer: { name: string; time: Date } | null;
  prayerTimes: PrayerTimes | null;
  iqamahTimes: Record<string, number>;
  weather: WeatherData | null;
  isDaytime: boolean;
  displayPrayerName: (name: string) => string;
  getWeatherIcon: (iconCode: string) => string;
  quotes: string[];
  accentColor: string;
  accentRgb: string;
  location: string;
}

function zeroPad(n: number) {
  return n.toString().padStart(2, '0');
}

function msToClock(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${zeroPad(h)}:${zeroPad(m)}:${zeroPad(s)}`;
}

export default function HeroPanel({
  currentTime,
  nextPrayer,
  prayerTimes,
  iqamahTimes,
  weather,
  isDaytime,
  displayPrayerName,
  getWeatherIcon,
  quotes,
  accentColor,
  accentRgb,
  location,
}: HeroPanelProps) {
  /* ── Clock display ────────────────────────────────────────────────────── */
  const hh = zeroPad(currentTime.getHours());
  const mm = zeroPad(currentTime.getMinutes());
  const ss = zeroPad(currentTime.getSeconds());

  /* ── Next-prayer countdown ────────────────────────────────────────────── */
  const countdown = useMemo(() => {
    if (!nextPrayer) return null;
    const diff = nextPrayer.time.getTime() - currentTime.getTime();

    if (diff > 0) {
      return { value: msToClock(diff), label: 'Until Adhan', isIqamah: false };
    }

    // Past adhan → iqamah countdown
    const iqMins = iqamahTimes[nextPrayer.name] ?? 0;
    const iqTime = new Date(nextPrayer.time.getTime() + iqMins * 60_000);
    const iqDiff = iqTime.getTime() - currentTime.getTime();
    if (iqDiff > 0) {
      return { value: msToClock(iqDiff), label: 'Until Iqamah', isIqamah: true };
    }
    return null;
  }, [nextPrayer, currentTime, iqamahTimes]);

  /* ── Iqamah time string for banner subtitle ───────────────────────────── */
  const iqamahTimeStr = useMemo(() => {
    if (!nextPrayer || !prayerTimes) return null;
    const t = prayerTimes[nextPrayer.name as keyof PrayerTimes];
    if (!t) return null;
    const iqMins = iqamahTimes[nextPrayer.name] ?? 0;
    if (!iqMins) return null;
    const [h, m] = t.split(':').map(Number);
    const adhan = new Date(currentTime);
    adhan.setHours(h, m, 0, 0);
    const iq = new Date(adhan.getTime() + iqMins * 60_000);
    return `${zeroPad(iq.getHours())}:${zeroPad(iq.getMinutes())}`;
  }, [nextPrayer, prayerTimes, iqamahTimes, currentTime]);

  /* ── Celestial-arc progress ───────────────────────────────────────────── */
  const celestialProgress = useMemo(() => {
    if (!prayerTimes) return 0.5;

    const parseMs = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      const d = new Date(currentTime);
      d.setHours(h, m, 0, 0);
      return d.getTime();
    };

    const nowMs     = currentTime.getTime();
    const sunriseMs = parseMs(prayerTimes.Sunrise);
    const maghribMs = parseMs(prayerTimes.Maghrib);

    if (isDaytime) {
      return Math.max(0.01, Math.min(0.99, (nowMs - sunriseMs) / (maghribMs - sunriseMs)));
    }

    // Night: maghrib → next sunrise
    let nextSunriseMs = sunriseMs;
    if (nextSunriseMs <= nowMs) nextSunriseMs += 24 * 3_600_000;
    const nightSpan = nextSunriseMs - maghribMs;
    const elapsed   = nowMs < maghribMs ? 0 : nowMs - maghribMs;
    return Math.max(0.01, Math.min(0.99, elapsed / nightSpan));
  }, [prayerTimes, currentTime, isDaytime]);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ width: '60%', padding: 'clamp(12px, 2vw, 28px)' }}
    >
      {/* ── CLOCK SECTION ─────────────────────────────────────────────────── */}
      <div className="flex items-baseline gap-2 mb-4 flex-shrink-0">
        <span
          className="font-mono font-bold tabular-nums text-white select-none leading-none"
          style={{
            fontSize: 'clamp(3rem, 6vw, 5.5rem)',
          }}
        >
          {hh}:{mm}
        </span>
        <span
          className="font-mono font-semibold tabular-nums leading-none"
          style={{
            color: accentColor,
            fontSize: 'clamp(1.5rem, 3vw, 2.8rem)',
          }}
        >
          :{ss}
        </span>
      </div>

      {/* ── NEXT PRAYER BANNER ─────────────────────────────────────────────── */}
      {nextPrayer && (
        <div
          className="rounded-xl flex-shrink-0 mb-4"
          style={{
            padding: 'clamp(10px, 1.5vw, 18px)',
            background: `linear-gradient(135deg, rgba(${accentRgb},0.18) 0%, rgba(${accentRgb},0.06) 100%)`,
            border: `1px solid rgba(${accentRgb},0.28)`,
            boxShadow: `0 0 28px rgba(${accentRgb},0.08)`,
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">
                Next Prayer
              </p>
              <p
                className="font-display font-bold leading-tight"
                style={{
                  color: accentColor,
                  fontSize: 'clamp(1.3rem, 2.2vw, 2rem)',
                }}
              >
                {displayPrayerName(nextPrayer.name)}
              </p>
              {iqamahTimeStr && (
                <p className="text-white/40 text-xs mt-1">
                  Iqamah at {iqamahTimeStr}
                </p>
              )}
            </div>

            {countdown && (
              <div className="text-right flex-shrink-0">
                <p className="text-white/40 text-xs mb-1">{countdown.label}</p>
                <p
                  className="font-mono font-bold tabular-nums"
                  style={{
                    fontSize: 'clamp(1.2rem, 2vw, 1.8rem)',
                    color: countdown.isIqamah ? '#f59e0b' : accentColor,
                  }}
                >
                  {countdown.value}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CELESTIAL ARC ──────────────────────────────────────────────────── */}
      {prayerTimes && (
        <div className="flex-1 flex items-end min-h-0">
          <div className="w-full">
            <CelestialArc
              isDaytime={isDaytime}
              progress={celestialProgress}
              moonPhase={weather?.moonPhase}
              latitude={weather?.latitude}
              longitude={weather?.longitude}
            />
          </div>
        </div>
      )}

      {/* ── BOTTOM ROW: weather + verse ────────────────────────────────────── */}
      <div className="flex items-start gap-4 mt-3 flex-shrink-0">
        {/* Weather widget */}
        {weather && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <img
              src={getWeatherIcon(weather.icon)}
              alt={weather.description}
              className="object-contain"
              style={{ width: 44, height: 44 }}
            />
            <div>
              <p className="text-white font-semibold leading-none"
                 style={{ fontSize: 'clamp(1rem, 1.6vw, 1.3rem)' }}>
                {weather.temp}°C
              </p>
              <p className="text-white/45 text-xs capitalize mt-0.5">
                {weather.description}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-white/30" />
                <span className="text-white/30 text-xs">{location}</span>
              </div>
            </div>
          </div>
        )}

        {/* Rotating Quran verse */}
        <div className="flex-1 min-w-0">
          <RotatingVerse quotes={quotes} />
        </div>
      </div>
    </div>
  );
}
