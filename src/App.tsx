import { useState, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import Glass from './components/Glass';
import CelestialBody from './components/CelestialBody';

// Import background images
import AfterAsr from './assets/bg/After Asr.png';
import AfterMagrib from './assets/bg/After Magrib.png';
import AfterSubh from './assets/bg/After Subh.png';
import BeforeMagrib from './assets/bg/Before Magrib.png';
import Dhuha from './assets/bg/Dhuha - Half Dhuha.png';
import DzuhurAsr from './assets/bg/Dzuhur - Asr.png';
import HalfDhuha from './assets/bg/Half Dhuha - Dzuhur.png';
import IsyaMidnight from './assets/bg/Isya - Midnight.png';
import Magrib from './assets/bg/Magrib.png';
import MidnightSubh from './assets/bg/Midnight - Subh.png';
import Syurk from './assets/bg/Syurk.png';

// Import logos
import LeftLogo from './assets/logo/left.png';
import RightLogo from './assets/logo/right.png';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  location: string;
  main: string;
  moonPhase?: number; // 0-1, where 0/1 = new moon, 0.5 = full moon
}

interface CalendarData {
  hijri: string;
  gregorian: string;
}

const WEATHER_API_KEY = 'b54309c9b04e978316c900d5f5149ab3';

const QURAN_QUOTES = [
  '"Indeed, Allah is with those who are patient." - Quran 2:153',
  '"And He found you lost and guided [you]." - Quran 93:7',
  '"So verily, with the hardship, there is relief." - Quran 94:5',
  '"Indeed, with hardship [will be] ease." - Quran 94:6',
  '"And whoever relies upon Allah - then He is sufficient for him." - Quran 65:3',
  '"Indeed, Allah does not burden a soul beyond that it can bear." - Quran 2:286',
  '"And He is with you wherever you are." - Quran 57:4',
  '"Remember Me; I will remember you." - Quran 2:152',
  '"Indeed, my Lord is near and responsive." - Quran 11:61',
  '"Allah is the best of planners." - Quran 8:30',
];

