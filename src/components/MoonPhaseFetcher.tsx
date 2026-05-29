import { useEffect } from 'react';
import { useMoonPhase } from './useMoonPhase';

interface MoonPhaseData {
  imageUrl: string;
  error?: string;
}

interface MoonPhaseFetcherProps {
  latitude: number;
  longitude: number;
  onFetchComplete?: (data: MoonPhaseData) => void;
}

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
