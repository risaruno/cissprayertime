import { useEffect, useState } from 'react';

interface MoonPhaseData {
  imageUrl: string;
  error?: string;
}

interface MoonPhaseFetcherProps {
  latitude: number;
  longitude: number;
  onFetchComplete?: (data: MoonPhaseData) => void;
}

const ASTR_APP_ID = import.meta.env.VITE_ASTR_APP_ID;
const ASTR_API_KEY = import.meta.env.VITE_ASTR_API_KEY;

// Note: Moon phase images are fetched once per location change.
// The API call is intentionally not cached to ensure accuracy when location changes.
// Consider implementing caching by date if API rate limits become a concern.

export const useMoonPhase = (latitude: number, longitude: number) => {
  const [moonPhaseImage, setMoonPhaseImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ASTR_APP_ID || !ASTR_API_KEY) {
      console.warn('Astronomy API credentials not configured');
      return;
    }

    const fetchMoonPhase = async () => {
      setLoading(true);
      setError(null);

      try {
        // Create Basic Auth token
        const authString = `${ASTR_APP_ID}:${ASTR_API_KEY}`;
        const base64Auth = btoa(authString);

        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        const response = await fetch('https://api.astronomyapi.com/api/v2/studio/moon-phase', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${base64Auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format: 'png',
            style: {
              moonStyle: 'default',
              backgroundStyle: 'solid',
              backgroundColor: 'transparent',
              headingColor: 'white',
              textColor: 'white'
            },
            observer: {
              latitude,
              longitude,
              date: dateString
            },
            view: {
              type: 'portrait-simple',
              orientation: 'south-up'
            }
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        // The API returns an object with an imageUrl property
        if (data.data && data.data.imageUrl) {
          setMoonPhaseImage(data.data.imageUrl);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching moon phase from Astronomy API:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMoonPhase();
  }, [latitude, longitude]);

  return { moonPhaseImage, loading, error };
};

// MoonPhaseFetcher component is provided for optional imperative usage patterns
// where you need to fetch moon phase data and handle it via callback.
// Most use cases should use the useMoonPhase hook directly (as done in CelestialBody).
function MoonPhaseFetcher({ latitude, longitude, onFetchComplete }: MoonPhaseFetcherProps) {
  const { moonPhaseImage, error } = useMoonPhase(latitude, longitude);

  useEffect(() => {
    if (onFetchComplete && (moonPhaseImage || error)) {
      onFetchComplete({
        imageUrl: moonPhaseImage || '',
        error: error || undefined
      });
    }
  }, [moonPhaseImage, error, onFetchComplete]);

  return null; // This is a headless component
}

export default MoonPhaseFetcher;
