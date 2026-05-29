import { useCallback, useEffect, useRef, useState } from 'react';

interface HadithEntry {
  id: string;
  text: string;
  chapterTitle: string;
  hadithNumber: string;
}

const HADITH_COLLECTION = 'riyadussalihin';
const HADITH_API_URL = `https://api.islamic.app/v1/hadith/random/${HADITH_COLLECTION}`;
const ROTATION_MS = 60_000;
const MAX_WORDS = 100;
const MAX_FETCH_ATTEMPTS = 20;
const DONATION_EVERY = 3;

function normalizeHadithText(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\[\s+/g, '[')
    .replace(/\s+\]/g, ']')
    .trim();
}

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

export default function RotatingVerse() {
  const [hadith, setHadith] = useState<HadithEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDonation, setShowDonation] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(ROTATION_MS / 1000);
  const currentIdRef = useRef<string | null>(null);
  const hadithsSinceDonationRef = useRef(0);
  const nextRefreshAtRef = useRef(Date.now() + ROTATION_MS);

  const applyHadith = useCallback((entry: HadithEntry) => {
    currentIdRef.current = entry.id;
    setHadith(entry);
    setShowDonation(false);
  }, []);

  const fetchRandomHadith = useCallback(async (): Promise<HadithEntry> => {
    for (let attempt = 0; attempt < MAX_FETCH_ATTEMPTS; attempt += 1) {
      const cacheBust = `_=${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const response = await fetch(`${HADITH_API_URL}?${cacheBust}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Hadith API responded with ${response.status}`);
      }

      const payload = await response.json();
      const data = payload?.data;
      const text = normalizeHadithText(data?.en?.text ?? '');

      if (!text) {
        continue;
      }

      if (countWords(text) > MAX_WORDS) {
        continue;
      }

      return {
        id: `${data.collection}-${data.hadithNumber}-${data.chapterId}`,
        text,
        chapterTitle: data?.chapterTitle?.en ?? 'Riyad us-Salihin',
        hadithNumber: data?.hadithNumber ?? '',
      };
    }

    throw new Error(`Could not find a Riyad us-Salihin hadith under ${MAX_WORDS} words`);
  }, []);

  const refreshHadith = useCallback(async () => {
    if (hadithsSinceDonationRef.current >= DONATION_EVERY) {
      hadithsSinceDonationRef.current = 0;
      setShowDonation(true);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let fallback: HadithEntry | null = null;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const entry = await fetchRandomHadith();
        fallback = entry;

        if (entry.id !== currentIdRef.current) {
          applyHadith(entry);
          hadithsSinceDonationRef.current += 1;
          setLoading(false);
          return;
        }
      }

      if (fallback) {
        applyHadith(fallback);
        hadithsSinceDonationRef.current += 1;
      }
    } catch (error) {
      console.error('Error loading Riyad us-Salihin hadith:', error);
      setShowDonation(false);
    } finally {
      setLoading(false);
    }
  }, [applyHadith, fetchRandomHadith]);

  useEffect(() => {
    nextRefreshAtRef.current = Date.now() + ROTATION_MS;
    setRemainingSeconds(ROTATION_MS / 1000);
    void refreshHadith();

    const refreshInterval = setInterval(() => {
      nextRefreshAtRef.current = Date.now() + ROTATION_MS;
      setRemainingSeconds(ROTATION_MS / 1000);
      void refreshHadith();
    }, ROTATION_MS);

    const countdownInterval = setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((nextRefreshAtRef.current - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [refreshHadith]);

  return (
    <div className="h-full flex items-center justify-center">
      <div
        className="relative w-full h-full rounded-2xl flex flex-col justify-center text-center px-6 py-6 md:px-10 md:py-8"
        style={{
          border: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(255,255,255,0.02)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <p className="text-white/40 text-xs uppercase tracking-[0.22em] mb-4">
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
                fontSize: 'clamp(1.05rem, 1.9vw, 1.55rem)',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 9,
                overflow: 'hidden',
              }}
            >
              {hadith?.text ?? (loading ? 'Loading hadith…' : 'Unable to load hadith right now.')}
            </p>

            {hadith && (
              <p className="text-white/38 text-xs mt-5">
                {hadith.chapterTitle} · Hadith {hadith.hadithNumber}
              </p>
            )}
          </>
        )}

        <div className="absolute bottom-4 right-4 text-white/35 text-[11px] font-mono tabular-nums">
          {remainingSeconds}s
        </div>
      </div>
    </div>
  );
}
