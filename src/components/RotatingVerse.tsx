import { useState, useEffect } from 'react';

interface RotatingVerseProps {
  quotes: string[];
}

export default function RotatingVerse({ quotes }: RotatingVerseProps) {
  const [index, setIndex]     = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (quotes.length === 0) return;
    const interval = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setIndex(i => (i + 1) % quotes.length);
        setOpacity(1);
      }, 700);
    }, 30000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  if (!quotes.length) return null;

  return (
    <div
      className="px-4 py-3 rounded-lg text-center"
      style={{
        opacity,
        transition: 'opacity 0.7s ease-in-out',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <p className="font-serif italic text-white/65 leading-relaxed"
         style={{ fontSize: 'clamp(0.7rem, 1.1vw, 0.9rem)' }}>
        {quotes[index]}
      </p>
    </div>
  );
}
