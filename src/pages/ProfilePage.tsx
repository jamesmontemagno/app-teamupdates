import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useUserProfile } from '../contexts/UserProfileContext';
import layoutStyles from './PageLayout.module.css';
import profileStyles from './ProfilePage.module.css';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl || '');
  const [saved, setSaved] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const handleSave = () => {
    if (!displayName.trim()) return;
    setSaved(true);
    updateProfile({ 
      displayName: displayName.trim(), 
      emoji: emoji.trim() || '🌟', 
      color,
      city,
      state,
      country,
      randomizationRadius,
      photoUrl,
    });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGeocode = async () => {
    setGeocodeSuccess(false);
    try {
      await geocodeLocation(city, state, country);
      setGeocodeSuccess(true);
    } catch {
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    if (isCameraActive) {
      // Stop camera
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setIsCameraActive(false);
    } else {
      // Start camera
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        setStream(mediaStream);
        setIsCameraActive(true);
        
        // Wait for video element to be ready
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        }, 100);
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera. Please check permissions.');
      }
    }
  };

  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0);
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg');
    setPhotoUrl(dataUrl);
    
    // Stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className={layoutStyles['page']}>
      <h1 className={layoutStyles['page__title']}>Profile</h1>
      <div className={profileStyles['card']}>
        <label className={profileStyles['label']}>
          Display name
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="How should your team see you?"
          />
        </label>

        <div className={profileStyles['label']}>
          <span>Profile Photo</span>
          <p className="text text--muted" style={{ marginTop: '4px', fontSize: '0.875rem' }}>
            Upload a photo or take one with your camera
          </p>
          {photoUrl ? (
            <div style={{ marginTop: '12px' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #e0e0e0' }}>
                <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ 
                  position: 'absolute', 
                  bottom: '4px', 
                  right: '4px', 
                  fontSize: '2rem',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #e0e0e0'
                }}>
                  {emoji}
                </div>
              </div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button type="button" className="button button--soft" onClick={() => photoInputRef.current?.click()}>
                  Change Photo
                </button>
                <button type="button" className="button button--soft" onClick={handleRemovePhoto}>
                  Remove Photo
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="button" className="button button--soft" onClick={() => photoInputRef.current?.click()}>
                Upload Photo
              </button>
              <button type="button" className="button button--soft" onClick={handleCameraCapture}>
                {isCameraActive ? 'Cancel Camera' : 'Take Photo'}
              </button>
            </div>
          )}
          
          {isCameraActive && (
            <div style={{ marginTop: '12px' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                style={{ 
                  width: '100%', 
                  maxWidth: '400px', 
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0'
                }}
              />
              <button 
                type="button" 
                className="button button--primary" 
                onClick={handleTakePhoto}
                style={{ marginTop: '8px', width: '100%', maxWidth: '400px' }}
              >
                Capture Photo
              </button>
            </div>
          )}
          
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className={profileStyles['label']}>
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

        <p className={profileStyles['label']}>Accent color</p>
        <div className={profileStyles['color-palette']}>
          {colorOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`${profileStyles['color-swatch']} ${color === option ? profileStyles['color-swatch--active'] : ''}`.trim()}
              style={{ backgroundColor: option }}
              onClick={() => setColor(option)}
            />
          ))}
        </div>

        <div className={profileStyles['label']} style={{ marginTop: '24px' }}>
          <span>Default Location</span>
          <p className="text text--muted" style={{ marginTop: '4px', fontSize: '0.875rem' }}>
            Used as fallback when browser location is unavailable
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <label className={profileStyles['label']}>
            City
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Seattle"
            />
          </label>
          <label className={profileStyles['label']}>
            State
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="WA"
            />
          </label>
          <label className={profileStyles['label']}>
            Country
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="USA"
            />
          </label>
        </div>

        <label className={profileStyles['label']}>
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

        <button 
          type="button" 
          className="button button--primary" 
          onClick={handleSave}
          disabled={saved || !displayName.trim()}
        >
          {saved ? '✓ Saved!' : 'Save profile'}
        </button>
      </div>
    </div>
  );
}
