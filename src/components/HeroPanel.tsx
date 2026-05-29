import { useMemo } from 'react';
import RotatingVerse from './RotatingVerse';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface HeroPanelProps {
  currentTime: Date;
  nextPrayer: { name: string; time: Date } | null;
  prayerTimes: PrayerTimes | null;
  iqamahTimes: Record<string, number>;
  displayPrayerName: (name: string) => string;
  accentColor: string;
  accentRgb: string;
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
  displayPrayerName,
  accentColor,
  accentRgb,
}: HeroPanelProps) {
  const hh = zeroPad(currentTime.getHours());
  const mm = zeroPad(currentTime.getMinutes());
  const ss = zeroPad(currentTime.getSeconds());

  const countdown = useMemo(() => {
    if (!nextPrayer) return null;
    const diff = nextPrayer.time.getTime() - currentTime.getTime();

    if (diff > 0) {
      return { value: msToClock(diff), label: 'Until Adhan', isIqamah: false };
    }

    const iqMins = iqamahTimes[nextPrayer.name] ?? 0;
    const iqTime = new Date(nextPrayer.time.getTime() + iqMins * 60_000);
    const iqDiff = iqTime.getTime() - currentTime.getTime();
    if (iqDiff > 0) {
      return { value: msToClock(iqDiff), label: 'Until Iqamah', isIqamah: true };
    }

    return null;
  }, [nextPrayer, currentTime, iqamahTimes]);

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

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ width: '60%', padding: 'clamp(12px, 2vw, 28px)' }}
    >
      <div className="flex items-baseline gap-2 mb-4 flex-shrink-0">
        <span
          className="font-mono font-bold tabular-nums text-white select-none leading-none"
          style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)' }}
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
                  fontSize: '0.875rem',
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

      {prayerTimes && (
        <div className="flex-1 min-h-0 mt-2">
          <RotatingVerse />
        </div>
      )}
    </div>
  );
}
