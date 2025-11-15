# Pulseboard

Pulseboard is a lightweight team-updating console: your crew can post text, audio, photo, or video updates, optionally tag a place, and browse everything on a timeline or map.

## Key features

- **Timeline composer:** text area, single-select categories, modern date picker, optional location, and voice/photo/video attachments.
- **Filterable feed:** chip controls for days, categories, media types, and geotag filters, plus inline highlighting when jumping from the map.
- **Map view:** Leaflet + OpenStreetMap tiles show every geotagged update with popups that link back to the timeline.
- **Profile settings:** display name, emoji/avatar, and accent color so every post includes attribution.
- **Backend API:** .NET 10 Minimal API with Entity Framework Core for data persistence
- **Real-time updates:** SignalR integration for live update notifications
- **Mock mode:** Standalone frontend development with sample data (no backend required)

## Architecture

### Frontend
- **React 19** with TypeScript and Vite
- **React Router** for client-side routing
- **Context API** for state management
- **react-hot-toast** for notifications
- **SignalR** for real-time updates
- **Leaflet** for interactive maps
- **CSS Modules** for scoped styling

### Backend
- **.NET 10** Minimal Web API
- **Entity Framework Core** with InMemory/SqlServer providers
- **SignalR** for real-time communication
- **OpenTelemetry** for observability
- **Aspire** for orchestration

### Integration Modes

The application supports two operational modes:

1. **Real API Mode** (default): Frontend connects to backend API via HTTP and SignalR
2. **Mock Mode**: Frontend uses in-memory sample data with sessionStorage persistence

## Getting started

