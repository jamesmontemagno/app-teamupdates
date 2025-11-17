namespace TeamUpdates.Backend.Services;

public class LocationRandomizer : ILocationRandomizer
{
    private static readonly Random _random = new();

    public (double lat, double lng) RandomizeCoordinates(double lat, double lng, int radiusMeters)
    {
        // Convert radius from meters to degrees (approximate)
        // 1 degree of latitude ≈ 111,000 meters
        var radiusInDegrees = radiusMeters / 111000.0;

        // Generate random angle and distance
        var angle = _random.NextDouble() * 2 * Math.PI;
        var distance = _random.NextDouble() * radiusInDegrees;

        // Calculate new coordinates using circular distribution
        var deltaLat = distance * Math.Cos(angle);
        var deltaLng = distance * Math.Sin(angle) / Math.Cos(lat * Math.PI / 180.0);

        return (lat + deltaLat, lng + deltaLng);
    }
}
