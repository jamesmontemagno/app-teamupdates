// Nominatim API geocoding utility
// Free OpenStreetMap geocoding service with rate limiting

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
}

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests (Nominatim requirement)
const cache = new Map<string, GeocodingResult>();

async function enforceRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();
}

export async function geocodeAddress(
  city?: string,
  state?: string,
  country?: string
): Promise<GeocodingResult> {
  // Build query string from available parts
  const parts = [city, state, country].filter((part) => part && part.trim());
  if (parts.length === 0) {
    throw new Error('Please provide at least one location field (city, state, or country)');
  }

  const query = parts.join(', ');
  const cacheKey = query.toLowerCase();

  // Check cache first
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // Enforce rate limiting
  await enforceRateLimit();

  // Call Nominatim API
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'TeamUpdatesApp/1.0', // Nominatim requires User-Agent
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding service returned ${response.status}`);
    }

    const data = (await response.json()) as NominatimResponse[];

    if (!data || data.length === 0) {
      throw new Error('Location not found. Please check your input and try again.');
    }

    const result: GeocodingResult = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };

    // Cache the result
    cache.set(cacheKey, result);

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to geocode location. Please try again.');
  }
}
