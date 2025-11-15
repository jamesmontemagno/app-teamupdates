namespace TeamUpdates.Backend.Services;

public interface IGeocodingService
{
    Task<GeocodingResult?> GeocodeAsync(string city, string? state = null, string? country = null);
}

public class GeocodingResult
{
    public double Lat { get; set; }
    public double Lng { get; set; }
    public required string DisplayName { get; set; }
}
