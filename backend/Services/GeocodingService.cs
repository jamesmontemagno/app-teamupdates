using System.Text.Json;

namespace TeamUpdates.Backend.Services;

public class GeocodingService : IGeocodingService
{
    private readonly HttpClient _httpClient;
    private readonly Dictionary<string, GeocodingResult> _cache = new();
    private DateTime _lastRequestTime = DateTime.MinValue;
    private readonly SemaphoreSlim _rateLimitSemaphore = new(1, 1);

    public GeocodingService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "TeamUpdatesApp/1.0");
    }

    public async Task<GeocodingResult?> GeocodeAsync(string city, string? state = null, string? country = null)
    {
        var cacheKey = $"{city},{state},{country}";
        
        if (_cache.TryGetValue(cacheKey, out var cachedResult))
        {
            return cachedResult;
        }

        await _rateLimitSemaphore.WaitAsync();
        try
        {
            // Enforce 1 second rate limit
            var timeSinceLastRequest = DateTime.UtcNow - _lastRequestTime;
            if (timeSinceLastRequest.TotalSeconds < 1.0)
            {
                await Task.Delay(TimeSpan.FromSeconds(1.0 - timeSinceLastRequest.TotalSeconds));
            }

            var query = BuildQuery(city, state, country);
            var url = $"https://nominatim.openstreetmap.org/search?q={Uri.EscapeDataString(query)}&format=json&limit=1";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var results = JsonSerializer.Deserialize<List<NominatimResult>>(content);

            _lastRequestTime = DateTime.UtcNow;

            if (results != null && results.Count > 0)
            {
                var result = new GeocodingResult
                {
                    Lat = double.Parse(results[0].lat),
                    Lng = double.Parse(results[0].lon),
                    DisplayName = results[0].display_name
                };

                _cache[cacheKey] = result;
                return result;
            }

            return null;
        }
        finally
        {
            _rateLimitSemaphore.Release();
        }
    }

    private static string BuildQuery(string city, string? state, string? country)
    {
        var parts = new List<string> { city };
        if (!string.IsNullOrWhiteSpace(state))
            parts.Add(state);
        if (!string.IsNullOrWhiteSpace(country))
            parts.Add(country);
        return string.Join(", ", parts);
    }

    private class NominatimResult
    {
        public required string lat { get; set; }
        public required string lon { get; set; }
        public required string display_name { get; set; }
    }
}
