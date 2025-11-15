# TeamUpdates Backend API

.NET 10 Minimal Web API backend for the Pulseboard team updates application.

## Quick Start

### Prerequisites
- [.NET 10 SDK](https://dot.net)
- (Optional) SQL Server for persistent storage

### Run Locally

```bash
cd backend
dotnet restore
dotnet run
```

The API will be available at `http://localhost:5000` (or the port specified in `Properties/launchSettings.json`).

### Run with Aspire Orchestration

From the repository root:
```bash
dotnet run --file apphost.cs
```

This will start both the frontend and backend with YARP routing configured.

## Configuration

### Database Provider

Edit `appsettings.json`:

```json
{
  "DatabaseProvider": "InMemory"  // or "SqlServer"
}
```

For SQL Server, add connection string:

```json
{
  "ConnectionStrings": {
    "teamupdates": "Server=localhost;Database=TeamUpdates;Trusted_Connection=True;"
  }
}
```

## API Endpoints

### Teams

- `GET /api/teams` - List all public teams
- `GET /api/teams/{teamId}` - Get team details
- `POST /api/teams/{teamId}/join?userId={userId}` - Join a team

### Updates

- `GET /api/teams/{teamId}/updates` - List team updates
  - Query params: `day`, `category`, `media`, `locationOnly`
- `POST /api/teams/{teamId}/updates` - Create an update
  ```json
  {
    "userId": "guid",
    "dayKey": "2025-11-15",
    "category": "team",
    "text": "Update text",
    "location": { "lat": 37.7749, "lng": -122.4194, "label": "SF" },
    "media": { "type": "image", "dataUrl": "data:..." }
  }
  ```

### Profile

- `GET /api/profile/{userId}` - Get user profile
- `POST /api/profile` - Create profile
  ```json
  {
    "displayName": "John Doe",
    "color": "#FF5733",
    "emoji": "👨‍💻",
    "randomizationRadius": 100
  }
  ```
- `PUT /api/profile/{userId}` - Update profile
- `GET /api/profile/{userId}/teams` - List user's teams

### Utility

- `POST /api/geocode` - Convert address to coordinates
  ```json
  {
    "city": "Seattle",
    "state": "WA",
    "country": "USA"
  }
  ```
- `GET /health` - Health check

## Architecture

### Entity Relationships

```
Team (1) ──< TeamMembership >── (1) UserProfile
  │
  └──< (many) TeamUpdate
```

### Services

- **GeocodingService**: Nominatim API client with rate limiting
- **LocationRandomizer**: Privacy-preserving coordinate randomization
- **IMediaStorageService**: Abstraction for media storage (in-memory or Azure Blob)

### Features

- ✅ Multi-team support with public/private visibility
- ✅ Server-side location randomization for privacy
- ✅ Configurable database provider (InMemory/SqlServer)
- ✅ CORS configured for frontend integration
- ✅ OpenAPI documentation in development mode
- ✅ Health checks for monitoring

## Development

### Build

```bash
dotnet build
```

### Test Endpoints

Using curl:

```bash
# Health check
curl http://localhost:5000/health

# Create profile
curl -X POST http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Test","color":"#FF5733","emoji":"👨‍💻"}'

# List teams
curl http://localhost:5000/api/teams
```

### Project Structure

```
backend/
├── Data/               # EF Core DbContext and configuration
├── Entities/           # Domain models
├── Filters/           # Endpoint filters for authorization
├── Services/          # Business logic and external integrations
├── Program.cs         # API configuration and endpoints
└── appsettings.json  # Configuration
```

## Future Enhancements

- [ ] GitHub OAuth authentication
- [ ] Azure Blob Storage for media
- [ ] Team approval workflow
- [ ] Rate limiting middleware
- [ ] Comprehensive logging
- [ ] Unit and integration tests

## Notes

- **Authentication**: Currently accepts userId in request body. Will be replaced with authenticated user from OAuth.
- **Media Storage**: Using in-memory storage. Replace with Azure Blob Storage for production.
- **Geocoding**: External API calls may be blocked in restricted networks.

## License

MIT
