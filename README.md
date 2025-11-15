# Pulseboard

Pulseboard is a lightweight team-updating console: your crew can post text, audio, photo, or video updates, optionally tag a place, and browse everything on a timeline or map.

## Key features

- **Timeline composer:** text area, single-select categories, modern date picker, optional location, and voice/photo/video attachments with local persistence.
- **Filterable feed:** chip controls for days, categories, media types, and geotag filters, plus inline highlighting when jumping from the map.
- **Map view:** Leaflet + OpenStreetMap tiles show every geotagged update with popups that link back to the timeline.
- **Profile settings:** locally stored display name, emoji/avatar, and accent color so every post includes attribution from day one.

## Getting started

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the dev server:

   ```bash
   npm run dev -- --host
   ```

4. Build for production:

   ```bash
   npm run build
   ```

5. Preview a production build locally:

   ```bash
   npm run preview
   ```

## Architecture notes

- **React Router** powers the `/` timeline, `/map`, and `/profile` routes.
- **Context providers** manage user profiles and the updates store, which persists data to `localStorage` for offline-friendly usage.
- **Leaflet/React-Leaflet** draw the map and automatically fit to any new geotagged entries.
- **Custom hooks** (`useVoiceRecorder`, `useGeolocation`) encapsulate browser APIs while keeping UI components clean.

## Next steps

- Swap the local store with a remote API when you add a backend.
- Plug in authentication to replace the local profile with real identities.
- Extend the media handling to upload to cloud storage and stream audio/video for longer updates.
