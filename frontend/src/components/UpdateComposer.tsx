import { useEffect, useRef, useState } from 'react';
import { subDays } from 'date-fns';
import type { Category, LocationPin, MediaAttachment, MediaType, UserProfile } from '../types';
import { formatDayKey } from '../utils/date';
import { useGeolocation } from '../hooks/useGeolocation';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useUserProfile } from '../contexts/UserProfileContext';
import { randomizeCoordinates } from '../utils/randomizeLocation';
import { geocodeAddress } from '../utils/geocoding';
import { logWarn, logError, recordMediaCaptured } from '../telemetry';
import styles from './UpdateComposer.module.css';

export interface ComposerPayload {
  text: string;
  category: Category;
  media: MediaAttachment;
  createdAt: string;
  location?: LocationPin;
}

interface UpdateComposerProps {
  onCreate: (payload: ComposerPayload) => void;
  profile: UserProfile;
}

const MAX_MEDIA_BYTES = 6 * 1024 * 1024;

const categoryOptions: { id: Category; label: string }[] = [
  { id: 'team', label: 'Team' },
  { id: 'life', label: 'Life' },
  { id: 'win', label: 'Win' },
  { id: 'blocker', label: 'Blocker' },
];

const emojiOptions = ['🌟', '🚀', '💡', '🎯', '🔥', '⚡', '💪', '🎨', '🌈', '✨', '🎉', '💻', '📱', '🎮', '🏃', '🌺'];

