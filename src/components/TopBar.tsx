import { MapPin } from 'lucide-react';

interface CalendarData {
  hijri: string;
  gregorian: string;
}

interface TopBarProps {
  calendar: CalendarData | null;
  location: string;
  loading: boolean;
  leftLogo: string;
  rightLogo: string;
  accentColor: string;
}

export default function TopBar({
  calendar,
  location,
  loading,
  leftLogo,
  rightLogo,
  accentColor,
}: TopBarProps) {
  return (
    <div
      className="relative z-10 w-full flex items-center px-6 py-3 flex-shrink-0"
      style={{ borderBottom: `1px solid ${accentColor}40` }}
    >
      {/* ── Left: logos + mosque identity ─────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <img
          src={leftLogo}
          alt="CISS Logo"
          className="w-11 h-11 rounded-full object-contain bg-white/10 p-1"
        />
        <img
          src={rightLogo}
          alt="Masjid Logo"
          className="w-11 h-11 rounded-full object-contain bg-white/10 p-1"
        />
        <div className="ml-1">
          <h1 className="font-display font-bold text-white leading-tight"
              style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.25rem)' }}>
            Masjid Al-Falah, Seoul
          </h1>
          <p className="text-white/50 text-xs">Center of Islamic Studies Seoul</p>
        </div>
      </div>

      {/* ── Centre: Hijri date ─────────────────────────────────────────────── */}
      <div className="flex-1 text-center px-4">
        {calendar ? (
          <span
            className="font-serif text-white/85"
            style={{ fontSize: 'clamp(0.85rem, 1.4vw, 1.1rem)' }}
          >
            ◆&ensp;{calendar.hijri}&ensp;◆
          </span>
        ) : (
          <span className="text-white/30 text-sm">Loading calendar…</span>
        )}
      </div>

      {/* ── Right: Gregorian date + location ──────────────────────────────── */}
      <div className="flex-shrink-0 text-right">
        {calendar && (
          <p className="text-white/80 font-medium"
             style={{ fontSize: 'clamp(0.75rem, 1.2vw, 0.95rem)' }}>
            {calendar.gregorian}
          </p>
        )}
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-white/40" />
          <span className="text-white/40 text-xs">
            {loading ? 'Locating…' : (location || 'Seoul')}
          </span>
        </div>
      </div>
    </div>
  );
}
