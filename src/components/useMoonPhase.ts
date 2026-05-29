import { useEffect, useState } from 'react';

const ASTR_APP_ID = import.meta.env.VITE_ASTR_APP_ID;
const ASTR_API_KEY = import.meta.env.VITE_ASTR_API_KEY;

// Note: Moon phase images are fetched once per location change.
// The API call is intentionally not cached to ensure accuracy when location changes.
// Consider implementing caching by date if API rate limits become a concern.
export function useMoonPhase(latitude: number, longitude: number) {
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
        const authString = `${ASTR_APP_ID}:${ASTR_API_KEY}`;
        const base64Auth = btoa(authString);

        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        const response = await fetch('https://api.astronomyapi.com/api/v2/studio/moon-phase', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${base64Auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format: 'png',
            style: {
              moonStyle: 'default',
              backgroundStyle: 'solid',
              backgroundColor: 'transparent',
              headingColor: 'transparent',
              textColor: 'transparent',
            },
            observer: {
              latitude,
              longitude,
              date: dateString,
            },
            view: {
              type: 'landscape-simple',
              orientation: 'south-up',
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

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

    void fetchMoonPhase();
  }, [latitude, longitude]);

  return { moonPhaseImage, loading, error };
}
