// Randomize coordinates for privacy by applying a circular random offset

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Applies a random offset to coordinates within a specified radius
 * Uses circular distribution for realistic randomization
 * @param lat - Latitude
 * @param lng - Longitude
 * @param radiusMeters - Maximum offset radius in meters (default: 100)
 * @returns Randomized coordinates
 */
export function randomizeCoordinates(
  lat: number,
  lng: number,
  radiusMeters: number = 100
): Coordinates {
  if (radiusMeters === 0) {
    return { lat, lng };
  }

  // Convert radius from meters to degrees (approximate)
  // 1 degree latitude ≈ 111,320 meters
  // 1 degree longitude varies by latitude
  const radiusInDegrees = radiusMeters / 111320;

  // Generate random angle (0 to 2π)
  const angle = Math.random() * 2 * Math.PI;

  // Generate random distance (0 to radius)
  // Use square root for uniform distribution within circle
  const distance = Math.sqrt(Math.random()) * radiusInDegrees;

  // Calculate offset
  const latOffset = distance * Math.cos(angle);
  const lngOffset = distance * Math.sin(angle) / Math.cos(lat * Math.PI / 180);

  return {
    lat: lat + latOffset,
    lng: lng + lngOffset,
  };
}
