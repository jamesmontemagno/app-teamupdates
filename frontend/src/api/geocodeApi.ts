// Geocoding API service

import { apiPost } from './client';
import type { GeocodingResult, GeocodeRequest } from './types';

export async function geocodeAddress(request: GeocodeRequest): Promise<GeocodingResult> {
  return apiPost<GeocodingResult>('/geocode', request);
}
