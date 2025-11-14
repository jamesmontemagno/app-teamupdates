## Team Updates App – v1 Plan

Here’s an updated plan that bakes in your preferences: first-class voice recording, modern visual date picking, and single-choice category chips per update.

### Steps

1. **Refine domain model with categories and media types**  
   - `TeamUpdate` fields:  
     - `id` (UUID), `userId`, `userDisplayName`.  
     - `text` (primary content).  
     - `media` as a discriminated union:  
       - `type: 'none' | 'audio' | 'image' | 'video'`.  
       - `previewUrl` (blob URL) and metadata (duration for audio/video, dimensions for images if needed).  
     - `createdAt` (ISO string) and `dayKey` (e.g., `YYYY-MM-DD`) for fast grouping/filtering.  
     - `category` (single-select): e.g., `'team' | 'life' | 'win' | 'blocker'` (we can tweak labels).  
     - Optional `location`: `{ lat, lng, label?: string, accuracy?: number }`.  
   - `UserProfile` fields: `{ id, displayName, color, emojiOrInitials }`, stored locally.  
   - Design everything so a future backend can reuse these shapes with minimal change.

2. **App shell and routing structure**  
   - Use a router with three main routes:  
     - `/` – Timeline.  
     - `/map` – Map.  
     - `/profile` – Local identity settings.  
   - App shell layout:  
     - Header: app name, navigation tabs (Timeline, Map, Profile).  
     - Main content area: route outlet.  
   - Ensure the layout can scale: header fixed/at top, scrollable content beneath; responsive for mobile/desktop.

3. **User profile setup (local identity, no auth)**  
   - Profile page / modal:  
     - Inputs: display name (required), optional emoji, color theme (used for avatar chip and possibly accent color).  
     - Store profile in localStorage and expose it via `UserProfileContext`.  
   - UX:  
     - If a user tries to create an update without a profile, show a friendly inline prompt or modal to set their display name first.  
     - All updates use `userId` and `userDisplayName` from profile, making attribution clear from day one.

4. **Updates store with hybrid persistence and future backend boundary**  
   - Implement a central updates store (e.g., a custom hook + context):  
     - State: array of `TeamUpdate`.  
     - Actions: `addUpdate`, `updateUpdate` (optional), `deleteUpdate` (optional), `loadUpdates`.  
   - Persistence:  
     - On load: read from localStorage (e.g., `teamUpdates_v1`).  
     - On change: debounce save to localStorage.  
   - Filters logic: separate pure functions for filtering/grouping:  
     - `filterByDateRangeOrDayKey`.  
     - `filterByCategory`.  
     - `filterByMediaType`.  
     - `filterByHasLocation`.  
   - Abstract persistence behind a repository-like interface so a future backend can plug in (e.g., `localUpdatesRepository` now, `remoteUpdatesRepository` later).

5. **Create Update composer: first-class voice + modern UX**  
   - Composer sections:  
     - Text input: multi-line, supports short and medium-length updates.  
     - Category chips:  
       - Display a row of chip-style buttons (e.g., Team, Life, Win, Blocker).  
       - Only one can be active at a time; default to a sensible category (e.g., “Team”).  
     - Media chooser (three distinct, first-class options):  
       - Voice:  
         - Button: “Record voice”.  
         - On click, request mic permission and start recording with `MediaRecorder`.  
         - Show a recording UI:  
           - Timer, visual pulse/wave animation (CSS-based), Stop button.  
           - On stop, create an audio `Blob`, generate a `blob:` URL, show playback controls (`<audio>` with play/pause + duration).  
           - Allow “Re-record” to discard and capture again.  
       - Photo:  
         - Button: “Add photo”.  
         - Use file input with `accept="image/*"`.  
         - On select, show thumbnail preview and filename/size; allow replace/delete.  
       - Video:  
         - Button: “Add video”.  
         - Use file input with `accept="video/*"`.  
         - Show poster thumbnail (where possible) or a simple video icon + duration once loaded.  
       - Only one media attachment at a time in v1 (simpler UX); we can design for one-of-three.  
     - Date selector (visual/modern):  
       - Default: “Today” (now).  
       - UI:  
         - At top: pill-style chips for relative days (Today, Yesterday, This Week).  
         - Underneath: a modern calendar/date picker for picking a specific day; highlight the selected day.  
       - Internally store full timestamp; derive `dayKey` for grouping/filtering.  
     - Location toggle:  
       - Switch: “Attach location”.  
       - If turned on:  
         - Request location permission.  
         - On success: store `lat`, `lng`, `accuracy`.  
         - Show small preview text “Near [approx address or ‘lat,lng’]” and allow manual label entry.  
         - On error/denied: show inline error and keep toggle off or show a “Retry” action.  
     - Footer:  
       - “Post update” button (disabled if required fields like text or profile are missing).  
       - Optionally show character count and a short note: “Voice, photo, and video are stored on this device in this version.”

