import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useUserProfile } from '../contexts/UserProfileContext';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

L.Icon.Default.mergeOptions({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
});

const colorOptions = ['#5f7a90', '#c05655', '#2a9d8f', '#7c3aed', '#f97316'];
const emojiOptions = ['🌟', '🚀', '💡', '🎯', '🔥', '⚡', '💪', '🎨', '🌈', '✨', '🎉', '💻', '📱', '🎮', '🏃', '🌺'];

export function ProfilePage() {
  const { profile, updateProfile, geocodeLocation, geocoding, geocodeError } = useUserProfile();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [emoji, setEmoji] = useState(profile.emoji);
  const [color, setColor] = useState(profile.color);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const [city, setCity] = useState(profile.city || '');
  const [state, setState] = useState(profile.state || '');
  const [country, setCountry] = useState(profile.country || '');
  const [randomizationRadius, setRandomizationRadius] = useState(profile.randomizationRadius || 100);
  const [geocodeSuccess, setGeocodeSuccess] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const handleSave = () => {
    if (!displayName.trim()) return;
    updateProfile({ 
      displayName: displayName.trim(), 
      emoji: emoji.trim() || '🌟', 
      color,
      city,
      state,
      country,
      randomizationRadius,
    });
  };

  const handleGeocode = async () => {
    setGeocodeSuccess(false);
    try {
      await geocodeLocation(city, state, country);
      setGeocodeSuccess(true);
    } catch (error) {
      // Error is handled by context
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    
    const map = L.map(mapContainerRef.current, {
      center: [0, 0],
      zoom: 2,
      scrollWheelZoom: false,
      zoomControl: true,
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
    
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update map when location changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !profile.defaultLocation) return;

    // Remove old marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Add new marker
    const marker = L.marker([profile.defaultLocation.lat, profile.defaultLocation.lng]);
    marker.addTo(map);
    markerRef.current = marker;

    // Center map on marker
    map.setView([profile.defaultLocation.lat, profile.defaultLocation.lng], 13);

    if (profile.defaultLocation.displayName) {
      marker.bindPopup(profile.defaultLocation.displayName).openPopup();
    }
  }, [profile.defaultLocation]);

  const handleEmojiSelect = (selectedEmoji: string) => {
    setEmoji(selectedEmoji);
    setShowEmojiPicker(false);
  };

  const handleCustomEmojiSubmit = () => {
    if (customEmoji.trim()) {
      setEmoji(customEmoji.trim());
      setCustomEmoji('');
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page__title">Profile</h1>
      <div className="card">
        <label className="label">
          Display name
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="How should your team see you?"
          />
        </label>

        <div className="label">
          <span>Your Emoji</span>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
            <button 
              type="button" 
              className="emoji-button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Change emoji"
            >
              {emoji}
            </button>
            <span className="text text--muted">Click to change</span>
          </div>
        </div>

        {showEmojiPicker && (
          <div className="picker-popup">
            <div className="picker-popup__header">
              <h3>Choose your emoji</h3>
              <button 
                type="button" 
                className="picker-popup__close"
                onClick={() => setShowEmojiPicker(false)}
              >
                ✕
              </button>
            </div>
            <div className="emoji-grid">
              {emojiOptions.map((emojiOption) => (
                <button
                  key={emojiOption}
                  type="button"
                  className={`emoji-option ${emoji === emojiOption ? 'emoji-option--active' : ''}`}
                  onClick={() => handleEmojiSelect(emojiOption)}
                >
                  {emojiOption}
                </button>
              ))}
            </div>
            <div className="picker-popup__custom">
              <input
                type="text"
                placeholder="Or enter custom emoji..."
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                className="custom-emoji-input"
                maxLength={2}
              />
              <button 
                type="button" 
                className="button button--soft"
                onClick={handleCustomEmojiSubmit}
                disabled={!customEmoji.trim()}
              >
                Use Custom
              </button>
            </div>
          </div>
        )}

        <p className="label">Accent color</p>
        <div className="color-palette">
          {colorOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`color-swatch ${color === option ? 'color-swatch--active' : ''}`}
              style={{ backgroundColor: option }}
              onClick={() => setColor(option)}
            />
          ))}
        </div>

        <div className="label" style={{ marginTop: '24px' }}>
          <span>Default Location</span>
          <p className="text text--muted" style={{ marginTop: '4px', fontSize: '0.875rem' }}>
            Used as fallback when browser location is unavailable
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <label className="label">
            City
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Seattle"
            />
          </label>
          <label className="label">
            State
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="WA"
            />
          </label>
          <label className="label">
            Country
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="USA"
            />
          </label>
        </div>

        <label className="label">
          Location randomization: {randomizationRadius}m
          <input
            type="range"
            min="0"
            max="1000"
            step="50"
            value={randomizationRadius}
            onChange={(e) => setRandomizationRadius(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <p className="text text--muted" style={{ marginTop: '4px', fontSize: '0.875rem' }}>
            Adds random offset to protect privacy (0 = exact location)
          </p>
        </label>

        <button
          type="button"
          className="button button--soft"
          onClick={handleGeocode}
          disabled={geocoding || (!city && !state && !country)}
        >
          {geocoding ? 'Geocoding...' : 'Geocode Location'}
        </button>

        {geocodeError && (
          <p className="text text--error" style={{ marginTop: '8px' }}>
            {geocodeError}
          </p>
        )}

        {geocodeSuccess && profile.defaultLocation && (
          <p className="text" style={{ marginTop: '8px', color: '#2a9d8f' }}>
            ✓ Location geocoded: {profile.defaultLocation.lat.toFixed(4)}, {profile.defaultLocation.lng.toFixed(4)}
          </p>
        )}

        {profile.defaultLocation && (
          <div style={{ marginTop: '16px', height: '200px', borderRadius: '8px', overflow: 'hidden' }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
          </div>
        )}

        <button type="button" className="button button--primary" onClick={handleSave}>
          Save profile
        </button>
      </div>
    </div>
  );
}
