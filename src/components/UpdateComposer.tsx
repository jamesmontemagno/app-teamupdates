import { useEffect, useMemo, useRef, useState } from 'react';
import { subDays } from 'date-fns';
import type { Category, LocationPin, MediaAttachment, MediaType, UserProfile } from '../types';
import { formatDayKey } from '../utils/date';
import { useGeolocation } from '../hooks/useGeolocation';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

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

const QUICK_DATE_LABELS = [
  { label: 'Today', date: formatDayKey(new Date()) },
  { label: 'Yesterday', date: formatDayKey(subDays(new Date(), 1)) },
  { label: 'This Week', date: formatDayKey(new Date()) },
];

const categoryOptions: { id: Category; label: string }[] = [
  { id: 'team', label: 'Team' },
  { id: 'life', label: 'Life' },
  { id: 'win', label: 'Win' },
  { id: 'blocker', label: 'Blocker' },
];

const toDataUrl = (file: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

export function UpdateComposer({ onCreate, profile }: UpdateComposerProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Category>('team');
  const [selectedDate, setSelectedDate] = useState(formatDayKey(new Date()));
  const [media, setMedia] = useState<MediaAttachment>({ type: 'none' });
  const [attachLocation, setAttachLocation] = useState(false);
  const [manualLabel, setManualLabel] = useState('');
  const [locationPin, setLocationPin] = useState<LocationPin | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const geo = useGeolocation();
  const voice = useVoiceRecorder(60);

  useEffect(() => {
    if (attachLocation && geo.status === 'idle') {
      geo.requestLocation();
    }
  }, [attachLocation, geo]);

  useEffect(() => {
    if (geo.position) {
      setLocationPin({ ...geo.position, label: geo.position.label });
    }
  }, [geo.position]);

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

  const quickDates = useMemo(() => QUICK_DATE_LABELS.map((item) => ({ ...item })), []);

  const locationLabel = manualLabel.trim() || locationPin?.label;

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>, type: MediaType) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MEDIA_BYTES) {
      setMediaError('Media is too large. Please pick a file smaller than 6MB.');
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
    onCreate(payload);
    setText('');
    setMedia({ type: 'none' });
    voice.reset();
    setAttachLocation(false);
    setLocationPin(null);
    setManualLabel('');
    setSelectedDate(formatDayKey(new Date()));
    setMediaError(null);
  };

  const handleMediaClear = () => {
    setMedia({ type: 'none' });
    setMediaError(null);
  };

  return (
    <div className="composer">
      <div className="composer__header">
        <div>
          <p className="composer__greeting">Hey {profile.displayName} 👋 Share what you’re up to.</p>
          <p className="composer__note">All media stays on your device for now.</p>
        </div>
        <div className="composer__chips">
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
      </div>

      <textarea
        className="composer__input"
        placeholder="What’s happening? "
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      <div className="composer__media">
        <div className="composer__media-actions">
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
        </div>
        <div className="composer__media-status">
          {voice.status === 'recording' && <span>Recording {voice.elapsed.toFixed(0)}s</span>}
          {voice.error && <span className="text text--error">{voice.error}</span>}
          {voice.recorded && (
            <span className="text text--muted">Voice clip ready · {voice.recorded.duration.toFixed(0)}s</span>
          )}
        </div>
      </div>

      {media.type !== 'none' && (
        <div className="composer__media-preview">
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

      <div className="composer__date">
        <div className="composer__date-chips">
          {quickDates.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`chip ${selectedDate === item.date ? 'chip--active' : ''}`}
              onClick={() => setSelectedDate(item.date)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="composer__date-picker">
          Custom date
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
      </div>

      <div className="composer__location">
        <label className="composer__toggle">
          <input
            type="checkbox"
            checked={attachLocation}
            onChange={(event) => setAttachLocation(event.target.checked)}
          />
          Attach location
        </label>
        {attachLocation && (
          <div className="composer__location-details">
            <p className="composer__note">
              {geo.status === 'pending'
                ? 'Requesting location…'
                : geo.status === 'ready'
                  ? 'Location captured.'
                  : geo.error || 'Allow location to pin this update.'}
            </p>
            <input
              type="text"
              value={manualLabel}
              onChange={(event) => setManualLabel(event.target.value)}
              placeholder="Label (e.g., Home, Office)"
              className="composer__location-input"
            />
          </div>
        )}
      </div>

      <div className="composer__actions">
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
    </div>
  );
}
