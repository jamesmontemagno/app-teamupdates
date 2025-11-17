## Plan: Frontend Backend Integration with Mock Debug Mode

Integrate the backend API into the frontend React application with SignalR real-time updates, toast notifications, URL-based team routing, marketing landing page, and standalone mock mode with sample data.

### Steps

1. **Create API client layer** - build `src/api/client.ts` with base fetch wrapper (handles auth headers, JSON serialization, error handling), environment detection for API base URL (`import.meta.env.VITE_API_URL` or default to `/api`), create `src/api/types.ts` for request/response DTOs matching backend models (Team, TeamUpdate, UserProfile, GeocodingResult)

2. **Implement API service modules** - create `src/api/teamsApi.ts` (getTeams, getTeam, joinTeam), `src/api/updatesApi.ts` (getTeamUpdates, createUpdate, getUserUpdates with filtering params), `src/api/profileApi.ts` (getProfile, createProfile, updateProfile, getUserTeams), `src/api/geocodeApi.ts` (geocodeAddress), all returning typed promises matching backend responses

3. **Build mock API implementation with sample data** - create `src/api/mock/mockApi.ts` implementing same interface as real API, add `src/api/mock/seedData.ts` with pre-populated default team (public, id: `00000000-0000-0000-0000-000000000001`), 2-3 additional teams (mix of public/private), sample profiles (3-4 users with base64 photos), sample updates (varied categories, media types, locations), mock uses sessionStorage for persistence during dev session

4. **Create API factory with mode switching** - build `src/api/index.ts` that exports either real or mock API based on `import.meta.env.VITE_USE_MOCK_API`, ensure type safety with shared interfaces, provide `isMockMode()` helper, add mock mode banner in `App.tsx` header showing "🔧 Mock Mode - Using Sample Data" with "Skip to Teams" link

5. **Add toast notifications system** - install `react-hot-toast`, create `src/components/Toaster.tsx` wrapper, add to `App.tsx` root, create `src/utils/toast.ts` helpers (showSuccess, showError, showLoading), use throughout app for API feedback (errors, confirmations, loading operations)

6. **Add SignalR real-time updates to backend** - create `backend/Hubs/UpdatesHub.cs` with `SendUpdateCreated(TeamUpdate update)` method, register in `Program.cs` with `app.MapHub<UpdatesHub>("/hubs/updates")`, emit event when update created in `UpdatesEndpoints.cs`, configure CORS to allow SignalR WebSocket connections

7. **Implement SignalR frontend integration** - install `@microsoft/signalr`, create `src/api/signalr.ts` hub connection manager with auto-reconnect and exponential backoff, subscribe to `UpdateCreated` event to refresh `UpdatesContext`, only connect in real API mode (skip in mock), add connection status indicator (🟢 Live / 🔴 Disconnected) in navbar, silent reconnection with toast after 30s prolonged disconnection

8. **Create URL-based team routing structure** - update routes to `/` (landing page), `/teams` (team browser), `/teams/:teamId/timeline`, `/teams/:teamId/map`, `/teams/:teamId/profile`, `/profile/new` (profile setup), create `TeamContext.tsx` to manage current team from URL params, provide `useTeam()` hook returning `{ teamId, team, loading, error }`, fetch team details when teamId changes

9. **Build marketing landing page** - create `src/pages/LandingPage.tsx` with hero section ("Stay in Sync with Your Team's Daily Pulse", "Share updates with voice, video, and location. See what matters on a timeline or map view."), features section (📍 Location-aware updates with privacy, 🎤 Voice & video support, 🗺️ Interactive map view, 🔒 Privacy-first with randomized locations), benefits section (async team transparency, rich context, flexible sharing), CTA "Create Profile & Join a Team" → `/profile/new`, redirect to `/teams` if userId in localStorage

10. **Create team browser page** - build `src/pages/TeamBrowserPage.tsx` showing "Your Teams" section (if user has teams from `profileApi.getUserTeams()`), "Public Teams" section (`teamsApi.getTeams()`), each team as card with name/member count and "Join" button, clicking card navigates to `/teams/:teamId/timeline` (public teams allow view-only, private require membership), "Create Profile First" banner if no userId in localStorage

11. **Create profile setup page** - build `src/pages/ProfileSetupPage.tsx` with form fields: displayName (required), emoji picker (default: 🌟), color picker (default: #5f7a90), photo upload with preview (optional, base64), randomizationRadius slider (50-500m, default: 100m), submit creates profile via `profileApi.createProfile()`, stores userId in localStorage, shows toast "Profile created!", redirects to `/teams`

12. **Add team navbar with dropdown and protected routes** - update `App.tsx` navbar to include team switcher dropdown (next to theme toggle), show current team name, dropdown lists user's teams from `profileApi.getUserTeams()`, "Browse Teams" link to `/teams`, only show on team routes, add route guards: `/teams/:teamId/*` checks membership for posting (public teams allow read-only viewing), show "Join Team" button in header if not member, private teams return to `/teams` if not member

13. **Refactor UpdatesContext to use API** - replace localStorage with `updatesApi.getTeamUpdates(teamId)` from `TeamContext`, subscribe to SignalR `UpdateCreated` to prepend new updates for current team only, add `loading`/`error` states, implement optimistic updates (immediate local update + background sync with rollback on error), show toast on errors with manual retry button in `ErrorMessage` component

14. **Refactor UserProfileContext to use API** - store userId in localStorage for session persistence, fetch profile with `profileApi.getProfile(userId)` on mount, handle 404 by clearing userId and redirecting to `/profile/new`, update profile via `profileApi.updateProfile()`, replace client-side geocoding with `geocodeApi.geocodeAddress()`, remove imports/files for `utils/geocoding.ts` and `utils/randomizeLocation.ts` (server-side now)

15. **Add profile completion tracking** - add `isProfileComplete()` helper checking displayName, emoji, color, defaultLocation exist, show banner on team pages if incomplete: "👋 Complete your profile to get the most out of updates" with "Add Default Location" CTA to `/teams/:teamId/profile`, store dismissed state in sessionStorage

16. **Update UpdateComposer for backend integration** - remove client-side location randomization (backend handles), replace manual geocoding with `geocodeApi.geocodeAddress()` call, get teamId from `useTeam()` hook, userId from `useUserProfile()`, update `addUpdate` payload to include teamId, show loading spinner during API call, display toast for success ("Update posted! 🎉") and errors, disable submit if not team member

17. **Configure environment and Vite proxy** - create `.env.development` with `VITE_API_URL=/api`, `VITE_USE_MOCK_API=false`, `VITE_SIGNALR_HUB_URL=/hubs/updates`, create `.env.mock` with `VITE_USE_MOCK_API=true`, update `vite.config.ts` server proxy to forward `/api` → `http://localhost:5000/api` and `/hubs` → `http://localhost:5000/hubs`, add `.env.*.local` to `.gitignore`, document mode switching in `README.md`

18. **Add loading and error UI components** - create `src/components/LoadingSpinner.tsx` (animated spinner with optional text), `src/components/ErrorMessage.tsx` (error display with manual retry button and error details), create `src/components/SkeletonLoader.tsx` for timeline/map loading states, show spinner in contexts during initial fetch, inline errors for failed operations

### Further Considerations

All decisions have been finalized - plan is ready for implementation.
