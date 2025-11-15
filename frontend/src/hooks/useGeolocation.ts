import { useCallback, useState } from 'react';
import type { LocationPin } from '../types';
import { randomizeCoordinates } from '../utils/randomizeLocation';

type GeolocationStatus = 'idle' | 'pending' | 'ready' | 'error';

interface UseGeolocationOptions {
  randomizationRadius?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { randomizationRadius = 0 } = options;
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [position, setPosition] = useState<LocationPin | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setStatus('error');
      return;
    }

    setStatus('pending');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Apply randomization if radius is set
        const coords = randomizationRadius > 0
          ? randomizeCoordinates(pos.coords.latitude, pos.coords.longitude, randomizationRadius)
          : { lat: pos.coords.latitude, lng: pos.coords.longitude };

        setPosition({
          lat: coords.lat,
          lng: coords.lng,
          accuracy: pos.coords.accuracy,
        });
        setError(null);
        setStatus('ready');
      },
      (err) => {
        setError(err.message || 'Unable to get your location.');
        setStatus('error');
      },
      { enableHighAccuracy: true }
    );
  }, [randomizationRadius]);

  return {
    status,
    position,
    error,
    requestLocation,
  };
}
