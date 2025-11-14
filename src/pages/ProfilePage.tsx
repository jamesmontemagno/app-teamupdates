import { useState } from 'react';
import { useUserProfile } from '../contexts/UserProfileContext';

const colorOptions = ['#5f7a90', '#c05655', '#2a9d8f', '#7c3aed', '#f97316'];

export function ProfilePage() {
  const { profile, updateProfile } = useUserProfile();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [emoji, setEmoji] = useState(profile.emoji);
  const [color, setColor] = useState(profile.color);

  const handleSave = () => {
    if (!displayName.trim()) return;
    updateProfile({ displayName: displayName.trim(), emoji: emoji.trim() || '🌟', color });
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

        <label className="label">
          Emoji
          <input type="text" value={emoji} onChange={(event) => setEmoji(event.target.value)} maxLength={2} />
        </label>

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

        <button type="button" className="button button--primary" onClick={handleSave}>
          Save profile
        </button>
      </div>
    </div>
  );
}
