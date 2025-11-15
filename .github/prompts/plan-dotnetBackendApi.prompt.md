## Plan: .NET 10 Minimal Web API Backend with Aspire Integration

Creating a multi-team backend API with public/private teams, membership validation via attributes, server-side geocoding/location randomization, configurable database provider, and future GitHub authentication support.

### Steps

1. **Create .NET 10 minimal API project** using `dotnet new webapi -minimal -o backend`, add NuGet packages: `Aspire.Microsoft.EntityFrameworkCore.SqlServer`, `Microsoft.EntityFrameworkCore.InMemory`, Aspire service defaults (`Aspire.Microsoft.Data.SqlClient` or equivalent), `System.Net.Http` for Nominatim geocoding

2. **Implement data layer with team privacy** - create `Entities/Team.cs` (Id, Name, IsPublic, CreatedAt), `Entities/UserProfile.cs` (Id, DisplayName, Color, Emoji, PhotoUrl, City, State, Country, DefaultLocation JSON, RandomizationRadius, LastLocation JSON), `Entities/TeamUpdate.cs` (Id, TeamId FK, UserId, UserDisplayName, UserEmoji, UserPhotoUrl, CreatedAt, DayKey, Category, Text, Media JSON, Location JSON), `Entities/TeamMembership.cs` (UserId, TeamId, JoinedAt, composite PK), `Data/AppDbContext.cs` with provider switching (InMemory/SqlServer/PostgreSQL), seed public default team, `Services/IMediaStorageService.cs` interface with `InMemoryMediaStorageService` implementation

3. **Build location and geocoding services** - create `Services/GeocodingService.cs` (IGeocodingService interface, Nominatim API client with 1-second rate limiting using `lastRequestTime` tracking, `Dictionary<string, GeocodingResult>` cache, User-Agent: TeamUpdatesApp/1.0), `Services/LocationRandomizer.cs` (ILocationRandomizer interface, randomizeCoordinates method with circular distribution math), register services in DI container

4. **Create REST API endpoints with attribute-based validation** - create `Filters/ValidateTeamMembershipAttribute.cs` endpoint filter, **Teams**: `GET /api/teams` (public teams only), `GET /api/teams/{teamId}` (404 if private + not member), `POST /api/teams/{teamId}/join` (body: {userId}), **Updates**: `GET /api/teams/{teamId}/updates` ([ValidateTeamMembership] filter, query params: ?day=&category=&media=&locationOnly=), `POST /api/teams/{teamId}/updates` ([ValidateTeamMembership], apply ILocationRandomizer if location provided), `GET /api/teams/{teamId}/updates/user/{userId}`, **Profile**: `GET /api/profile/{userId}`, `POST /api/profile`, `PUT /api/profile/{userId}`, `GET /api/profile/{userId}/teams`, **Utility**: `POST /api/geocode`

5. **Update `apphost.cs` for backend orchestration** - add backend using `builder.AddProject<Projects.Backend>("backend")`, optionally add database with `builder.AddSqlServer("sql").AddDatabase("teamupdates")` and `.WithReference(db)`, configure YARP reverse proxy: route `/api/**` → backend in run mode with `.AddRoute("api/{**catch-all}", backend)`, publish mode serves backend directly, route `/**` → Vite frontend, enable `.WithExternalHttpEndpoints()`

6. **Configure API infrastructure and future auth hooks** - add Aspire service defaults package reference, configure OpenTelemetry and `/health` endpoint, CORS policy for `http://localhost:5173` origin, camelCase JSON serialization options, create `appsettings.json` with `"DatabaseProvider": "InMemory"` and `"DefaultTeamId"`, add `Program.cs` comments: `// TODO: Add authentication middleware here (GitHub OAuth)` and `// TODO: ValidateTeamMembership will use authenticated userId instead of request body`

### Further Considerations

1. **Seed data strategy** - Should default team be seeded in `AppDbContext.OnModelCreating` (always present) or via `Program.cs` startup logic (conditional)? OnModelCreating ensures consistency across providers and migrations.

2. **Error response format** - Use `Results.Problem()` for structured RFC 7807 errors with status/title/detail, or simple `Results.NotFound()`/`Results.BadRequest(message)`? Problem Details provides better client error handling and follows REST standards.

3. **Update denormalization** - `TeamUpdate` stores `UserDisplayName`/`UserEmoji`/`UserPhotoUrl` at creation time (matches frontend design) - should these update if profile changes, or stay immutable? Immutable matches current behavior and preserves historical accuracy.
