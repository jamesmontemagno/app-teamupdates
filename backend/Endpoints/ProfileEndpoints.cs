using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TeamUpdates.Backend.Data;
using TeamUpdates.Backend.Entities;
using TeamUpdates.Backend.Models;

namespace TeamUpdates.Backend.Endpoints;

public static class ProfileEndpoints
{
    public static RouteGroupBuilder MapProfileEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/{userId:guid}", async (Guid userId, AppDbContext db, ILogger<Program> logger) =>
        {
            logger.LogInformation("Fetching profile for user {UserId}", userId);
            var profile = await db.UserProfiles.FindAsync(userId);
            if (profile == null)
                return Results.NotFound(new { error = "Profile not found" });
            
            return Results.Ok(profile);
        });

        group.MapPost("/", async (UserProfileRequest request, AppDbContext db, ILogger<Program> logger) =>
        {
            logger.LogInformation("Creating profile: {DisplayName} ({Emoji})", request.DisplayName, request.Emoji);
            var profile = new UserProfile
            {
                Id = Guid.NewGuid(),
                DisplayName = request.DisplayName,
                Color = request.Color,
                Emoji = request.Emoji,
                PhotoUrl = request.PhotoUrl,
                City = request.City,
                State = request.State,
                Country = request.Country,
                DefaultLocationJson = request.DefaultLocation != null 
                    ? JsonSerializer.Serialize(request.DefaultLocation) 
                    : null,
                RandomizationRadius = request.RandomizationRadius ?? 100,
                LastLocationJson = request.LastLocation != null 
                    ? JsonSerializer.Serialize(request.LastLocation) 
                    : null
            };
            db.UserProfiles.Add(profile);
            await db.SaveChangesAsync();
            
            logger.LogInformation("Profile created: {UserId} - {DisplayName}", profile.Id, profile.DisplayName);
            return Results.Created($"/api/profile/{profile.Id}", profile);
        });

        group.MapPut("/{userId:guid}", async (Guid userId, UserProfileRequest request, AppDbContext db, ILogger<Program> logger) =>
        {
            logger.LogInformation("Updating profile for user {UserId}", userId);
            var profile = await db.UserProfiles.FindAsync(userId);
            if (profile == null)
                return Results.NotFound(new { error = "Profile not found" });
            
            profile.DisplayName = request.DisplayName;
            profile.Color = request.Color;
            profile.Emoji = request.Emoji;
            profile.PhotoUrl = request.PhotoUrl;
            profile.City = request.City;
            profile.State = request.State;
            profile.Country = request.Country;
            profile.DefaultLocationJson = request.DefaultLocation != null 
                ? JsonSerializer.Serialize(request.DefaultLocation) 
                : null;
            profile.RandomizationRadius = request.RandomizationRadius ?? 100;
            profile.LastLocationJson = request.LastLocation != null 
                ? JsonSerializer.Serialize(request.LastLocation) 
                : null;
            
            await db.SaveChangesAsync();
            
            return Results.Ok(profile);
        });

        group.MapGet("/{userId:guid}/teams", async (Guid userId, AppDbContext db) =>
        {
            var teams = await db.TeamMemberships
                .Where(tm => tm.UserId == userId)
                .Include(tm => tm.Team)
                .Select(tm => new { tm.Team.Id, tm.Team.Name, tm.Team.IsPublic, tm.JoinedAt })
                .ToListAsync();
            
            return Results.Ok(teams);
        });

        return group;
    }
}