### Prerequisites
- [.NET Aspire CLI](https://aspire.dev/get-started/install-cli/)
- [Docker](https://docs.docker.com/get-docker/)
- Node.js 20+

### Option 1: Full Stack with Aspire (Recommended)

Run both frontend and backend with real-time SignalR integration:

```bash
# Run in development mode with hot reload
aspire run
```

This starts:
- Backend API on `http://localhost:5000`
- Frontend with Vite dev server
- YARP proxy routing `/api/**` to backend
- SignalR hub at `/hubs/updates`

Access the application through the Aspire dashboard.

**Deploy to Docker Compose:**

```bash
aspire deploy
```

This builds both frontend and backend, creates container images, and starts them with Docker Compose.

**Other commands:**
```bash
aspire do docker-compose-down-dc  # Teardown deployment
aspire do build                    # Build container images only
```

### Option 2: Frontend with Mock Data (No Backend Required)

Run the frontend standalone with sample data:

```bash
cd frontend
npm install
VITE_USE_MOCK_API=true npm run dev
```

Or create `.env.local`:
```env
VITE_USE_MOCK_API=true
```

Then run:
```bash
npm run dev
```

Mock mode features:
- Pre-populated teams, profiles, and updates
- sessionStorage persistence during development session
- All API operations work with sample data
- Mock mode banner shown in app header
- No backend or database required

### Option 3: Frontend Only (Connect to Existing Backend)

```bash
cd frontend
npm install

# Configure backend URL
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
echo "VITE_USE_MOCK_API=false" >> .env.local

npm run dev
```

### Option 4: Backend Only

```bash
cd backend
dotnet restore
dotnet run
```

Backend runs on `http://localhost:5000` by default.

## Environment Configuration

### Frontend Environment Variables

Create `.env.local` in the `frontend/` directory:

```env
# API Mode (true = mock data, false = real API)
VITE_USE_MOCK_API=false

# Backend API URL (used when VITE_USE_MOCK_API=false)
VITE_API_URL=/api

# SignalR Hub URL (used when VITE_USE_MOCK_API=false)
VITE_SIGNALR_HUB_URL=/hubs/updates

# Backend URL for standalone dev (optional, defaults shown)
VITE_BACKEND_URL=http://localhost:5000
```

### Backend Configuration

Edit `backend/appsettings.json`:

```json
{
  "DatabaseProvider": "InMemory",  // or "SqlServer"
  "ConnectionStrings": {
    "teamupdates": "Server=...;Database=TeamUpdates;..."
  }
}
```

## Architecture notes

### Frontend Architecture
- **React Router** manages routing with `/teams/:teamId` for team pages
- **Context providers** manage user profiles, team context, and updates
- **API Client Layer** with automatic mode switching (real/mock)
- **SignalR Integration** for real-time update notifications (real mode only)
- **Component-based UI**: TeamHeader, TimelineView, MapView, UpdateComposerModal
- **Leaflet** for interactive map view
- **Custom hooks** (`useVoiceRecorder`, `useGeolocation`) encapsulate browser APIs
- **Toast notifications** for user feedback on API operations

### Backend Architecture
- **Minimal API** pattern with endpoint groups
- **Entity Framework Core** with provider abstraction (InMemory/SqlServer)
- **SignalR Hub** for broadcasting update events
- **Services**: Geocoding (Nominatim), Location Randomization, Media Storage
- **CORS** configured for frontend origin
- **Health checks** for monitoring
- **OpenAPI** documentation in development mode

### Data Flow

**Real API Mode:**
```
Frontend → API Client → Backend Endpoints
                     ← JSON Response
Frontend ← SignalR Hub ← Update Created Event
```

**Mock Mode:**
```
Frontend → API Client → Mock API Implementation
                     ← Sample Data from sessionStorage
```

### Key Components

**Frontend:**
- `src/api/client.ts` - Base HTTP client with error handling
- `src/api/index.ts` - API factory with mode switching
- `src/api/mock/` - Mock API implementation with sample data
- `src/api/signalr.ts` - SignalR connection manager
- `src/components/TeamHeader.tsx` - Team page header with view toggle
- `src/components/TimelineView.tsx` - Timeline updates display
- `src/components/MapView.tsx` - Leaflet map with markers
- `src/components/UpdateComposerModal.tsx` - Add update modal
- `src/components/Toaster.tsx` - Toast notification wrapper
- `src/utils/toast.ts` - Toast helper functions

**Backend:**
- `backend/Program.cs` - Application configuration and endpoint mapping
- `backend/Hubs/UpdatesHub.cs` - SignalR hub for real-time updates
- `backend/Endpoints/` - Minimal API endpoint definitions
- `backend/Services/` - Business logic services
- `backend/Data/AppDbContext.cs` - EF Core database context

## Aspire Orchestration

The project uses .NET Aspire for orchestration via `apphost.cs`:

- **Development Mode** (`aspire run`): 
  - YARP routes `/api/**` to backend API
  - YARP routes all other requests to Vite dev server for hot reload
  - SignalR WebSocket connections proxied through YARP
- **Production Mode** (`aspire deploy`): 
  - YARP serves pre-built static files from `frontend/dist`
  - Backend API runs in container
- **Docker Compose Environment**: Manages containerized deployment
- **External HTTP Endpoints**: Enables external access to the application

**Project Structure:**
```
.
├── apphost.cs              # Aspire AppHost configuration
├── apphost.run.json        # Aspire runtime configuration
├── .aspire/                # Generated Aspire artifacts (gitignored)
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── api/            # API client layer
│   │   │   ├── mock/       # Mock API implementation
│   │   │   ├── client.ts   # HTTP client
│   │   │   ├── signalr.ts  # SignalR connection
│   │   │   └── index.ts    # API factory
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── utils/          # Utility functions
│   ├── .env.development    # Development environment config
│   └── .env.mock           # Mock mode config
└── backend/                # .NET 10 Minimal Web API
    ├── Endpoints/          # API endpoint definitions
    ├── Hubs/               # SignalR hubs
    ├── Services/           # Business logic
    ├── Entities/           # Data models
    └── Data/               # EF Core context
```

## API Documentation

When running in development mode, API documentation is available at:
- Scalar UI: `http://localhost:5000/scalar/v1`
- OpenAPI spec: `http://localhost:5000/openapi/v1.json`

### Available Endpoints

**Teams:**
- `GET /api/teams` - List public teams
- `GET /api/teams/{teamId}` - Get team details
- `POST /api/teams/{teamId}/join` - Join a team

**Updates:**
- `GET /api/teams/{teamId}/updates` - List team updates (with filters)
- `POST /api/teams/{teamId}/updates` - Create a new update

**Profile:**
- `GET /api/profile/{userId}` - Get user profile
- `POST /api/profile` - Create user profile
- `PUT /api/profile/{userId}` - Update user profile
- `GET /api/profile/{userId}/teams` - List user's teams

**Utility:**
- `POST /api/geocode` - Geocode an address to coordinates

**SignalR:**
- Hub: `/hubs/updates`
- Events: `UpdateCreated`

## Development Workflow

### Adding New Features

1. **API Changes:**
   - Add DTOs to `frontend/src/api/types.ts`
   - Add backend models to `backend/Models/`
   - Add backend endpoints to `backend/Endpoints/`
   - Add frontend API methods to `frontend/src/api/`
   - Add mock implementation to `frontend/src/api/mock/mockApi.ts`

2. **UI Changes:**
   - Add components to `frontend/src/components/`
   - Use toast helpers from `frontend/src/utils/toast.ts`
   - Use LoadingSpinner, ErrorMessage, SkeletonLoader components

3. **Real-time Features:**
   - Emit SignalR events from backend endpoints
   - Subscribe to events in frontend using `getSignalRConnection()`

### Testing Mock Mode

```bash
cd frontend
VITE_USE_MOCK_API=true npm run dev
```

You should see a "🔧 Mock Mode - Using Sample Data" banner in the app header.

### Testing Real API Mode

```bash
# Terminal 1: Start backend
cd backend
dotnet run

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Or use Aspire:
```bash
aspire run
```

## Next steps

- **Authentication**: Add GitHub OAuth integration
- **Team Creation**: Allow users to create new teams
- **Team Invitations**: Implement private team invitation system
- **Cloud Storage**: Replace base64 media with Azure Blob Storage
- **Production Database**: Configure SQL Server for production deployment
- **Rate Limiting**: Add API rate limiting for external geocoding
- **Caching**: Implement Redis for distributed caching
- **Reactions**: Add emoji reactions to updates
- **Comments**: Enable threaded discussions on updates
