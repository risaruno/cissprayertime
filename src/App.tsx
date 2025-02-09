import React, { useState, useEffect } from 'react';
import { Clock, MapPin } from 'lucide-react';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface CalendarData {
  gregorian: string;
  hijri: string;
}

function App() {
  const [location, setLocation] = useState('');
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [quranVerse, setQuranVerse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);
  const [countdown, setCountdown] = useState('');
  const [iqamahCountdown, setIqamahCountdown] = useState('');
  const [showIqamah, setShowIqamah] = useState(false);

  const fetchPrayerTimes = async (city: string) => {
    setLoading(true);
    setError('');
    try {
      const date = new Date();
      const response = await fetch(
        `https://api.aladhan.com/v1/timingsByCity/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?city=${city}&country=&method=3`
      );
      const data = await response.json();
      
      if (data.code === 200) {
        setPrayerTimes(data.data.timings);
        setCalendar({
          gregorian: data.data.date.gregorian.date,
          hijri: `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`
        });
        updateNextPrayer(data.data.timings);
      } else {
        setError('Location not found. Please try another city.');
      }
    } catch (err) {
      setError('Failed to fetch prayer times. Please try again.');
    }
    setLoading(false);
  };

  const updateNextPrayer = (times: PrayerTimes) => {
    const now = new Date();
    const prayers = Object.entries(times).slice(0, 7);
    const todayPrayers = prayers.map(([name, time]) => {
      const [hours, minutes] = time.split(':');
      const prayerTime = new Date();
      prayerTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return { name, time: prayerTime };
    });

    todayPrayers.sort((a, b) => a.time.getTime() - b.time.getTime());
    const next = todayPrayers.find(prayer => prayer.time > now);
    
    if (!next && todayPrayers.length > 0) {
      const tomorrowPrayer = {
        name: todayPrayers[0].name,
        time: new Date(todayPrayers[0].time.getTime() + 24 * 60 * 60 * 1000)
      };
      setNextPrayer(tomorrowPrayer);
    } else {
      setNextPrayer(next || null);
    }
  };

  const formatCountdown = (timeLeft: number) => {
    if (timeLeft <= 0) return '00:00:00';
    
    const hours = Math.floor(timeLeft / 3600000);
    const minutes = Math.floor((timeLeft % 3600000) / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (nextPrayer) {
        const now = new Date();
        const timeLeft = nextPrayer.time.getTime() - now.getTime();
        
        if (timeLeft > 0) {
          setCountdown(formatCountdown(timeLeft));
          setShowIqamah(false);
          setIqamahCountdown('');
        } else {
          const iqamahTime = new Date(nextPrayer.time.getTime() + 15 * 60000);
          const iqamahTimeLeft = iqamahTime.getTime() - now.getTime();
          
          if (iqamahTimeLeft > 0) {
            setShowIqamah(true);
            setIqamahCountdown(formatCountdown(iqamahTimeLeft));
          } else {
            setShowIqamah(false);
            setIqamahCountdown('');
            if (prayerTimes) {
              updateNextPrayer(prayerTimes);
            }
          }
          setCountdown('');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextPrayer, prayerTimes]);

  useEffect(() => {
    setQuranVerse('"Indeed, Allah is with those who are patient." - Quran 2:153');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}`
          );
          const data = await response.json();
          if (data.city) {
            setLocation(data.city);
            fetchPrayerTimes(data.city);
          }
        } catch (err) {
          console.error('Error getting location:', err);
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[url('https://i.ibb.co/1C78qrt/Syurk.png')] bg-cover bg-center bg-no-repeat before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-b before:from-black/60 before:via-black/40 before:to-black/60 relative">
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Mosque Headings with Logos */}
        <div className="text-center mb-12">
          <div className="flex justify-between items-center mb-6">
            {/* Masjid Logo */}
            <div className="w-32 h-32 rounded-full bg-white/90 flex items-center justify-center p-2 shadow-lg">
              <img 
                src="https://i.ibb.co/67ryryXq/95-A7-D371-3-D76-4295-A5-E9-9936-DFACE58-B-L0-001-22-3-2024-23-05-24.png"
                alt="Masjid Logo" 
                className="h-64 w-64 object-contain"
              />
            </div>
            
            {/* Headings */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-arabic tracking-wide text-white">
                Masjid Al-Falah, Seoul
              </h1>
              <h2 className="text-4xl md:text-2xl text-blue-200 font-semibold">
                Center of Islamic Studies Seoul
              </h2>
              <h2 className="text-4xl md:text-2xl text-blue-200 font-semibold">
                {/* <MapPin className="w-5 h-5 mr-2" /> */}
                서울특별시 영등포구 신길로 60다길21
              </h2>
            </div>
            
            {/* CISS Logo */}
            <div className="w-32 h-32 rounded-full bg-white/90 flex items-center justify-center p-2 shadow-lg">
              <img 
                src="https://i.ibb.co/x4M6nHv/CISS-Transparent.png" 
                alt="CISS Logo" 
                className="h-64 w-64 object-contain"
              />
            </div>
          </div>
          
          <div className="flex flex-col items-center space-y-2 text-gray-200">
            <p className="text-5xl">
              1005-904-584-084 Woori Bank (서울이슬람교육센터)
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Calendar */}
          <div>
            {calendar && (
              <div className="h-full">
                <div className="h-full p-6 rounded-lg bg-black/30 backdrop-blur-md text-center flex flex-col justify-center">
                  <h2 className="text-2xl font-semibold mb-4 text-white">Today's Date</h2>
                  <div className="space-y-3">
                    <p className="text-xl text-gray-200">{calendar.gregorian}</p>
                    <p className="text-xl font-arabic text-gray-200">{calendar.hijri}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Next Prayer */}
          <div>
            {nextPrayer && (countdown || showIqamah) && (
              <div className="h-full p-6 rounded-lg bg-black/30 backdrop-blur-md text-center flex flex-col justify-center">
                <h3 className="text-2xl font-semibold mb-4 text-white">Next Prayer: {nextPrayer.name}</h3>
                {countdown && (
                  <>
                    <div className="text-4xl font-bold font-mono mb-3 text-white">{countdown}</div>
                    <p className="text-blue-200 text-lg">Until Adhan</p>
                  </>
                )}
                
                {showIqamah && iqamahCountdown && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="text-3xl font-bold font-mono mb-2 text-white">{iqamahCountdown}</div>
                    <p className="text-blue-200 text-lg">Until Iqamah</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Prayer Times Display */}
        {prayerTimes && (
          <div className="max-w-8xl mx-auto grid grid-cols-2 md:grid-cols-7 gap-4">
            {Object.entries(prayerTimes).slice(0, 7).map(([prayer, time]) => (
              <div
                key={prayer}
                className={`p-6 rounded-lg backdrop-blur-md transition-colors ${
                  nextPrayer?.name === prayer 
                    ? 'bg-black/50 ring-2 ring-blue-400/50' 
                    : 'bg-black/30 hover:bg-black/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">{prayer}</h3>
                </div>
                <p className="text-2xl text-center mt-2 text-gray-200">{time}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quran Verse */}
        <div className="fixed bottom-0 left-0 w-full bg-black/50 backdrop-blur-md py-6">
          <p className="text-center text-2xl font-arabic animate-scroll text-white">
            {quranVerse}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;