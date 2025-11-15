# Pulseboard - AI Coding Agent Instructions

## Project Overview
Pulseboard is a **team update console** with React 19 frontend and ASP.NET Core backend. Users can join teams, post text/audio/photo/video updates with optional location tags, and browse updates on a timeline or map view. The app supports both **real API mode** (with SignalR for real-time updates) and **mock mode** (using sessionStorage for local development).

## Architecture

### Context Providers (Dependency Tree)
```
main.tsx
└─ BrowserRouter
   └─ UserProfileProvider (syncs with backend API)
      └─ App (routing shell)
         └─ TeamProvider (manages current team from URL)
            └─ UpdatesProvider (fetches team updates + SignalR)
               └─ TeamPage
```

**Critical**: Context providers wrap the entire app in `main.tsx`. Import hooks via:
- `useUserProfile()` from `contexts/UserProfileContext`
- `useTeam()` from `contexts/TeamContext`
- `useUpdates()` from `contexts/UpdatesContext`

### Data Flow
- **API Layer**: All data flows through `api/index.ts` factory that switches between real and mock APIs
- **Real mode**: Uses REST endpoints + SignalR for real-time updates
- **Mock mode**: Uses sessionStorage with seed data from `api/mock/seedData.ts`
- **Updates creation**: `UpdateComposer` → `addUpdate()` → API → SignalR broadcast
- **Profile updates**: `ProfilePage` → `updateProfile()` → API

### Routing Structure
- `/` - LandingPage (marketing page, redirects if user exists)
- `/teams` - TeamBrowserPage (browse/join public teams)
- `/teams/:teamId` - TeamPage (timeline/map toggle + add update modal)
- `/profile/new` - ProfileSetupPage (onboarding)
- `/profile/edit` - ProfilePage (user settings + leave team option)

### Component Architecture
**TeamPage uses modular components**:
- `TeamHeader` - Title, segmented control (Timeline/Map), Add Update button
- `TimelineView` - Displays grouped updates by day
- `MapView` - Leaflet map with geotagged updates
- `UpdateComposerModal` - Modal wrapper for creating updates
- `FilterControls` - Multi-dimensional filtering UI

## Key Conventions

### CSS Modules Pattern
**All components use CSS Modules** for scoped styling. Import pattern:
```tsx
import styles from './ComponentName.module.css';
// Use: className={styles['class-name']}
```
Pages share `PageLayout.module.css` for consistent layout:
```tsx
import layoutStyles from './PageLayout.module.css';
```

### API Factory Pattern
All API calls go through `api/index.ts` which switches between real and mock implementations:
- Set `VITE_USE_MOCK_API=true` in `.env.development` for mock mode
- Mock API uses sessionStorage with seed data (teams, profiles, updates)
- Real API connects to ASP.NET Core backend at `VITE_API_URL`

### SignalR Real-Time Updates
- `api/signalr.ts` manages WebSocket connection for live updates
- Auto-reconnects with exponential backoff
- Skips connection entirely in mock mode
- `UpdatesContext` subscribes to `UpdateCreated` events

### Mock Mode Features
- Seed data in `api/mock/seedData.ts` (3 teams, 4 users, 6 updates)
- Users must manually join teams (no auto-join)
- `mockLeaveTeam()` allows removing memberships
- Console logging shows API operations for debugging
All components use TypeScript interfaces. See `types.ts` for core data types:
- `TeamUpdate` - update with media, location, user attribution
- `UserProfile` - profile with emoji, color, default location, randomization radius
- `MediaAttachment` - audio/image/video with dataUrl
- `LocationPin` - lat/lng with optional label

### Browser API Encapsulation
Custom hooks wrap browser APIs:
- `useVoiceRecorder(maxSeconds)` - MediaRecorder for audio capture
- `useGeolocation({ randomizationRadius })` - Navigator.geolocation with privacy randomization
- Both return `status` ('idle' | 'pending' | 'ready' | 'error') for loading states

### Location Privacy
**All geolocations are randomized** using `randomizeCoordinates()` from `utils/randomizeLocation.ts`:
- Applies user's `randomizationRadius` (default 100m)
- Used in `useGeolocation`, `UpdateComposer` geocoding, and fallback to default location
- Map page displays "Locations are randomized for privacy" notice

### Geocoding
Manual location entry uses **Nominatim API** (OpenStreetMap) via backend `/api/geocode` endpoint:
- Backend proxies requests to avoid CORS issues
- Frontend calls `geocodeAddress()` from `api/geocodeApi.ts`
- Takes city/state/country, returns lat/lng + displayName
- Used in ProfilePage for setting default location

### Filter System
`FilterControls` + `utils/filters.ts` provide multi-dimensional filtering:
- Day (all | specific date)
- Category (all | team | life | win | blocker)
- Media (all | text | audio | image | video)
- Location only toggle (automatically enabled in map view)