6. **Timeline page: visual, grouped, and filterable feed**  
   - Layout:  
     - Top:  
       - Greeting with user’s name (“Hey Alex 👋, what’s new?”).  
       - Quick stats (optional): e.g., total updates today.  
     - New Update composer panel.  
     - Filter bar, using visual components:  
       - Date control:  
         - Horizontal scrollable chip row for days (Today, Yesterday, specific dates).  
         - Optionally tie into the same calendar component as the composer to keep the experience consistent.  
       - Category chips: same set as composer, but used as filter (All, Team, Life, Win, Blocker).  
       - Media filter icons: small icons (All, Text, Audio, Photo, Video).  
       - Toggle “Show only pinned to map” (has location).  
   - Feed grouping:  
     - Group updates by `dayKey`: sections labeled “Today”, “Yesterday”, or formatted date.  
   - Update card design:  
     - Header:  
       - Avatar (initials/emoji with color from `userProfile`), `userDisplayName`.  
       - Category chip badge.  
       - Timestamp (time-of-day).  
     - Body: text.  
     - Media section:  
       - Audio: inline player with play/pause and a subtle waveform-like bar (could be pure CSS for now).  
       - Image: responsive thumbnail with click-to-expand modal.  
       - Video: small embedded player.  
     - Footer:  
       - Location chip if present (“On map”).  
       - “View on map” action that navigates to `/map` with the update preselected.  
   - Smooth scroll / highlight: if navigating from map to timeline for a particular update, highlight that card briefly.

7. **Map page: Leaflet map + visual date/category controls**  
   - Map layout:  
     - Top/left panel with filters:  
       - Date chip row + calendar (same as timeline).  
       - Category chips.  
       - Media type filter.  
       - “Show only my updates” toggle (based on `userId`) if you want that later.  
     - Main panel: Leaflet map with OSM tiles.  
   - Map behavior:  
     - Show markers at each update’s location for the currently filtered set.  
     - Use different marker colors or icons by category or media type (e.g., audio vs photo vs video vs text-only).  
     - On marker click:  
       - Show popup with avatar, name, category, timestamp, text snippet, media icon(s).  
       - Include “Open in timeline” button that navigates back to `/` and focuses the card.  
   - Map defaults:  
     - If there are geotagged updates, auto-fit bounds to all markers.  
     - If not, default to a reasonable view (e.g., world or a region you care about).  
   - Future: Marker clustering when there are many updates in close proximity (can be v1.1).

8. **Permissions, error handling, and UX polish**  
   - Microphone:  
     - On first use of voice recording, show a mini explanation: what we’re recording, where it’s stored (local), and how long.  
     - Handle permission denied with a clear message and guidance to allow mic if they change their mind.  
   - Location: similarly, explain and handle errors gracefully.  
   - File limits:  
     - Enforce simple rules: max file size, max recording duration (e.g., 60–90 seconds).  
     - Show a friendly error if exceeded.  
   - Visual consistency:  
     - Establish a small design system for buttons, chips, cards, text, and icons to keep everything cohesive and modern.

9. **Future-ready architecture notes**  
   - Keep all browser-specific logic (voice recording, geolocation, localStorage) in dedicated hooks/modules for easier testing and replacement:  
     - `useVoiceRecorder` (encapsulating `MediaRecorder`).  
     - `useGeoLocation` (encapsulating `navigator.geolocation`).  
     - `updatesRepository` (local now, remote later).  
   - The UI components should depend on hooks and store APIs, not directly on browser APIs, so moving to a backend or adding auth later won’t require rewriting the whole app.
