import { useMemo, useEffect, useRef } from 'react';
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

function playBeep(ctx: AudioContext) {
  const now = ctx.currentTime;
  const beepMs = 0.18;   // 180 ms each beep
  const gapMs = 0.18;    // 180 ms gap
  const count = 3;

  for (let i = 0; i < count; i++) {
    const t0 = now + i * (beepMs + gapMs);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, t0);
    gain.gain.setValueAtTime(0, t0 + beepMs);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + beepMs + 0.01);
  }
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

  const lastBeepedPrayerRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ── Clean up AudioContext on unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  // ── Iqamah beep: fire once when countdown reaches 2 seconds left ──────
  useEffect(() => {
    if (!nextPrayer) return;

    // Reset the beep guard when we leave iqamah phase (next prayer cycle)
    if (!countdown?.isIqamah) {
      if (lastBeepedPrayerRef.current !== null) {
        lastBeepedPrayerRef.current = null;
      }
      return;
    }

    const iqMins = iqamahTimes[nextPrayer.name] ?? 0;
    const iqTime = new Date(nextPrayer.time.getTime() + iqMins * 60_000);
    const iqDiff = iqTime.getTime() - currentTime.getTime();

    // Only fire at 2s or less, and only once per prayer per cycle
    if (iqDiff <= 2000 && iqDiff > 0 && lastBeepedPrayerRef.current !== nextPrayer.name) {
      lastBeepedPrayerRef.current = nextPrayer.name;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        // Resume if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => playBeep(ctx)).catch(() => {});
        } else {
          playBeep(ctx);
        }
      } catch {
        // Audio not available
      }
    }
  }, [currentTime, nextPrayer, countdown, iqamahTimes]);

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
