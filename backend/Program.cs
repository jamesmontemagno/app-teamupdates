using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using System.Text.Json;
using TeamUpdates.Backend.Data;
using TeamUpdates.Backend.Endpoints;
using TeamUpdates.Backend.Hubs;
using TeamUpdates.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

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

// Add SignalR
builder.Services.AddSignalR();

// Configure CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for SignalR
    });
});

// Configure JSON serialization (camelCase)
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
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
    app.MapScalarApiReference();
}

app.UseCors();

// Map health endpoint
app.MapHealthEndpoint();

// Map API endpoints with route groups
var apiGroup = app.MapGroup("/api");

apiGroup.MapGroup("/teams")
    .MapTeamsEndpoints()
    .WithTags("Teams");

apiGroup.MapGroup("/teams/{teamId:guid}/updates")
    .MapUpdatesEndpoints()
    .WithTags("Updates");

apiGroup.MapGroup("/profile")
    .MapProfileEndpoints()
    .WithTags("Profile");

apiGroup.MapGroup("/")
    .MapUtilityEndpoints()
    .WithTags("Utility");

// Map SignalR hub
app.MapHub<UpdatesHub>("/hubs/updates");

app.Run();
