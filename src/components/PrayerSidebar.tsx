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

const ARABIC_NAMES: Record<string, string> = {
  Fajr:    'الفجر',
  Sunrise: 'الشروق',
  Dhuhr:   'الظهر',
  Asr:     'العصر',
  Maghrib: 'المغرب',
  Isha:    'العشاء',
};

function zeroPad(n: number) {
  return n.toString().padStart(2, '0');
}

function msToClock(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${zeroPad(h)}:${zeroPad(m)}:${zeroPad(s)}`;
}

function getIqamahTimeStr(adhanTimeStr: string, iqamahMins: number, ref: Date): string {
  const [h, m] = adhanTimeStr.split(':').map(Number);
  const d = new Date(ref);
  d.setHours(h, m, 0, 0);
  const iq = new Date(d.getTime() + iqamahMins * 60_000);
  return `${zeroPad(iq.getHours())}:${zeroPad(iq.getMinutes())}`;
}

type CountdownResult =
  | { type: 'adhan';  value: string }
  | { type: 'iqamah'; value: string }
  | { type: 'offset'; value: string }
  | null;

function getCountdown(
  prayer: string,
  timeStr: string,
  isActive: boolean,
  iqamahMins: number,
  now: Date,
): CountdownResult {
  const [h, m] = timeStr.split(':').map(Number);
  const adhanDate = new Date(now);
  adhanDate.setHours(h, m, 0, 0);
  const iqamahDate = new Date(adhanDate.getTime() + iqamahMins * 60_000);
  const nowMs = now.getTime();

  if (!isActive) {
    if (iqamahMins > 0) {
      return { type: 'offset', value: `+${iqamahMins} min` };
    }
    return null;
  }

  if (adhanDate.getTime() > nowMs) {
    return { type: 'adhan', value: msToClock(adhanDate.getTime() - nowMs) };
  }
  if (iqamahDate.getTime() > nowMs) {
    return { type: 'iqamah', value: msToClock(iqamahDate.getTime() - nowMs) };
  }
  return null;
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
        const countdown = getCountdown(prayer, timeStr, isActive, iqMins, currentTime);
        const iqStr     = iqMins > 0
          ? getIqamahTimeStr(timeStr, iqMins, currentTime)
          : null;

        const nameColor = isSyuruq
          ? '#fbbf24'
          : isActive ? accentColor : 'rgba(255,255,255,0.88)';

        const subColor = isSyuruq
          ? 'rgba(251,191,36,0.65)'
          : isActive ? `${accentColor}bb` : 'rgba(255,255,255,0.40)';

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

            {/* Prayer name (Arabic + Latin) */}
            <div className="flex flex-col min-w-0" style={{ width: '35%' }}>
              <span
                className="font-serif leading-tight"
                dir="rtl"
                style={{
                  color: nameColor,
                  fontSize: 'clamp(0.85rem, 1.3vw, 1.15rem)',
                }}
              >
                {ARABIC_NAMES[prayer]}
              </span>
              <span
                className="text-xs font-medium mt-0.5"
                style={{ color: subColor }}
              >
                {displayPrayerName(prayer)}
              </span>
            </div>

            {/* Adhan time */}
            <div className="flex flex-col items-center flex-1">
              <span
                className="font-mono font-semibold tabular-nums"
                style={{
                  color: isActive ? accentColor : 'rgba(255,255,255,0.82)',
                  fontSize: 'clamp(1rem, 1.6vw, 1.4rem)',
                }}
              >
                {timeStr}
              </span>
              <span className="text-white/25 text-xs">Adhan</span>
            </div>

            {/* Iqamah column — Syuruq shows the +offset time without the "Iqamah" label */}
            <div className="flex flex-col items-end" style={{ width: '28%' }}>
              {countdown ? (
                <>
                  <span
                    className="font-mono font-bold tabular-nums"
                    style={{
                      fontSize: 'clamp(1rem, 1.5vw, 1.35rem)',
                      color:
                        countdown.type === 'iqamah' ? '#f59e0b'
                        : countdown.type === 'adhan'  ? accentColor
                        : 'rgba(255,255,255,0.50)',
                    }}
                  >
                    {countdown.value}
                  </span>
                  {!(isSyuruq && countdown.type !== 'adhan') && (
                    <span className="text-white/25 text-xs">
                      {countdown.type === 'iqamah' ? 'Until Iqamah'
                       : countdown.type === 'adhan'  ? 'Until Adhan'
                       : 'Iqamah'}
                    </span>
                  )}
                </>
              ) : iqStr ? (
                <>
                  <span
                    className="font-mono font-medium tabular-nums text-white/55"
                    style={{ fontSize: 'clamp(1rem, 1.5vw, 1.35rem)' }}
                  >
                    {iqStr}
                  </span>
                  {!isSyuruq && (
                    <span className="text-white/25 text-xs">Iqamah</span>
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