### Team Management
- Users can browse public teams on `/teams`
- Join teams via "Join" button (calls `joinTeam()` API)
- Leave teams via ProfilePage "Leave Team" button
- TeamNavbar dropdown shows user's teams for quick switching

## Development Workflow

### Environment Setup
```bash
# Frontend
cd frontend
npm install
npm run dev  # Starts on http://localhost:5173

# Backend (in separate terminal)
cd backend
dotnet run   # Starts on http://localhost:5000
```

### Environment Variables
Create `frontend/.env.development`:
```env
VITE_API_URL=/api
#### Adding a New API Endpoint
1. Add interface to `api/types.ts`
2. Create service file in `api/` (e.g., `teamsApi.ts`)
3. Add mock implementation in `api/mock/mockApi.ts`
4. Export from `api/index.ts` with mode switching

#### Adding a New Component
1. Create component file (PascalCase: `ComponentName.tsx`)
2. Create CSS module file (`ComponentName.module.css`)
3. Export from component and import where needed
4. Follow existing patterns (functional components, TypeScript props)

#### Adding Profile Fields
1. Update `UserProfile` interface in `api/types.ts`
2. Add to backend `Entities/UserProfile.cs`
3. Add form fields in `ProfilePage.tsx`
### Common Gotchas
- **Leaflet icons**: Require manual CDN setup (see `MapView.tsx` L.Icon.Default config)
- **Media size limit**: 6MB enforced in `UpdateComposer` (reasonable upload size)
- **Date handling**: Use `date-fns` + custom utils (`formatDayKey`, `friendlyDayLabel` in `utils/date.ts`)
- **Camera access**: Requires HTTPS or localhost; handle permissions gracefully
- **SignalR connection**: Auto-skipped in mock mode, reconnects automatically in real mode
- **Team context**: Only available within `/teams/:teamId` routes

## API Integration

### Switching Modes
- Mock mode: Set `VITE_USE_MOCK_API=true` - uses sessionStorage, no backend needed
- Real mode: Set `VITE_USE_MOCK_API=false` - connects to backend API

### Backend Structure
- ASP.NET Core minimal APIs
- In-memory database (EF Core)
- SignalR hub at `/hubs/updates`
- Endpoints under `/api/*`
- See `backend/` directory for implementation
3. Add preview rendering in `UpdateCard.tsx`
4. Update filter logic in `FilterControls.tsx`

#### Adding Profile Fields
1. Update `UserProfile` interface in `types.ts`
2. Add form fields in `ProfilePage.tsx`
3. Update `defaultProfile` in `UserProfileContext.tsx`

### Common Gotchas
- **Leaflet icons**: Require manual CDN setup (see `MapPage.tsx` L.Icon.Default config)
- **Media size limit**: 6MB enforced in `UpdateComposer` (localStorage constraint)
- **Date handling**: Use `date-fns` + custom utils (`formatDayKey`, `friendlyDayLabel` in `utils/date.ts`)
- **Camera access**: Requires HTTPS or localhost; handle permissions gracefully
- **localStorage quota**: ~5-10MB; media stored as base64 DataURLs (less efficient)

## Testing & Debugging
- **Mock mode**: Check browser console for API operation logs
- **SessionStorage**: DevTools > Application > Session Storage to inspect mock data
- **SignalR**: Watch console for connection status, reconnection attempts
- **Network**: Monitor API calls in Network tab
- **Leaflet**: Check console for tile loading errors, marker creation
- **Clear data**: In mock mode, clear sessionStorage to reset

## Future Enhancements
- [ ] Add authentication (GitHub OAuth planned)
- [ ] Replace in-memory DB with PostgreSQL/SQL Server
- [ ] Upload media to Azure Blob Storage instead of base64
- [ ] Add user avatars and team icons
- [ ] Implement push notifications
- [ ] Add update reactions/comments
4. Upload media to cloud storage → store URLs instead of DataURLs
5. Consider server-side geocoding for better rate limits

## Testing & Debugging
- Use browser DevTools > Application > Local Storage to inspect persisted data
- Clear all data: delete `teamUpdates_v1_records`, `teamUpdatesUserProfile`, `teamUpdatesOnboarded` keys
- Check Network tab for Nominatim requests (should see rate limiting delays)
- Leaflet debug: Open browser console, check for tile loading errors

## Code Style
- **Functional components**: Use hooks, no class components
- **Naming**: PascalCase for components, camelCase for utils/hooks
- **CSS**: BEM-style naming in modules (`component__element--modifier`)
- **Type annotations**: Explicit on all function params/returns
- **Error handling**: Try/catch with user-friendly messages (see geocoding examples)


## Linting

Always run `npm run lint` to ensure code quality before commits.
