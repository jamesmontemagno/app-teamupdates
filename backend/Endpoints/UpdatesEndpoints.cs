using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TeamUpdates.Backend.Data;
using TeamUpdates.Backend.Entities;
using TeamUpdates.Backend.Hubs;
using TeamUpdates.Backend.Models;
using TeamUpdates.Backend.Services;

namespace TeamUpdates.Backend.Endpoints;

public static class UpdatesEndpoints
{
    public static RouteGroupBuilder MapUpdatesEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", async (
            Guid teamId,
            AppDbContext db,
            ILogger<Program> logger,
            string? day = null,
            string? category = null,
            string? media = null,
            bool locationOnly = false) =>
        {
            logger.LogInformation("Fetching updates for team {TeamId} with filters: day={Day}, category={Category}, media={Media}, locationOnly={LocationOnly}",
                teamId, day ?? "all", category ?? "all", media ?? "all", locationOnly);
            
            var query = db.TeamUpdates.Where(u => u.TeamId == teamId);
            
            if (day != null && day != "all")
                query = query.Where(u => u.DayKey == day);
            
            if (category != null && category != "all")
                query = query.Where(u => u.Category == category);
            
            if (media != null && media != "all")
            {
                if (media == "text")
                    query = query.Where(u => u.MediaJson == null || u.MediaJson == "");
                else
                    query = query.Where(u => u.MediaJson != null && u.MediaJson.Contains($"\"type\":\"{media}\""));
            }
            
            if (locationOnly)
                query = query.Where(u => u.LocationJson != null);
            
            var updates = await query
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
            
            // Map to DTOs with deserialized JSON fields
            var response = updates.Select(u => new
            {
                u.Id,
                u.TeamId,
                u.UserId,
                u.UserDisplayName,
                u.UserEmoji,
                u.UserPhotoUrl,
                u.CreatedAt,
                u.DayKey,
                u.Category,
                u.Text,
                Media = u.MediaJson != null ? JsonSerializer.Deserialize<object>(u.MediaJson) : null,
                Location = u.LocationJson != null ? JsonSerializer.Deserialize<object>(u.LocationJson) : null
            }).ToList();
            
            logger.LogInformation("Returning {Count} updates for team {TeamId}", response.Count, teamId);
            return Results.Ok(response);
        });

        group.MapPost("/", async (
            Guid teamId,
            TeamUpdateRequest request,
            AppDbContext db,
            ILocationRandomizer locationRandomizer,
            IHubContext<UpdatesHub> hubContext,
            ILogger<Program> logger) =>
        {
            logger.LogInformation("Creating update for team {TeamId} by user {UserId}: category={Category}, hasMedia={HasMedia}, hasLocation={HasLocation}",
                teamId, request.UserId, request.Category, request.Media != null, request.Location != null);
            
            // TODO: ValidateTeamMembership will use authenticated userId instead of request body
            var team = await db.Teams.FindAsync(teamId);
            if (team == null)
                return Results.NotFound(new { error = "Team not found" });
            
            var user = await db.UserProfiles.FindAsync(request.UserId);
            if (user == null)
                return Results.BadRequest(new { error = "User not found" });
            
            string? locationJson = null;
            if (request.Location != null)
            {
                logger.LogDebug("Randomizing location with radius {Radius}m: original=({Lat},{Lng})",
                    user.RandomizationRadius, request.Location.Lat, request.Location.Lng);
                
                // Randomize location for privacy
                var (randomLat, randomLng) = locationRandomizer.RandomizeCoordinates(
                    request.Location.Lat,
                    request.Location.Lng,
                    user.RandomizationRadius);
                
                logger.LogDebug("Randomized location: ({Lat},{Lng})", randomLat, randomLng);
                
                locationJson = JsonSerializer.Serialize(new
                {
                    lat = randomLat,
                    lng = randomLng,
                    label = request.Location.Label,
                    accuracy = request.Location.Accuracy
                });
            }
            
            var update = new TeamUpdate
            {
                Id = Guid.NewGuid(),
                TeamId = teamId,
                UserId = request.UserId,
                UserDisplayName = user.DisplayName,
                UserEmoji = user.Emoji,
                UserPhotoUrl = user.PhotoUrl,
                CreatedAt = DateTime.UtcNow,
                DayKey = request.DayKey,
                Category = request.Category,
                Text = request.Text,
                MediaJson = request.Media != null ? JsonSerializer.Serialize(request.Media) : null,
                LocationJson = locationJson
            };
            
            db.TeamUpdates.Add(update);
            await db.SaveChangesAsync();
            
            logger.LogInformation("Update created: {UpdateId} for team {TeamId}", update.Id, teamId);
            
            // Create response DTO with deserialized JSON fields
            var response = new
            {
                update.Id,
                update.TeamId,
                update.UserId,
                update.UserDisplayName,
                update.UserEmoji,
                update.UserPhotoUrl,
                update.CreatedAt,
                update.DayKey,
                update.Category,
                update.Text,
                Media = update.MediaJson != null ? JsonSerializer.Deserialize<object>(update.MediaJson) : null,
                Location = update.LocationJson != null ? JsonSerializer.Deserialize<object>(update.LocationJson) : null
            };
            
            // Emit SignalR event to notify clients of new update
            logger.LogDebug("Broadcasting update {UpdateId} via SignalR to team {TeamId}", update.Id, teamId);
            await hubContext.Clients.Group(teamId.ToString()).SendAsync("UpdateCreated", response);
            
            return Results.Created($"/api/teams/{teamId}/updates/{update.Id}", response);
        });

        return group;
    }
}
