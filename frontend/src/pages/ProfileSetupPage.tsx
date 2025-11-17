// Profile setup page

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { showError, showSuccess } from '../utils/toast';
import { logInfo, logError, logWarn } from '../telemetry';
import styles from './ProfileSetupPage.module.css';

const USER_ID_KEY = 'teamUpdatesUserId';

const EMOJI_OPTIONS = ['🌟', '🚀', '💡', '🎨', '⚡', '🎯', '🔥', '💪', '🌈', '✨', '🎭', '🎪'];
const COLOR_OPTIONS = [
  '#5f7a90', '#e63946', '#457b9d', '#2a9d8f', '#f77f00',
  '#e9c46a', '#264653', '#8d5b4c', '#6d6875', '#9d4edd',
];

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [emoji, setEmoji] = useState('🌟');
  const [color, setColor] = useState('#5f7a90');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [randomizationRadius, setRandomizationRadius] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 1MB for profile photo)
    if (file.size > 1024 * 1024) {
      showError('Photo must be less than 1MB');
      logWarn('Profile photo exceeds size limit', {
        'photo.size': file.size,
        'photo.limit': 1024 * 1024,
        'component': 'ProfileSetupPage'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPhotoPreview(dataUrl);
      logInfo('Profile photo uploaded', {
        'photo.size': file.size,
        'component': 'ProfileSetupPage'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      showError('Please enter your display name');
      return;
    }

    setSubmitting(true);
    const startTime = performance.now();

    logInfo('Creating new profile', {
      'profile.has_photo': !!photoPreview,
      'profile.emoji': emoji,
      'profile.randomization_radius': randomizationRadius,
      'component': 'ProfileSetupPage'
    });

    try {
      const profile = await api.createProfile({
        displayName: displayName.trim(),
        emoji,
        color,
        photoUrl: photoPreview || undefined,
        randomizationRadius,
      });

      // Store userId in localStorage
      localStorage.setItem(USER_ID_KEY, profile.id);

      const latency = performance.now() - startTime;
      logInfo('Profile created successfully', {
        'profile.id': profile.id,
        'profile.display_name': displayName.trim(),
        'profile.has_photo': !!photoPreview,
        'latency.ms': latency,
        'component': 'ProfileSetupPage'
      });

      showSuccess('Profile created! 🎉');
      navigate('/teams');
    } catch (err) {
      const latency = performance.now() - startTime;
      logError('Failed to create profile', err as Error, {
        'latency.ms': latency,
        'component': 'ProfileSetupPage'
      });
      showError(err, 'Failed to create profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Your Profile</h1>
        <p className={styles.subtitle}>
          Set up your profile to start sharing updates with your team
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Display Name */}
          <div className={styles.field}>
            <label htmlFor="displayName" className={styles.label}>
              Display Name <span className={styles.required}>*</span>
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className={styles.input}
              required
              maxLength={50}
            />
          </div>

          {/* Emoji Picker */}
          <div className={styles.field}>
            <label className={styles.label}>Choose Your Emoji</label>
            <div className={styles['emoji-grid']}>
              {EMOJI_OPTIONS.map((emojiOption) => (
                <button
                  key={emojiOption}
                  type="button"
                  onClick={() => setEmoji(emojiOption)}
                  className={`${styles['emoji-button']} ${
                    emoji === emojiOption ? styles['emoji-button--selected'] : ''
                  }`}
                >
                  {emojiOption}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className={styles.field}>
            <label className={styles.label}>Choose Your Color</label>
            <div className={styles['color-grid']}>
              {COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`${styles['color-button']} ${
                    color === colorOption ? styles['color-button--selected'] : ''
                  }`}
                  style={{ backgroundColor: colorOption }}
                  aria-label={`Select color ${colorOption}`}
                />
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div className={styles.field}>
            <label htmlFor="photo" className={styles.label}>
              Profile Photo (Optional)
            </label>
            {photoPreview && (
              <div className={styles['photo-preview']}>
                <img src={photoPreview} alt="Profile preview" />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className={styles['remove-photo']}
                >
                  Remove
                </button>
              </div>
            )}
            {!photoPreview && (
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className={styles['file-input']}
              />
            )}
          </div>

          {/* Randomization Radius */}
          <div className={styles.field}>
            <label htmlFor="radius" className={styles.label}>
              Location Privacy: {randomizationRadius}m randomization
            </label>
            <input
              id="radius"
              type="range"
              min="50"
              max="500"
              step="10"
              value={randomizationRadius}
              onChange={(e) => setRandomizationRadius(Number(e.target.value))}
              className={styles.slider}
            />
            <p className={styles.hint}>
              Your exact location will be randomized within this radius for privacy
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !displayName.trim()}
            className={styles['submit-button']}
          >
            {submitting ? 'Creating Profile...' : 'Create Profile & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
