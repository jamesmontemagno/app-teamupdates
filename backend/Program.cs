using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TeamUpdates.Backend.Data;
using TeamUpdates.Backend.Entities;
using TeamUpdates.Backend.Filters;
using TeamUpdates.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddOpenApi();

// Configure database provider
var databaseProvider = builder.Configuration.GetValue<string>("DatabaseProvider") ?? "InMemory";
if (databaseProvider == "SqlServer")
{
    var connectionString = builder.Configuration.GetConnectionString("teamupdates");
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlServer(connectionString));
}
else
{
    // Default to InMemory
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseInMemoryDatabase("TeamUpdates"));
}

// Register services
builder.Services.AddSingleton<IMediaStorageService, InMemoryMediaStorageService>();
builder.Services.AddHttpClient<IGeocodingService, GeocodingService>();
builder.Services.AddSingleton<ILocationRandomizer, LocationRandomizer>();

// Configure CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure JSON serialization (camelCase)
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

// TODO: Add authentication middleware here (GitHub OAuth)

var app = builder.Build();

// Ensure database is created and seeded
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.EnsureCreated();
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

// Health endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

// Teams endpoints
app.MapGet("/api/teams", async (AppDbContext db) =>
{
    var teams = await db.Teams
        .Where(t => t.IsPublic)
        .Select(t => new { t.Id, t.Name, t.IsPublic, t.CreatedAt })
        .ToListAsync();
    return Results.Ok(teams);
});

app.MapGet("/api/teams/{teamId:guid}", async (Guid teamId, AppDbContext db) =>
{
    var team = await db.Teams.FindAsync(teamId);
    if (team == null)
        return Results.NotFound(new { error = "Team not found" });
    
    // TODO: Check if user is member for private teams
    if (!team.IsPublic)
    {
        return Results.NotFound(new { error = "Team not found" });
    }
    
    return Results.Ok(new { team.Id, team.Name, team.IsPublic, team.CreatedAt });
});

app.MapPost("/api/teams/{teamId:guid}/join", async (Guid teamId, Guid userId, AppDbContext db) =>
{
    var team = await db.Teams.FindAsync(teamId);
    if (team == null)
        return Results.NotFound(new { error = "Team not found" });
    
    var existingMembership = await db.TeamMemberships
        .FirstOrDefaultAsync(tm => tm.UserId == userId && tm.TeamId == teamId);
    
    if (existingMembership != null)
        return Results.Ok(new { message = "Already a member" });
    
    var membership = new TeamMembership
    {
        UserId = userId,
        TeamId = teamId,
        JoinedAt = DateTime.UtcNow
    };
    
    db.TeamMemberships.Add(membership);
    await db.SaveChangesAsync();
    
    return Results.Ok(new { message = "Joined team successfully" });
});

// Updates endpoints
app.MapGet("/api/teams/{teamId:guid}/updates", async (
    Guid teamId,
    AppDbContext db,
    string? day = null,
    string? category = null,
    string? media = null,
    bool locationOnly = false) =>
{
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
    
    return Results.Ok(updates);
});

app.MapPost("/api/teams/{teamId:guid}/updates", async (
    Guid teamId,
    TeamUpdateRequest request,
    AppDbContext db,
    ILocationRandomizer locationRandomizer) =>
{
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
        // Randomize location for privacy
        var (randomLat, randomLng) = locationRandomizer.RandomizeCoordinates(
            request.Location.Lat,
            request.Location.Lng,
            user.RandomizationRadius);
        
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
    
    return Results.Created($"/api/teams/{teamId}/updates/{update.Id}", update);
});

// Profile endpoints
app.MapGet("/api/profile/{userId:guid}", async (Guid userId, AppDbContext db) =>
{
    var profile = await db.UserProfiles.FindAsync(userId);
    if (profile == null)
        return Results.NotFound(new { error = "Profile not found" });
    
    return Results.Ok(profile);
});

app.MapPost("/api/profile", async (UserProfileRequest request, AppDbContext db) =>
{
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
    
    return Results.Created($"/api/profile/{profile.Id}", profile);
});

app.MapPut("/api/profile/{userId:guid}", async (Guid userId, UserProfileRequest request, AppDbContext db) =>
{
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

app.MapGet("/api/profile/{userId:guid}/teams", async (Guid userId, AppDbContext db) =>
{
    var teams = await db.TeamMemberships
        .Where(tm => tm.UserId == userId)
        .Include(tm => tm.Team)
        .Select(tm => new { tm.Team.Id, tm.Team.Name, tm.Team.IsPublic, tm.JoinedAt })
        .ToListAsync();
    
    return Results.Ok(teams);
});

// Utility endpoints
app.MapPost("/api/geocode", async (GeocodingRequest request, IGeocodingService geocodingService) =>
{
    var result = await geocodingService.GeocodeAsync(request.City, request.State, request.Country);
    if (result == null)
        return Results.NotFound(new { error = "Location not found" });
    
    return Results.Ok(result);
});

app.Run();

// Request DTOs
record TeamUpdateRequest(
    Guid UserId,
    string DayKey,
    string Category,
    string Text,
    LocationRequest? Location,
    MediaRequest? Media
);

record LocationRequest(double Lat, double Lng, string? Label, double? Accuracy);
record MediaRequest(string Type, string? DataUrl, string? Name, int? Duration, int? Size);

record UserProfileRequest(
    string DisplayName,
    string Color,
    string Emoji,
    string? PhotoUrl,
    string? City,
    string? State,
    string? Country,
    DefaultLocationRequest? DefaultLocation,
    int? RandomizationRadius,
    LastLocationRequest? LastLocation
);

record DefaultLocationRequest(double Lat, double Lng, string? DisplayName);
record LastLocationRequest(string? City, string? State, string? Country, string? Label);

record GeocodingRequest(string City, string? State, string? Country);
