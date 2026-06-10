import { useCallback, useEffect, useRef, useState } from 'react';
import hadithPoolData from '../data/hadith-30-words.json';

interface HadithEntry {
  collection: string;
  chapterTitle: string;
  hadithNumber: string;
  reference: number;
  text: string;
}

const ROTATION_MS = 60_000;
const DONATION_EVERY = 3;
const DEBUG_MODE = import.meta.env.VITE_DEBUG === 'true';

export default function RotatingVerse() {
  const [hadith, setHadith] = useState<HadithEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDonation, setShowDonation] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(ROTATION_MS / 1000);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const poolRef = useRef<HadithEntry[]>([]);
  const poolIndexRef = useRef(0);
  const hadithsSinceDonationRef = useRef(0);
  const nextRefreshAtRef = useRef(Date.now() + ROTATION_MS);
  const currentHadithIdRef = useRef<number | null>(null);

  /** Pull next hadith from pool (interleaves donations every N rotations). */
  const showNextFromPool = useCallback(() => {
    if (hadithsSinceDonationRef.current >= DONATION_EVERY) {
      hadithsSinceDonationRef.current = 0;
      setShowDonation(true);
      setLoading(false);
      return;
    }

    const pool = poolRef.current;
    if (pool.length === 0) {
      setHadith(null);
      setLoading(false);
      return;
    }

    let entry = pool[poolIndexRef.current % pool.length];

    // Avoid showing the same hadith twice in a row (only if pool has >1)
    if (pool.length > 1 && entry.reference === currentHadithIdRef.current) {
      poolIndexRef.current += 1;
      entry = pool[poolIndexRef.current % pool.length];
    }

    poolIndexRef.current += 1;

    // Wrap around: reset to start when we've gone through all hadiths
    if (poolIndexRef.current >= pool.length) {
      poolIndexRef.current = 0;
    }

    setHadith(entry);
    setShowDonation(false);
    setLoading(false);
    hadithsSinceDonationRef.current += 1;
    currentHadithIdRef.current = entry.reference;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mount: load the static pool ──────────────────────────────────────────
  useEffect(() => {
    poolRef.current = hadithPoolData as HadithEntry[];
    poolIndexRef.current = 0;
    showNextFromPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Rotation timer (speed-aware) + countdown ─────────────────────────────
  useEffect(() => {
    const intervalMs = ROTATION_MS / speedMultiplier;
    nextRefreshAtRef.current = Date.now() + intervalMs;
    setRemainingSeconds(intervalMs / 1000);

    const refreshInterval = setInterval(() => {
      nextRefreshAtRef.current = Date.now() + intervalMs;
      setRemainingSeconds(intervalMs / 1000);
      showNextFromPool();
    }, intervalMs);

    const countdownInterval = setInterval(() => {
      const secondsLeft = Math.max(
        0,
        Math.ceil((nextRefreshAtRef.current - Date.now()) / 1000),
      );
      setRemainingSeconds(secondsLeft);
    }, 1000 / Math.max(1, speedMultiplier / 2));

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [showNextFromPool, speedMultiplier]);

  // ── 1 AM: reset to start of pool for fresh daily cycle ───────────────────
  useEffect(() => {
    let lastDay = new Date().toISOString().slice(0, 10);

    const checkOneAm = () => {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const hour = now.getHours();

      if (hour === 1 && today !== lastDay) {
        lastDay = today;
        poolIndexRef.current = 0;
      }
    };

    const interval = setInterval(checkOneAm, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex items-center justify-center">
      <div
        className="relative w-full h-full rounded-2xl flex flex-col text-center p-3"
        style={{
          border: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(255,255,255,0.02)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <p className="text-white/40 text-xs uppercase tracking-[0.22em] mb-2">
          {showDonation ? 'Masjid Donation' : 'Riyad us-Salihin Hadith'}
        </p>

        {showDonation ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <p
              className="text-white font-semibold font-mono"
              style={{
                fontSize: 'clamp(1.2rem, 2.1vw, 1.8rem)',
              }}
            >
              SUPPORT OUR MASJID
            </p>
            <div className="flex flex-col items-center gap-1">
              <p
                className="text-white font-semibold font-mono"
                style={{
                  fontSize: 'clamp(1.2rem, 2.15vw, 1.85rem)',
                }}
              >
                WOORI BANK
              </p>
              <p
                className="text-white font-semibold font-mono"
                style={{
                  fontSize: 'clamp(1.3rem, 2.45vw, 2.1rem)',
                }}
              >
                1005-904-584-084
              </p>
            </div>
            <p className="text-white font-semibold font-mono" style={{ fontSize: 'clamp(0.95rem, 1.35vw, 1.15rem)' }}>
              (서울이슬람교육센터)
            </p>
          </div>
        ) : (
          <>
            <p
              className="text-white/88 font-medium leading-relaxed"
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '0.95rem',
              }}
            >
              {hadith?.text ?? (loading ? 'Loading hadith…' : 'Unable to load hadith right now.')}
            </p>

            {hadith && (
              <p className="text-white/38 text-xs mt-3">
                {hadith.chapterTitle}:{hadith.hadithNumber} · Riyad us-Salihin:{hadith.reference}
              </p>
            )}
          </>
        )}

        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {DEBUG_MODE && (
            <button
              onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 10 : 1)}
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono border transition-colors ${
                speedMultiplier > 1
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                  : 'text-white/20 border-white/10 hover:text-white/50'
              }`}
            >
              {speedMultiplier}x
            </button>
          )}
          <span className="text-white/35 text-[11px] font-mono tabular-nums">
            {remainingSeconds}s
          </span>
        </div>
      </div>
    </div>
  );
}
