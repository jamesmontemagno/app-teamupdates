import { useCallback, useState } from 'react';
import type { LocationPin } from '../types';

type GeolocationStatus = 'idle' | 'pending' | 'ready' | 'error';

export function useGeolocation() {
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
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
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
  }, []);

  return {
    status,
    position,
    error,
    requestLocation,
  };
}
