# Pulseboard - AI Coding Agent Instructions

## Project Overview
Pulseboard is a **client-side team update console** built with React 19, TypeScript, and Vite. All data persists to `localStorage` - no backend yet. Users post text/audio/photo/video updates with optional location tags, browse on a timeline or map view, and configure their profile.

## Architecture

### Context Providers (Dependency Tree)
```
main.tsx
└─ BrowserRouter
   └─ UserProfileProvider (stores user profile in localStorage)
      └─ UpdatesProvider (stores team updates in localStorage)
         └─ App (routing shell)
```

**Critical**: Context providers wrap the entire app in `main.tsx`. Import hooks via:
- `useUserProfile()` from `contexts/UserProfileContext`
- `useUpdates()` from `contexts/UpdatesContext`

### Data Flow
- **Persistence**: Both contexts auto-persist to `localStorage` on state changes
- **Updates creation**: `UpdateComposer` → `addUpdate()` → `UpdatesContext` → persists to `localStorage` (key: `teamUpdates_v1_records`)
- **Profile updates**: `ProfilePage` → `updateProfile()` → `UserProfileContext` → persists to `localStorage` (key: `teamUpdatesUserProfile`)

### Routing Structure
- `/` - TimelinePage (composer + filterable feed)
- `/map` - MapPage (Leaflet map with geotagged updates)
- `/profile` - ProfilePage (user settings: name, emoji, color, default location)

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

### Type-Safe Props
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
Manual location entry uses **Nominatim API** (OpenStreetMap) via `utils/geocoding.ts`:
- **Rate limited**: 1 request/second, enforced with `enforceRateLimit()`
- **Cached**: Results stored in Map to avoid repeat requests
- **User-Agent required**: Set to 'TeamUpdatesApp/1.0'
- Takes city/state/country, returns lat/lng + displayName

### Filter System
`FilterControls` + `utils/filters.ts` provide multi-dimensional filtering:
- Day (all | specific date)
- Category (all | team | life | win | blocker)
- Media (all | text | audio | image | video)
- Location only toggle (map page forces this on)

### Theme Support
App supports light/dark theme:
- Toggled via `App.tsx` (🌙/☀️ button)
- Stored in `localStorage` key: `theme`
- Applied via `data-theme` attribute on `<html>`

## Development Workflow

### Build & Run
```bash
npm run dev -- --host  # Dev server with network access
npm run build          # TypeScript check + Vite production build
npm run preview        # Preview production build
npm run lint           # ESLint check
```

### Adding New Features

#### Adding a New Category
1. Update `Category` type in `types.ts`
2. Add to `categoryOptions` in `UpdateComposer.tsx`
3. Update chip styles if needed

#### Adding Media Type
1. Update `MediaType` type in `types.ts`
2. Add input/capture logic in `UpdateComposer.tsx`
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

## Migration Path (Future Backend)
When adding a server:
1. Replace `localStorage` persistence in contexts with API calls
2. Keep context providers as data layer (don't prop-drill)
3. Add authentication → replace `UserProfile.id` generation
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