function App() {
  const [location, setLocation] = useState('Seoul');
  const [loading, setLoading] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [backgroundImage, setBackgroundImage] = useState(Syurk);
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  
  // format current time
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  

  // Fetch weather data
  const fetchWeather = useCallback(async (city: string) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
      );
      const data = await response.json();
      
      if (data.cod === 200) {
        // Get moon phase from One Call API
        let moonPhase = undefined;
        try {
          const oneCallResponse = await fetch(
            `https://api.openweathermap.org/data/3.0/onecall?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${WEATHER_API_KEY}&exclude=minutely,hourly,alerts`
          );
          const oneCallData = await oneCallResponse.json();
          if (oneCallData.daily && oneCallData.daily[0]) {
            moonPhase = oneCallData.daily[0].moon_phase;
          }
        } catch (moonErr) {
          console.error('Error fetching moon phase:', moonErr);
        }
        
        setWeather({
          temp: Math.round(data.main.temp),
          description: data.weather[0].main,
          icon: data.weather[0].icon,
          location: data.name,
          main: data.weather[0].main,
          moonPhase
        });
      }
    } catch (err) {
      console.error('Error fetching weather:', err);
    }
  }, []);

  // Fetch prayer times
  const fetchPrayerTimes = useCallback(async (city: string) => {
    setLoading(true);
    try {
      const date = new Date();
      const response = await fetch(
        `https://api.aladhan.com/v1/timingsByCity/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?city=${city}&country=&method=3`
      );
      const data = await response.json();
      
      if (data.code === 200) {
        const filteredTimings: PrayerTimes = {
          Fajr: data.data.timings.Fajr,
          Sunrise: data.data.timings.Sunrise,
          Dhuhr: data.data.timings.Dhuhr,
          Asr: data.data.timings.Asr,
          Maghrib: data.data.timings.Maghrib,
          Isha: data.data.timings.Isha,
        };
        
        setPrayerTimes(filteredTimings);
        updateNextPrayer(filteredTimings);
        
        // Set calendar data
        setCalendar({
          hijri: `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year} H`,
          gregorian: `${data.data.date.gregorian.weekday.en}, ${data.data.date.gregorian.day} ${data.data.date.gregorian.month.en} ${data.data.date.gregorian.year}`
        });
      }
    } catch (err) {
      console.error('Error fetching prayer times:', err);
    }
    setLoading(false);
  }, []);

  // Update next prayer
  const updateNextPrayer = (times: PrayerTimes) => {
    const now = new Date();
    // Exclude Sunrise from next prayer calculation (it's not a prayer time)
    const prayers = Object.entries(times).filter(([name]) => name !== 'Sunrise');
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

  // Determine background based on time of day
  const updateBackground = useCallback((times: PrayerTimes | null) => {
    if (!times) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinutes;

    // Parse prayer times to minutes
    const parseTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const fajr = parseTime(times.Fajr);
    const sunrise = parseTime(times.Sunrise);
    const dhuhr = parseTime(times.Dhuhr);
    const asr = parseTime(times.Asr);
    const maghrib = parseTime(times.Maghrib);
    const isha = parseTime(times.Isha);

    // Determine background based on time periods
    if (currentTimeInMinutes >= 0 && currentTimeInMinutes < fajr) {
      setBackgroundImage(MidnightSubh);
    } else if (currentTimeInMinutes >= fajr && currentTimeInMinutes < sunrise) {
      setBackgroundImage(AfterSubh);
    } else if (currentTimeInMinutes >= sunrise && currentTimeInMinutes < sunrise + 60) {
      setBackgroundImage(Syurk);
    } else if (currentTimeInMinutes >= sunrise + 60 && currentTimeInMinutes < dhuhr - 60) {
      setBackgroundImage(Dhuha);
    } else if (currentTimeInMinutes >= dhuhr - 60 && currentTimeInMinutes < dhuhr) {
      setBackgroundImage(HalfDhuha);
    } else if (currentTimeInMinutes >= dhuhr && currentTimeInMinutes < asr) {
      setBackgroundImage(DzuhurAsr);
    } else if (currentTimeInMinutes >= asr && currentTimeInMinutes < asr + 60) {
      setBackgroundImage(AfterAsr);
    } else if (currentTimeInMinutes >= asr + 60 && currentTimeInMinutes < maghrib) {
      setBackgroundImage(BeforeMagrib);
    } else if (currentTimeInMinutes >= maghrib && currentTimeInMinutes < maghrib + 30) {
      setBackgroundImage(Magrib);
    } else if (currentTimeInMinutes >= maghrib + 30 && currentTimeInMinutes < isha) {
      setBackgroundImage(AfterMagrib);
    } else if (currentTimeInMinutes >= isha) {
      setBackgroundImage(IsyaMidnight);
    }
  }, []);

  // Initialize and fetch data
  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}`
            );
            const data = await response.json();
            if (data.city) {
              setLocation(data.city);
              fetchPrayerTimes(data.city);
              fetchWeather(data.city);
            }
          } catch (err) {
            console.error('Error getting location:', err);
            fetchPrayerTimes(location);
            fetchWeather(location);
          }
        },
        () => {
          // Fallback to default location
          fetchPrayerTimes(location);
          fetchWeather(location);
        }
      );
    } else {
      fetchPrayerTimes(location);
      fetchWeather(location);
    }
  }, [fetchPrayerTimes, fetchWeather]);

  // Update background every minute
  useEffect(() => {
    updateBackground(prayerTimes);
    const interval = setInterval(() => {
      updateBackground(prayerTimes);
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [prayerTimes, updateBackground]);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (nextPrayer) {
        const now = new Date();
        const timeLeft = nextPrayer.time.getTime() - now.getTime();
        
        if (timeLeft > 0) {
          const hours = Math.floor(timeLeft / 3600000);
          const minutes = Math.floor((timeLeft % 3600000) / 60000);
          const seconds = Math.floor((timeLeft % 60000) / 1000);
          setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setCountdown('');
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [nextPrayer]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Simplified prayer names for display
  const displayPrayerName = (name: string) => {
    const nameMap: { [key: string]: string } = {
      'Fajr': 'Subuh',
      'Sunrise': 'Syuruq',
      'Dhuhr': 'Dzuhur',
      'Asr': 'Ashar',
      'Maghrib': 'Margib',
      'Isha': 'Isya'
    };
    return nameMap[name] || name;
  };

  // Determine if it's daytime based on prayer times
  const isDaytime = () => {
    if (!prayerTimes) return true; // Default to day
    
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    
    const parseTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const sunrise = parseTime(prayerTimes.Sunrise);
    const maghrib = parseTime(prayerTimes.Maghrib);
    
    // Daytime is from Sunrise to Maghrib
    return currentTimeInMinutes >= sunrise && currentTimeInMinutes < maghrib;
  };

  // Determine if clouds should be shown based on weather
  const shouldShowClouds = () => {
    if (!weather) return false;
    
    const cloudyConditions = ['Clouds', 'Rain', 'Drizzle', 'Thunderstorm', 'Snow', 'Mist', 'Fog'];
    return cloudyConditions.includes(weather.main);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40" />

      {/* Mosque Header - Top Center with Logos */}
      <div className="relative z-10 py-6 px-8">
        <div className="flex items-center justify-center gap-8">
          {/* Left Logo */}
          <div className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center p-2 shadow-2xl backdrop-blur-sm transition-transform hover:scale-105 flex-shrink-0">
            <img 
              src={LeftLogo}
              alt="Masjid Logo" 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Mosque Info */}
          <div className="text-center flex-shrink-0">
            <h1 className="text-4xl font-bold text-white drop-shadow-2xl mb-1">
              Masjid Al-Falah, Seoul
            </h1>
            <h2 className="text-xl font-semibold text-white/90 drop-shadow-lg mb-1">
              Center of Islamic Studies Seoul
            </h2>
            <div className="flex items-center justify-center gap-2 text-lg text-white/90 drop-shadow-lg">
              <MapPin className="w-4 h-4" />
              <p>서울특별시 영등포구 신길로 60다길21</p>
            </div>
          </div>

          {/* Right Logo */}
          <div className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center p-2 shadow-2xl backdrop-blur-sm transition-transform hover:scale-105 flex-shrink-0">
            <img 
              src={RightLogo}
              alt="CISS Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid - Time/Weather Left, Hadith Right */}
      <div className="relative z-10 flex-1 px-8 max-w-[1920px] mx-auto w-full">
        <div className="grid grid-cols-2 gap-8 h-full">
        {/* Left Side - Time and Weather */}
        <div className="flex flex-col gap-2">
          {/* Date */}
          <p className="text-xl text-white/90 drop-shadow-lg">
            {calendar ? `${calendar.gregorian}  |  ${calendar.hijri}` : formatDate(currentTime)}
          </p>
          {/* Current Time */}
          <h1 className="text-8xl font-bold text-white drop-shadow-2xl">
            {formatTime(currentTime)}
          </h1>

          {/* Weather Info */}
          {weather && (
            <div className="flex items-center gap-3 mt-2">
              <img 
                src={`/src/assets/weather/${weather.icon}.png`}
                alt={weather.description}
                className="w-24 h-24"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/weather/Default.png';
                }}
              />
              <div className="flex flex-col">
                <span className="text-3xl font-semibold text-white drop-shadow-lg">
                  {Math.round(weather.temp)}°C
                </span>
                <span className="text-lg text-white/80 drop-shadow-md capitalize">
                  {weather.description}
                </span>
                {/* Location */}
                {loading && (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-white/80">Loading...</span>
                  </span>
                )}
                
                {location && !loading && (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-white/80" />
                    <span className="text-lg text-white/80 drop-shadow-md">{location}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Celestial Body (Sun/Moon with Clouds) */}
        <div className="flex items-center justify-center">
          <div className="w-full h-96">
            <CelestialBody 
              isDaytime={isDaytime()}
              moonPhase={0.5}
              showClouds={shouldShowClouds()}
            />
          </div>
        </div>
        </div>
      </div>

      {/* Prayer Times - Bottom */}
      {prayerTimes && (
        <div className="relative z-10 mt-auto max-w-[1920px] mx-auto w-full">
          <div className="p-8 pb-4">
            <div className="grid grid-cols-6 gap-4 max-w-7xl mx-auto">
              {Object.entries(prayerTimes).map(([prayer, time]) => {
                const isActive = nextPrayer?.name === prayer;
                const isSyuruq = prayer === 'Sunrise';
                
                return (
                  <div key={prayer} className="relative">
                    {/* Countdown Tooltip */}
                    {isActive && countdown && (
                      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-50">
                        <div className="bg-green-500/90 backdrop-blur-md rounded-lg px-4 py-2 shadow-xl border-2 border-green-400">
                          <div className="text-center">
                            <p className="text-xs text-white/80 font-semibold mb-1">Time Until Prayer</p>
                            <p className="text-2xl font-bold text-white font-mono">{countdown}</p>
                          </div>
                          {/* Arrow pointing down */}
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-green-500/90"></div>
                        </div>
                      </div>
                    )}
                    
                    <Glass active={isActive}>
                      <div className="p-6 flex flex-col items-center justify-center space-y-2">
                        <h3 className={`text-2xl font-bold ${isActive ? 'text-green-100' : isSyuruq ? 'text-yellow-100' : 'text-white'} drop-shadow-lg`}>
                          {displayPrayerName(prayer)}
                        </h3>
                        <p className={`text-3xl font-semibold ${isActive ? 'text-green-50' : isSyuruq ? 'text-yellow-50' : 'text-white/90'} drop-shadow-md font-mono`}>
                          {time}
                        </p>
                      </div>
                    </Glass>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* Running Text - Alternating Quotes & Bank Information */}
        <div className="relative">
          <div className="liquidGlass-wrapper">
            <div className="liquidGlass-effect"></div>
            <div className="liquidGlass-tint"></div>
            <div className="liquidGlass-shine"></div>
            <div className="liquidGlass-text w-full">
              <div className="py-5 border-t border-white/10">
                <div className="overflow-hidden relative">
                  <div className="animate-scroll-infinite whitespace-nowrap flex items-center">
                    {/* Create alternating pattern: quote -> bank -> quote -> bank */}
                    {QURAN_QUOTES.map((quote, index) => (
                      <div key={`group-${index}`} className="inline-flex items-center">
                        {/* Quran Quote */}
                        <span className="text-xl font-medium text-white drop-shadow-lg px-8">
                          {quote}
                        </span>
                        
                        {/* Separator */}
                        <span className="text-2xl font-semibold text-white/60 drop-shadow-lg px-4">
                          •
                        </span>
                        
                        {/* Bank Account Chip - Yellowish Color */}
                        <span className="inline-flex items-center bg-gradient-to-r from-yellow-500/40 to-amber-600/40 backdrop-blur-sm border-2 border-yellow-400/60 rounded-full px-6 py-2 mx-4 shadow-lg">
                          <svg 
                            className="w-5 h-5 mr-2 text-yellow-100" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span className="text-xl font-bold text-white drop-shadow-md">
                            Woori Bank 1005-904-584-084
                          </span>
                          <span className="text-lg font-medium text-yellow-50 ml-2 drop-shadow-md">
                            (서울이슬람교육센터)
                          </span>
                        </span>
                        
                        {/* Separator */}
                        <span className="text-2xl font-semibold text-white/60 drop-shadow-lg px-4">
                          •
                        </span>
                      </div>
                    ))}
                    {/* Duplicate for seamless infinite loop */}
                    {QURAN_QUOTES.map((quote, index) => (
                      <div key={`group-duplicate-${index}`} className="inline-flex items-center">
                        <span className="text-xl font-medium text-white drop-shadow-lg px-8">
                          {quote}
                        </span>
                        <span className="text-2xl font-semibold text-white/60 drop-shadow-lg px-4">
                          •
                        </span>
                        <span className="inline-flex items-center bg-gradient-to-r from-yellow-500/40 to-amber-600/40 backdrop-blur-sm border-2 border-yellow-400/60 rounded-full px-6 py-2 mx-4 shadow-lg">
                          <svg 
                            className="w-5 h-5 mr-2 text-yellow-100" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span className="text-xl font-bold text-white drop-shadow-md">
                            Woori Bank 1005-904-584-084
                          </span>
                          <span className="text-lg font-medium text-yellow-50 ml-2 drop-shadow-md">
                            (서울이슬람교육센터)
                          </span>
                        </span>
                        <span className="text-2xl font-semibold text-white/60 drop-shadow-lg px-4">
                          •
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;