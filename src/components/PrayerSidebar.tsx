import { getEffectiveIqamah } from '../utils/iqamah';

interface PrayerTimes {
  Fajr:    string;
  Sunrise: string;
  Dhuhr:   string;
  Asr:     string;
  Maghrib: string;
  Isha:    string;
}

interface PrayerSidebarProps {
  prayerTimes: PrayerTimes;
  nextPrayer: { name: string; time: Date } | null;
  currentTime: Date;
  iqamahTimes: Record<string, number>;
  displayPrayerName: (name: string) => string;
  accentColor: string;
  accentRgb: string;
}

export default function PrayerSidebar({
  prayerTimes,
  nextPrayer,
  currentTime,
  iqamahTimes,
  displayPrayerName,
  accentColor,
  accentRgb,
}: PrayerSidebarProps) {
  const entries = Object.entries(prayerTimes) as [keyof PrayerTimes, string][];

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}
    >
      {entries.map(([prayer, timeStr], idx) => {
        const isActive  = nextPrayer?.name === prayer;
        const isSyuruq  = prayer === 'Sunrise';
        const iqMins    = iqamahTimes[prayer] ?? 0;

        // Compute effective iqamah (respecting Subuh/Isya caps)
        const effective = iqMins > 0
          ? getEffectiveIqamah(timeStr, iqMins, prayer, currentTime)
          : null;

        // Right column: always show offset label + iqamah time
        // (countdown is already in HeroPanel)
        const rightLabel = effective && effective.effectiveMinutes > 0
          ? `(+${effective.effectiveMinutes} min)`
          : null;
        const rightTime  = effective && effective.effectiveMinutes > 0
          ? effective.iqamahTimeStr
          : null;

        const subColor = 'rgba(255,255,255,0.92)';

        return (
          <div
            key={prayer}
            className="flex-1 flex items-center relative px-5"
            style={{
              borderLeft: isActive ? `4px solid ${accentColor}` : '4px solid transparent',
              borderBottom: idx < entries.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              background: isActive
                ? `linear-gradient(90deg, rgba(${accentRgb},0.13) 0%, transparent 70%)`
                : 'transparent',
            }}
          >
            {/* Prayer name (Latin) */}
            <div className="flex items-center min-w-0" style={{ width: '35%' }}>
              <span
                className="font-bold leading-none uppercase text-left truncate"
                style={{
                  color: subColor,
                  fontSize: '16px',
                  letterSpacing: '0.06em',
                }}
              >
                {displayPrayerName(prayer)}
              </span>
            </div>

            {/* Adhan time — Syuruq does NOT get the "Adhan" label */}
            <div className="flex flex-col items-center flex-1">
              <span
                className="font-mono font-semibold tabular-nums"
                style={{
                  color: isActive ? accentColor : 'rgba(255,255,255,0.82)',
                  fontSize: 'clamp(1.18rem, 1.95vw, 1.7rem)',
                }}
              >
                {timeStr}
              </span>
              {!isSyuruq && (
                <span
                  className="text-white/25"
                  style={{ fontSize: 'clamp(0.78rem, 0.9vw, 0.92rem)' }}
                >
                  Adhan
                </span>
              )}
            </div>

            {/* Iqamah column */}
            <div className="flex flex-col items-end" style={{ width: '28%' }}>
              {rightLabel && rightTime ? (
                <>
                  <span
                    className="font-mono font-medium tabular-nums text-white/45"
                    style={{ fontSize: 'clamp(0.72rem, 0.82vw, 0.82rem)' }}
                  >
                    {rightLabel}
                  </span>
                  <span
                    className="font-mono font-semibold tabular-nums"
                    style={{
                      color: isActive ? accentColor : 'rgba(255,255,255,0.82)',
                      fontSize: 'clamp(1.18rem, 1.95vw, 1.7rem)',
                    }}
                  >
                    {rightTime}
                  </span>
                  {!isSyuruq && (
                    <span
                      className="text-white/25"
                      style={{ fontSize: 'clamp(0.78rem, 0.9vw, 0.92rem)' }}
                    >
                      Iqamah
                    </span>
                  )}
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
