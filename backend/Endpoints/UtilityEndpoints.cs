using TeamUpdates.Backend.Models;
using TeamUpdates.Backend.Services;

namespace TeamUpdates.Backend.Endpoints;

public static class UtilityEndpoints
{
    public static RouteGroupBuilder MapUtilityEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/geocode", async (GeocodingRequest request, IGeocodingService geocodingService) =>
        {
            var result = await geocodingService.GeocodeAsync(request.City, request.State, request.Country);
            if (result == null)
                return Results.NotFound(new { error = "Location not found" });
            
            return Results.Ok(result);
        });

        return group;
    }

    public static void MapHealthEndpoint(this WebApplication app)
    {
        app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
    }
}
