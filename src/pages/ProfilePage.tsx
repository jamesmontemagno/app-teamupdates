import { useState } from 'react';
import { useUserProfile } from '../contexts/UserProfileContext';

const colorOptions = ['#5f7a90', '#c05655', '#2a9d8f', '#7c3aed', '#f97316'];
const emojiOptions = ['🌟', '🚀', '💡', '🎯', '🔥', '⚡', '💪', '🎨', '🌈', '✨', '🎉', '💻', '📱', '🎮', '🏃', '🌺'];

export function ProfilePage() {
  const { profile, updateProfile } = useUserProfile();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [emoji, setEmoji] = useState(profile.emoji);
  const [color, setColor] = useState(profile.color);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');

  const handleSave = () => {
    if (!displayName.trim()) return;
    updateProfile({ displayName: displayName.trim(), emoji: emoji.trim() || '🌟', color });
  };

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

        <button type="button" className="button button--primary" onClick={handleSave}>
          Save profile
        </button>
      </div>
    </div>
  );
}
