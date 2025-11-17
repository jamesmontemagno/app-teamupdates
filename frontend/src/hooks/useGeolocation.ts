import { useCallback, useState } from 'react';
import type { LocationPin } from '../types';
import { randomizeCoordinates } from '../utils/randomizeLocation';
import { logWarn, logInfo, logError, recordGeolocationRequest } from '../telemetry';

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
      logWarn('Geolocation API not supported', {
        'component': 'useGeolocation',
        'user_agent': navigator.userAgent
      });
      setError('Geolocation is not supported by this browser.');
      setStatus('error');
      return;
    }

    const startTime = performance.now();
    setStatus('pending');
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latency = performance.now() - startTime;
        
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
        
        // Record successful geolocation
        recordGeolocationRequest(true, latency);
        logInfo('Geolocation acquired', {
          'component': 'useGeolocation',
          'latency_ms': latency.toFixed(0),
          'accuracy_meters': pos.coords.accuracy.toFixed(0),
          'randomization_radius': randomizationRadius
        });
      },
      (err) => {
        const latency = performance.now() - startTime;
        
        // Record failed geolocation
        recordGeolocationRequest(false, latency, err.code);
        logError('Geolocation request failed', new Error(err.message), {
          'component': 'useGeolocation',
          'error_code': err.code,
          'error_message': err.message
        });
        
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
