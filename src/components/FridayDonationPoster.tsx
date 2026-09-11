import { Heart, Landmark } from 'lucide-react';
import { useEffect, useState } from 'react';
import donationPoster from '../assets/friday-donation.png';
import donationPosterEnglish from '../assets/friday-donation-en.png';

const POSTERS = [
  { src: donationPoster, alt: 'Sedekah jariyah operasional Masjid Al-Falah Seoul. Kebutuhan per bulan 3.100.000 won. Woori Bank 1005-904-584-084 atas nama 서울이슬람교육센터. QRIS Indonesia tersedia pada poster.' },
  { src: donationPosterEnglish, alt: 'Open donation: Masjid Al-Falah Seoul operational fund. Monthly expenses: 3,100,000 won. Woori Bank 1005-904-584-084, 서울이슬람교육센터. Scan the poster QR code for QRIS Indonesia.' },
];

// Advance to the next slide every 15 seconds.
const SLIDE_INTERVAL_MS = 15_000;

interface FridayDonationPosterProps {
  accentColor: string;
  accentRgb: string;
}

export default function FridayDonationPoster({
  accentColor,
  accentRgb,
}: FridayDonationPosterProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [readyPosters, setReadyPosters] = useState<boolean[]>(() => POSTERS.map(() => false));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide(previous => {
        for (let step = 1; step <= POSTERS.length; step++) {
          const next = (previous + step) % POSTERS.length;
          if (readyPosters[next]) return next;
        }
        return 0;
      });
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [readyPosters]);

  return (
    <section
      className="friday-poster relative h-full min-h-0 overflow-hidden rounded-2xl"
      aria-label="Poster donasi Jumat"
      style={{
        border: `1px solid rgba(${accentRgb},0.42)`,
        background: `linear-gradient(145deg, rgba(${accentRgb},0.20), rgba(3,24,19,0.90) 54%, rgba(5,12,10,0.96))`,
        boxShadow: `0 20px 70px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.08)`,
      }}
    >
      <div className="friday-poster__glow" style={{ background: accentColor }} />
      <div className="friday-poster__arch" aria-hidden="true" />

      {POSTERS.map((poster, index) => (<div
        key={poster.src}
        className="friday-slide friday-poster-layout absolute inset-0 z-20"
        data-visible={activeSlide === index}
        aria-hidden={activeSlide !== index}
      >
        <div className="friday-poster-message">
          <span className="friday-poster-eyebrow"><Heart size={16} /> {index === 0 ? 'BERBAGI KEBAIKAN' : 'GIVE WITH HEART'}</span>
          <h2>{index === 0 ? 'Bersama, makmurkan masjid kita.' : 'Together, support our masjid.'}</h2>
          <p>{index === 0 ? 'Sedekah Anda mendukung kegiatan dan operasional Masjid Al-Falah Seoul.' : 'Your generosity supports the activities and daily operations of Masjid Al-Falah Seoul.'}</p>
          <div className="friday-poster-account">
            <Landmark size={24} />
            <span>WOORI BANK<strong>1005-904-584-084</strong><small>서울이슬람교육센터</small></span>
          </div>
          <span className="friday-poster-thanks">{index === 0 ? 'Jazakumullahu khairan atas kebaikan Anda' : 'Jazakumullahu khairan for your generosity'}</span>
        </div>
        <img
          src={poster.src}
          alt={poster.alt}
          className="friday-poster-image"
          onLoad={() => setReadyPosters(previous => previous.map((ready, i) => i === index ? true : ready))}
          onError={() => {
            setReadyPosters(previous => previous.map((ready, i) => i === index ? false : ready));
            setActiveSlide(previous => previous === index ? Math.max(0, readyPosters.findIndex((ready, i) => ready && i !== index)) : previous);
          }}
        />
      </div>))}
    </section>
  );
}