const toDataUrl = (file: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

export function UpdateComposer({ onCreate, profile }: UpdateComposerProps) {
  const { updateProfile } = useUserProfile();
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Category>('team');
  const [selectedDate, setSelectedDate] = useState(formatDayKey(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const [media, setMedia] = useState<MediaAttachment>({ type: 'none' });
  const [attachLocation, setAttachLocation] = useState(false);
  const [manualLabel, setManualLabel] = useState('');
  const [locationPin, setLocationPin] = useState<LocationPin | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [manualCountry, setManualCountry] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [captureStream, setCaptureStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const captureVideoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const captureCancelledRef = useRef(false);

  // Pre-fill location fields from last location when checkbox is toggled
  useEffect(() => {
    if (attachLocation && profile.lastLocation) {
      setManualCity(profile.lastLocation.city || '');
      setManualState(profile.lastLocation.state || '');
      setManualCountry(profile.lastLocation.country || '');
      setManualLabel(profile.lastLocation.label || '');
    }
  }, [attachLocation, profile.lastLocation]);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const geo = useGeolocation({ randomizationRadius: profile.randomizationRadius || 0 });
  const voice = useVoiceRecorder(60);

  useEffect(() => {
    if (attachLocation && geo.status === 'idle') {
      geo.requestLocation();
    }
  }, [attachLocation, geo]);

  useEffect(() => {
    if (geo.position) {
      setLocationPin({ ...geo.position, label: geo.position.label });
    } else if (geo.status === 'error' && profile.defaultLocation) {
      // Fallback to profile default location with randomization
      logWarn('Using default location, geolocation unavailable', {
        'component': 'UpdateComposer',
        'reason': geo.error || 'unknown',
        'has_default': !!profile.defaultLocation
      });
      
      const randomized = randomizeCoordinates(
        profile.defaultLocation.lat,
        profile.defaultLocation.lng,
        profile.randomizationRadius || 0
      );
      setLocationPin({
        lat: randomized.lat,
        lng: randomized.lng,
        label: profile.defaultLocation.displayName,
      });
    }
  }, [geo.position, geo.status, geo.error, profile.defaultLocation, profile.randomizationRadius]);

  useEffect(() => {
    if (voice.recorded) {
      setMedia({
        type: 'audio',
        dataUrl: voice.recorded.url,
        duration: Math.round(voice.recorded.duration),
        size: voice.recorded.size,
        name: 'Voice update',
      });
    }
  }, [voice.recorded]);

  const todayKey = formatDayKey(new Date());
  const yesterdayKey = formatDayKey(subDays(new Date(), 1));

  const locationLabel = manualLabel.trim() || locationPin?.label;

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>, type: MediaType) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MEDIA_BYTES) {
      setMediaError('Media is too large. Please pick a file smaller than 6MB.');
      logWarn('Media file exceeds size limit', {
        'media.type': type,
        'media.size': file.size,
        'media.limit': MAX_MEDIA_BYTES
      });
      return;
    }
    const dataUrl = await toDataUrl(file);
    setMedia({
      type,
      dataUrl,
      name: file.name,
      size: file.size,
    });
    setMediaError(null);
    // Only record metrics for actual media types (not 'none')
    if (type === 'image' || type === 'video') {
      recordMediaCaptured(type === 'image' ? 'photo' : type);
    }
  };

  const isValid = text.trim().length > 0 && profile.displayName.trim().length > 0;

  const computedCreatedAt = () => {
    const base = new Date(selectedDate);
    const now = new Date();
    base.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    return base.toISOString();
  };

  const handleSubmit = () => {
    if (!isValid) return;
    const payload: ComposerPayload = {
      text: text.trim(),
      category,
      media,
      createdAt: computedCreatedAt(),
      location: attachLocation && locationPin
        ? { ...locationPin, label: locationLabel }
        : undefined,
    };
    
    // Save last location to profile if location was manually geocoded
    if (attachLocation && (manualCity || manualState || manualCountry)) {
      updateProfile({
        lastLocation: {
          city: manualCity || undefined,
          state: manualState || undefined,
          country: manualCountry || undefined,
          label: manualLabel || undefined,
        },
      });
    }
    
    onCreate(payload);
    setText('');
    setLocationPin(null);
    setManualLabel('');
    setManualCity('');
    setManualState('');
    setManualCountry('');
    setGeocodeError(null);
    setSelectedDate(formatDayKey(new Date()));
    setMediaError(null);
    setShowDatePicker(false);
    setAttachLocation(false);
  };

  const handleManualGeocode = async () => {
    setGeocoding(true);
    setGeocodeError(null);
    try {
      const result = await geocodeAddress(manualCity, manualState, manualCountry);
      const randomized = randomizeCoordinates(
        result.lat,
        result.lng,
        profile.randomizationRadius || 0
      );
      setLocationPin({
        lat: randomized.lat,
        lng: randomized.lng,
        label: manualLabel || result.displayName,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to geocode location';
      logError('Manual geocoding failed', error as Error, {
        'component': 'UpdateComposer',
        'location_input': `${manualCity}, ${manualState}, ${manualCountry}`
      });
      setGeocodeError(message);
    } finally {
      setGeocoding(false);
    }
  };

  const handleMediaClear = () => {
    setMedia({ type: 'none' });
    setMediaError(null);
  };
  
  const handleEmojiSelect = (emoji: string) => {
    updateProfile({ emoji });
    setShowEmojiPicker(false);
  };
  
  const handleCustomEmojiSubmit = () => {
    if (customEmoji.trim()) {
      updateProfile({ emoji: customEmoji.trim() });
      setCustomEmoji('');
      setShowEmojiPicker(false);
    }
  };

  const stopCaptureStream = () => {
    if (captureStream) {
      captureStream.getTracks().forEach((track) => track.stop());
      setCaptureStream(null);
    }
  };

  const resetCaptureSession = () => {
    stopCaptureStream();
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingVideo(false);
    setRecordingDuration(0);
    setMediaRecorder(null);
    recordedChunksRef.current = [];
  };

  const cleanupCaptureModal = () => {
    resetCaptureSession();
    captureCancelledRef.current = false;
    setCaptureError(null);
    setShowCaptureModal(false);
  };

  const startCaptureStream = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      logWarn('MediaDevices API not supported for camera capture', {
        'component': 'UpdateComposer',
        'user_agent': navigator.userAgent
      });
      setCaptureError('Camera access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: captureMode === 'video',
      });
      setCaptureStream(stream);
    } catch (error) {
      logError('Camera access denied', error as Error, {
        'component': 'UpdateComposer',
        'capture_mode': captureMode
      });
      console.error('Unable to access camera:', error);
      setCaptureError('Unable to access your camera. Please check permissions.');
    }
  };

  useEffect(() => {
    if (!showCaptureModal) return;

    startCaptureStream();

    return () => {
      resetCaptureSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCaptureModal, captureMode]);

  useEffect(() => {
    if (captureVideoRef.current && captureStream) {
      captureVideoRef.current.srcObject = captureStream;
    }
  }, [captureStream]);

  const finalizeCapture = (attachment: MediaAttachment) => {
    setMedia(attachment);
    setMediaError(null);
    setCaptureError(null);
    captureCancelledRef.current = false;
    cleanupCaptureModal();
  };

  const handleOpenCaptureModal = (mode: 'photo' | 'video') => {
    setCaptureMode(mode);
    setCaptureError(null);
    setShowCaptureModal(true);
  };

  const handleCloseCaptureModal = () => {
    if (isRecordingVideo && mediaRecorder) {
      captureCancelledRef.current = true;
      mediaRecorder.stop();
      return;
    }
    cleanupCaptureModal();
  };

  const handleCapturePhoto = () => {
    if (!captureVideoRef.current || !captureCanvasRef.current) return;

    const video = captureVideoRef.current;
    const canvas = captureCanvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');

    recordMediaCaptured('photo');
    
    finalizeCapture({
      type: 'image',
      dataUrl,
      name: 'Captured photo',
      size: 0,
    });
  };

  const handleRecordingTick = () => {
    setRecordingDuration((prev) => prev + 1);
  };

  const handleStartVideoRecording = () => {
    if (!captureStream) {
      setCaptureError('Start your camera first.');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      setCaptureError('Video recording is not supported in this browser.');
      return;
    }

    recordedChunksRef.current = [];
    let options: MediaRecorderOptions | undefined;
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      options = { mimeType: 'video/webm;codecs=vp9' };
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      options = { mimeType: 'video/webm' };
    }

    const recorder = new MediaRecorder(captureStream, options);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    recorder.onstop = async () => {
      if (captureCancelledRef.current) {
        captureCancelledRef.current = false;
        cleanupCaptureModal();
        return;
      }

      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const dataUrl = await toDataUrl(blob);
      
      recordMediaCaptured('video', recordingDuration * 1000);
      
      finalizeCapture({
        type: 'video',
        dataUrl,
        name: 'Captured video.webm',
        size: blob.size,
      });
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecordingVideo(true);
    setRecordingDuration(0);
    recordingTimerRef.current = window.setInterval(handleRecordingTick, 1000);
  };

  const handleStopVideoRecording = () => {
    if (!mediaRecorder) return;
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingVideo(false);
    mediaRecorder.stop();
  };

  return (
    <div className={styles['composer']}>
      <div className={styles['composer__header']}>
        <div className={styles['composer__greeting-row']}>
          <div>
            <p className={styles['composer__greeting']}>Hey {profile.displayName} 👋 Share what you're up to.</p>
            <p className={styles['composer__note']}>All media stays on your device for now.</p>
          </div>
          <div className={styles['composer__emoji-display']}>
            <button 
              type="button" 
              className="emoji-button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Change emoji"
            >
              {profile.emoji}
            </button>
          </div>
        </div>
        <div className={styles['composer__options-row']}>
          <div className={styles['composer__chips']}>
            {categoryOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`chip ${category === option.id ? 'chip--active' : ''}`}
                onClick={() => setCategory(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className={styles['composer__date-selector']}>
            <button
              type="button"
              className={`chip ${selectedDate === todayKey ? 'chip--active' : ''}`}
              onClick={() => {
                setSelectedDate(todayKey);
                setShowDatePicker(false);
              }}
            >
              Today
            </button>
            <button
              type="button"
              className={`chip ${selectedDate === yesterdayKey ? 'chip--active' : ''}`}
              onClick={() => {
                setSelectedDate(yesterdayKey);
                setShowDatePicker(false);
              }}
            >
              Yesterday
            </button>
            <button
              type="button"
              className={`chip ${selectedDate !== todayKey && selectedDate !== yesterdayKey ? 'chip--active' : ''}`}
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              {selectedDate !== todayKey && selectedDate !== yesterdayKey ? `Custom (${selectedDate})` : 'Custom'}
            </button>
          </div>
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
            {emojiOptions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`emoji-option ${profile.emoji === emoji ? 'emoji-option--active' : ''}`}
                onClick={() => handleEmojiSelect(emoji)}
              >
                {emoji}
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

      {showDatePicker && (
        <div className="picker-popup">
          <div className="picker-popup__header">
            <h3>Select custom date</h3>
            <button 
              type="button" 
              className="picker-popup__close"
              onClick={() => setShowDatePicker(false)}
            >
              ✕
            </button>
          </div>
          <div className="date-picker-content">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setShowDatePicker(false);
              }}
              className="date-picker-input"
            />
          </div>
        </div>
      )}

      <textarea
        className={styles['composer__input']}
        placeholder="What’s happening? "
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      <div>
        <div className={styles['composer__media-actions']}>
          {voice.status === 'recording' ? (
            <button type="button" className="button button--soft" onClick={voice.stopRecording}>
              Stop recording
            </button>
          ) : (
            <button type="button" className="button button--soft" onClick={voice.startRecording}>
              Record voice
            </button>
          )}
          {voice.recorded && (
            <button type="button" className="button button--soft" onClick={() => {
              voice.reset();
              setMedia({ type: 'none' });
            }}>
              Re-record voice
            </button>
          )}
          <button type="button" className="button button--soft" onClick={() => imageInputRef.current?.click()}>
            Add photo
          </button>
          <button type="button" className="button button--soft" onClick={() => videoInputRef.current?.click()}>
            Add video
          </button>
          <button type="button" className="button button--soft" onClick={() => handleOpenCaptureModal('photo')}>
            Use camera
          </button>
        </div>
        <div className={styles['composer__media-status']}>
          {voice.status === 'recording' && <span>Recording {voice.elapsed.toFixed(0)}s</span>}
          {voice.error && <span className="text text--error">{voice.error}</span>}
          {voice.recorded && (
            <span className="text text--muted">Voice clip ready · {voice.recorded.duration.toFixed(0)}s</span>
          )}
        </div>
      </div>

      {media.type !== 'none' && (
        <div className={styles['composer__media-preview']}>
          {media.type === 'audio' && media.dataUrl && (
            <audio controls src={media.dataUrl} />
          )}
          {(media.type === 'image' || media.type === 'video') && media.dataUrl && (
            media.type === 'image' ? (
              <img src={media.dataUrl} alt="Selected" />
            ) : (
              <video src={media.dataUrl} controls preload="metadata" />
            )
          )}
          <button type="button" className="button button--link" onClick={handleMediaClear}>
            Remove media
          </button>
        </div>
      )}

      {mediaError && <p className="text text--error">{mediaError}</p>}

      <div className={styles['composer__location']}>
        <label className={styles['composer__toggle']}>
          <input
            type="checkbox"
            checked={attachLocation}
            onChange={(event) => setAttachLocation(event.target.checked)}
          />
          Attach location
        </label>
        {attachLocation && (
          <div className={styles['composer__location-details']}>
            <p className={styles['composer__note']}>
              {geo.status === 'pending'
                ? 'Requesting location…'
                : geo.status === 'ready'
                  ? 'Location captured (randomized for privacy).'
                  : geo.status === 'error' && profile.defaultLocation
                    ? 'Using your default location (randomized for privacy).'
                    : geo.status === 'error' && !profile.defaultLocation
                      ? 'Unable to get location. Set a default location in your profile.'
                      : 'Allow location to pin this update.'}
            </p>
            <input
              type="text"
              value={manualLabel}
              onChange={(event) => setManualLabel(event.target.value)}
              placeholder="Label (e.g., Home, Office)"
              className={styles['composer__location-input']}
            />
            <div style={{ marginTop: '12px', borderTop: '1px solid #e0e0e0', paddingTop: '12px' }}>
              <p className={styles['composer__note']} style={{ marginBottom: '8px' }}>Or enter a location manually:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  placeholder="City"
                  className={styles['composer__location-input']}
                />
                <input
                  type="text"
                  value={manualState}
                  onChange={(e) => setManualState(e.target.value)}
                  placeholder="State"
                  className={styles['composer__location-input']}
                />
                <input
                  type="text"
                  value={manualCountry}
                  onChange={(e) => setManualCountry(e.target.value)}
                  placeholder="Country"
                  className={styles['composer__location-input']}
                />
              </div>
              <button
                type="button"
                className="button button--soft"
                onClick={handleManualGeocode}
                disabled={geocoding || (!manualCity && !manualState && !manualCountry)}
                style={{ width: '100%' }}
              >
                {geocoding ? 'Geocoding…' : 'Geocode Location'}
              </button>
              {geocodeError && (
                <p className="text text--error" style={{ marginTop: '8px', fontSize: '0.875rem' }}>
                  {geocodeError}
                </p>
              )}
              {locationPin && !geocodeError && (
                <p className="text" style={{ marginTop: '8px', fontSize: '0.875rem', color: '#2a9d8f' }}>
                  ✓ Location set: {locationPin.lat.toFixed(4)}, {locationPin.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles['composer__actions']}>
        <button type="button" className="button button--primary" onClick={handleSubmit} disabled={!isValid}>
          Post update
        </button>
        <span className="text text--muted">{text.length}/420 characters</span>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => handleFileSelection(event, 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={(event) => handleFileSelection(event, 'video')}
      />
      {showCaptureModal && (
        <div className="modal-overlay" onClick={handleCloseCaptureModal}>
          <div className="modal-content capture-modal" onClick={(event) => event.stopPropagation()}>
            <div className="capture-modal__header">
              <h3>Capture {captureMode === 'photo' ? 'photo' : 'video'}</h3>
              <div className="capture-modal__mode">
                <button
                  type="button"
                  className={`capture-modal__mode-button ${captureMode === 'photo' ? 'capture-modal__mode-button--active' : ''}`}
                  onClick={() => setCaptureMode('photo')}
                >
                  Photo
                </button>
                <button
                  type="button"
                  className={`capture-modal__mode-button ${captureMode === 'video' ? 'capture-modal__mode-button--active' : ''}`}
                  onClick={() => setCaptureMode('video')}
                >
                  Video
                </button>
              </div>
            </div>
            <div className="capture-modal__preview">
              <video
                ref={captureVideoRef}
                autoPlay
                playsInline
                muted
              />
            </div>
            {captureError && <p className="text text--error" style={{ marginTop: '12px' }}>{captureError}</p>}
            <div className="capture-modal__actions">
              {captureMode === 'photo' && (
                <button type="button" className="button button--primary" onClick={handleCapturePhoto}>
                  Take photo
                </button>
              )}
              {captureMode === 'video' && (
                <>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={isRecordingVideo ? handleStopVideoRecording : handleStartVideoRecording}
                  >
                    {isRecordingVideo ? 'Stop recording' : 'Start recording'}
                  </button>
                  {recordingDuration > 0 && (
                    <span className="text text--muted" style={{ alignSelf: 'center' }}>
                      Recording: {recordingDuration.toFixed(0)}s
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="capture-modal__footer">
              <button type="button" className="button button--soft" onClick={handleCloseCaptureModal}>
                Cancel
              </button>
            </div>
            <canvas ref={captureCanvasRef} style={{ display: 'none' }} />
          </div>
        </div>
      )}
    </div>
  );
}
