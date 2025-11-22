import { useState, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import Glass from './components/Glass';
import CelestialBody from './components/CelestialBody';
import PerformanceMonitor from './components/PerformanceMonitor';

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

// Import weather icons (only files that exist: 01-09)
import weather01d from './assets/weather/01d.png';
import weather01n from './assets/weather/01n.png';
import weather02d from './assets/weather/02d.png';
import weather02n from './assets/weather/02n.png';
import weather03d from './assets/weather/03d.png';
import weather03n from './assets/weather/03n.png';
import weather04d from './assets/weather/04d.png';
import weather04n from './assets/weather/04n.png';
import weather05d from './assets/weather/05d.png';
import weather05n from './assets/weather/05n.png';
import weather06d from './assets/weather/06d.png';
import weather06n from './assets/weather/06n.png';
import weather07d from './assets/weather/07d.png';
import weather07n from './assets/weather/07n.png';
import weather08d from './assets/weather/08d.png';
import weather08n from './assets/weather/08n.png';
import weather09d from './assets/weather/09d.png';
import weather09n from './assets/weather/09n.png';
import weatherDefault from './assets/weather/Default.png';

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

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const DEBUG_MODE = import.meta.env.VITE_DEBUG === 'true';

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
  const [lastFetchDate, setLastFetchDate] = useState<string>('');
  
  // Debug: Override time for testing (set to null to use real time)
  const [debugTime, setDebugTime] = useState<Date | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // Iqamah times (minutes after adhan)
  const [iqamahTimes, setIqamahTimes] = useState<{ [key: string]: number }>({
    'Fajr': 20,
    'Dhuhr': 10,
    'Asr': 10,
    'Maghrib': 5,
    'Isha': 10
  });
  const [iqamahCountdown, setIqamahCountdown] = useState<string>('');
  const [iqamahTooltipDelay, setIqamahTooltipDelay] = useState<number>(15); // minutes after adhan to show iqamah tooltip
  const [showIqamahTooltip, setShowIqamahTooltip] = useState<boolean>(false);
  
  // format current time - Update less frequently to save resources
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(debugTime || new Date());
    }, 1000); // Keep at 1s for smooth clock
    return () => clearInterval(timer);
  }, [debugTime]);
  

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
      const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      
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
        
        // Update last fetch date
        setLastFetchDate(dateString);
      }
    } catch (err) {
      console.error('Error fetching prayer times:', err);
    }
    setLoading(false);
  }, []);

  // Update next prayer
  const updateNextPrayer = (times: PrayerTimes, currentTimeParam?: Date) => {
    const now = currentTimeParam || new Date();
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
  const updateBackground = useCallback((times: PrayerTimes | null, currentTimeParam?: Date) => {
    if (!times) return;
    
    const now = currentTimeParam || new Date();
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
  }, [fetchPrayerTimes, fetchWeather, location]);

  // Update background every minute
  useEffect(() => {
    updateBackground(prayerTimes, currentTime);
    const interval = setInterval(() => {
      updateBackground(prayerTimes, currentTime);
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [prayerTimes, updateBackground, currentTime]);

  // Update next prayer and background when currentTime changes (for debug mode)
  useEffect(() => {
    if (prayerTimes) {
      updateNextPrayer(prayerTimes, currentTime);
      updateBackground(prayerTimes, currentTime);
    }
  }, [currentTime, prayerTimes, updateBackground]);

  // Update countdown based on currentTime (syncs with both debug and real time)
  useEffect(() => {
    if (nextPrayer) {
      const now = currentTime;
      const timeLeft = nextPrayer.time.getTime() - now.getTime();
      const timeSinceAdhan = now.getTime() - nextPrayer.time.getTime();
      const minutesSinceAdhan = timeSinceAdhan / 60000;
      
      // Show adhan tooltip before prayer time
      if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / 3600000);
        const minutes = Math.floor((timeLeft % 3600000) / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        setShowIqamahTooltip(false);
        
        // Calculate iqamah time for display in adhan tooltip
        if (nextPrayer.name !== 'Sunrise' && iqamahTimes[nextPrayer.name]) {
          const iqamahTime = new Date(nextPrayer.time.getTime() + iqamahTimes[nextPrayer.name] * 60 * 1000);
          const iqamahTimeLeft = iqamahTime.getTime() - now.getTime();
          
          if (iqamahTimeLeft > 0) {
            const iqHours = Math.floor(iqamahTimeLeft / 3600000);
            const iqMinutes = Math.floor((iqamahTimeLeft % 3600000) / 60000);
            const iqSeconds = Math.floor((iqamahTimeLeft % 60000) / 1000);
            setIqamahCountdown(`${iqHours.toString().padStart(2, '0')}:${iqMinutes.toString().padStart(2, '0')}:${iqSeconds.toString().padStart(2, '0')}`);
          } else {
            setIqamahCountdown('');
          }
        } else {
          setIqamahCountdown('');
        }
      } 
      // Show iqamah tooltip after iqamahTooltipDelay minutes past adhan
      else if (minutesSinceAdhan >= iqamahTooltipDelay && nextPrayer.name !== 'Sunrise' && iqamahTimes[nextPrayer.name]) {
        setCountdown('');
        const iqamahTime = new Date(nextPrayer.time.getTime() + iqamahTimes[nextPrayer.name] * 60 * 1000);
        const iqamahTimeLeft = iqamahTime.getTime() - now.getTime();
        
        if (iqamahTimeLeft > 0) {
          const iqHours = Math.floor(iqamahTimeLeft / 3600000);
          const iqMinutes = Math.floor((iqamahTimeLeft % 3600000) / 60000);
          const iqSeconds = Math.floor((iqamahTimeLeft % 60000) / 1000);
          setIqamahCountdown(`${iqHours.toString().padStart(2, '0')}:${iqMinutes.toString().padStart(2, '0')}:${iqSeconds.toString().padStart(2, '0')}`);
          setShowIqamahTooltip(true);
        } else {
          setIqamahCountdown('');
          setShowIqamahTooltip(false);
        }
      } else {
        setCountdown('');
        setIqamahCountdown('');
        setShowIqamahTooltip(false);
      }
    } else {
      setCountdown('');
      setIqamahCountdown('');
      setShowIqamahTooltip(false);
    }
  }, [nextPrayer, iqamahTimes, iqamahTooltipDelay, currentTime]);

  // Auto-refresh prayer times daily at midnight for Smart TVs
  useEffect(() => {
    const checkAndRefresh = () => {
      const now = new Date();
      const currentDateString = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      
      // If the date has changed since last fetch, refresh data
      if (lastFetchDate && currentDateString !== lastFetchDate) {
        console.log('Day changed - refreshing prayer times and weather');
        fetchPrayerTimes(location);
        fetchWeather(location);
      }
    };
    
    // Check every minute for day change
    const interval = setInterval(checkAndRefresh, 60000);
    
    return () => clearInterval(interval);
  }, [lastFetchDate, location, fetchPrayerTimes, fetchWeather]);

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
      'Maghrib': 'Maghrib',
      'Isha': 'Isya'
    };
    return nameMap[name] || name;
  };

  // Get weather icon from imported assets
  // Map OpenWeather icon codes to our available assets (01-09)
  const getWeatherIcon = (iconCode: string) => {
    const iconMap: { [key: string]: string } = {
      '01d': weather01d,  // clear sky day
      '01n': weather01n,  // clear sky night
      '02d': weather02d,  // few clouds day
      '02n': weather02n,  // few clouds night
      '03d': weather03d,  // scattered clouds day
      '03n': weather03n,  // scattered clouds night
      '04d': weather04d,  // broken clouds day
      '04n': weather04n,  // broken clouds night
      '05d': weather05d,  // custom icon
      '05n': weather05n,  // custom icon
      '06d': weather06d,  // custom icon
      '06n': weather06n,  // custom icon
      '07d': weather07d,  // custom icon
      '07n': weather07n,  // custom icon
      '08d': weather08d,  // custom icon
      '08n': weather08n,  // custom icon
      '09d': weather09d,  // shower rain day
      '09n': weather09n,  // shower rain night
      // Map OpenWeather codes that don't have direct assets
      '10d': weather09d,  // rain -> use shower icon
      '10n': weather09n,  // rain night
      '11d': weather09d,  // thunderstorm -> use rain icon
      '11n': weather09n,  // thunderstorm night
      '13d': weather08d,  // snow -> use icon 08
      '13n': weather08n,  // snow night
      '50d': weather07d,  // mist/fog -> use icon 07
      '50n': weather07n,  // mist/fog night
    };
    return iconMap[iconCode] || weatherDefault;
  };

  // Determine if it's daytime based on prayer times
  const isDaytime = () => {
    if (!prayerTimes) return true; // Default to day
    
    const now = currentTime;
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
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col overflow-hidden"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40" />

      {/* Mosque Header - Top Center with Logos - BIGGER */}
      <div className="relative z-10 py-10 px-8">
        <div className="flex items-center justify-center gap-12">
          {/* Left Logo */}
          <div className="w-32 h-32 rounded-full bg-white/95 flex items-center justify-center p-3 shadow-2xl backdrop-blur-sm transition-transform hover:scale-105 flex-shrink-0">
            <img 
              src={LeftLogo}
              alt="Masjid Logo" 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Mosque Info */}
          <div className="text-center flex-shrink-0">
            <h1 className="text-6xl font-bold text-white drop-shadow-2xl mb-2">
              Masjid Al-Falah, Seoul
            </h1>
            <h2 className="text-3xl font-semibold text-white/90 drop-shadow-lg mb-2">
              Center of Islamic Studies Seoul
            </h2>
            <div className="flex items-center justify-center gap-3 text-2xl text-white/90 drop-shadow-lg">
              <MapPin className="w-6 h-6" />
              <p>서울특별시 영등포구 신길로 60다길21</p>
            </div>
          </div>

          {/* Right Logo */}
          <div className="w-32 h-32 rounded-full bg-white/95 flex items-center justify-center p-3 shadow-2xl backdrop-blur-sm transition-transform hover:scale-105 flex-shrink-0">
            <img 
              src={RightLogo}
              alt="CISS Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid - Time/Weather Left, Hadith Right */}
      <div className="relative z-10 flex-1 px-8 max-w-[1920px] mx-auto w-full flex items-start justify-center py-4">
        <div className="grid grid-cols-2 gap-8 h-full">
        {/* Left Side - Time and Weather - SMALLER */}
        <div className="flex flex-col gap-1">
          {/* Current Time */}
          <h1 className="text-6xl font-bold text-white drop-shadow-2xl">
            {formatTime(currentTime)}
          </h1>
          {/* Date */}
          <p className="text-lg text-white/90 drop-shadow-lg">
            {calendar ? `${calendar.gregorian}  |  ${calendar.hijri}` : formatDate(currentTime)}
          </p>

          {/* Weather Info */}
          {weather && (
            <div className="flex items-center gap-2 mt-1">
              <img 
                src={getWeatherIcon(weather.icon)}
                alt={weather.description}
                className="w-16 h-16"
              />
              <div className="flex flex-col">
                <span className="text-2xl font-semibold text-white drop-shadow-lg">
                  {Math.round(weather.temp)}°C
                </span>
                <span className="text-base text-white/80 drop-shadow-md capitalize">
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
        <div className="flex items-center justify-end">
          <CelestialBody 
            isDaytime={isDaytime()}
            moonPhase={weather?.moonPhase}
            showClouds={shouldShowClouds()}
          />
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
                    {/* Adhan Countdown Tooltip - Green */}
                    {isActive && countdown && (
                      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-50">
                        <div className="bg-gradient-to-br from-green-500/95 to-green-600/95 backdrop-blur-md rounded-lg px-6 py-3 shadow-xl border-2 border-green-400">
                          <div className="text-center space-y-2">
                            {/* Adhan Time */}
                            <div>
                              <p className="text-xs text-white/90 font-semibold mb-1 whitespace-nowrap">Time Until Adhan</p>
                              <p className="text-2xl font-bold text-white font-mono">{countdown}</p>
                            </div>
                          </div>
                          {/* Arrow pointing down */}
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-green-600/95"></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Iqamah Countdown Tooltip - Orange (appears after delay) */}
                    {isActive && showIqamahTooltip && iqamahCountdown && !isSyuruq && (
                      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-50">
                        <div className="bg-gradient-to-br from-orange-500/95 to-orange-600/95 backdrop-blur-md rounded-lg px-6 py-3 shadow-xl border-2 border-orange-400">
                          <div className="text-center">
                            <p className="text-xs text-white/90 font-semibold mb-1 whitespace-nowrap">⏱️ Time Until Iqamah</p>
                            <p className="text-3xl font-bold text-white font-mono">{iqamahCountdown}</p>
                            <p className="text-xs text-orange-100/90 mt-2">{iqamahTimes[prayer]} minutes after adhan</p>
                          </div>
                          {/* Arrow pointing down */}
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-orange-600/95"></div>
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
                  <div className="animate-scroll-infinite whitespace-nowrap flex items-center will-change-transform">
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

      {/* Performance Monitor - Debug Tool */}
      <PerformanceMonitor />

      {/* Debug Time Control Panel */}
      {DEBUG_MODE && (
        <div className="fixed top-4 right-4 z-50">
          {!showDebugPanel ? (
            <button
              onClick={() => setShowDebugPanel(true)}
              className="bg-purple-600/90 hover:bg-purple-700/90 text-white px-4 py-2 rounded-lg shadow-xl font-mono text-sm backdrop-blur-sm transition-colors"
            >
              🕐 Debug Time
            </button>
          ) : (
            <div className="bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-2xl border border-purple-500/50 font-mono text-sm min-w-[320px]">
              <div className="flex items-center justify-between mb-3 border-b border-white/20 pb-2">
                <h3 className="font-bold text-purple-400">⏰ Time Debug Control</h3>
                <button
                  onClick={() => setShowDebugPanel(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                {/* Current Time Display */}
                <div className="bg-purple-900/30 p-2 rounded border border-purple-500/30">
                  <div className="text-xs text-purple-300 mb-1">Current Time:</div>
                  <div className="text-lg font-bold text-white">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-xs text-white/70">
                    {formatDate(currentTime)}
                  </div>
                </div>

                {/* Time Input */}
                <div>
                  <label className="text-xs text-white/70 block mb-1">Set Debug Time:</label>
                  <input
                    type="time"
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-purple-500/50 focus:border-purple-400 focus:outline-none"
                    onChange={(e) => {
                      if (e.target.value) {
                        const [hours, minutes] = e.target.value.split(':');
                        const newTime = new Date();
                        newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                        setDebugTime(newTime);
                      }
                    }}
                  />
                </div>

                {/* Quick Time Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const time = new Date();
                      time.setHours(5, 0, 0, 0); // Fajr
                      setDebugTime(time);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-xs transition-colors"
                  >
                    Fajr (05:00)
                  </button>
                  <button
                    onClick={() => {
                      const time = new Date();
                      time.setHours(12, 30, 0, 0); // Dhuhr
                      setDebugTime(time);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-xs transition-colors"
                  >
                    Dhuhr (12:30)
                  </button>
                  <button
                    onClick={() => {
                      const time = new Date();
                      time.setHours(15, 30, 0, 0); // Asr
                      setDebugTime(time);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-xs transition-colors"
                  >
                    Asr (15:30)
                  </button>
                  <button
                    onClick={() => {
                      const time = new Date();
                      time.setHours(18, 0, 0, 0); // Maghrib
                      setDebugTime(time);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-xs transition-colors"
                  >
                    Maghrib (18:00)
                  </button>
                </div>

                {/* Reset Button */}
                <button
                  onClick={() => setDebugTime(null)}
                  className="w-full bg-red-600/80 hover:bg-red-700/80 px-3 py-2 rounded text-sm transition-colors font-semibold"
                >
                  ↻ Reset to Real Time
                </button>

                {debugTime && (
                  <div className="text-xs text-green-400 text-center">
                    ✓ Debug mode active
                  </div>
                )}

                {/* Iqamah Time Settings */}
                <div className="border-t border-white/20 pt-3 mt-2">
                  <h4 className="text-xs text-orange-300 font-bold mb-2">⏱️ Iqamah Times (minutes after adhan)</h4>
                  <div className="space-y-2">
                    {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                      <div key={prayer} className="flex items-center justify-between">
                        <label className="text-xs text-white/70 w-20">{prayer}:</label>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={iqamahTimes[prayer]}
                          onChange={(e) => setIqamahTimes({ ...iqamahTimes, [prayer]: parseInt(e.target.value) || 0 })}
                          className="w-16 bg-gray-800 text-white px-2 py-1 rounded border border-orange-500/50 focus:border-orange-400 focus:outline-none text-center text-sm"
                        />
                        <span className="text-xs text-white/50 ml-1">min</span>
                      </div>
                    ))}
                    <div className="border-t border-orange-500/20 pt-2 mt-2">
                      <label className="text-xs text-orange-200 block mb-1">Show Iqamah Tooltip After:</label>
                      <div className="flex items-center justify-between">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={iqamahTooltipDelay}
                          onChange={(e) => setIqamahTooltipDelay(parseInt(e.target.value) || 0)}
                          className="w-16 bg-gray-800 text-white px-2 py-1 rounded border border-orange-500/50 focus:border-orange-400 focus:outline-none text-center text-sm"
                        />
                        <span className="text-xs text-white/50 ml-1">min past adhan</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;