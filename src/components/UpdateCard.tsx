import { formatTimeLabel } from '../utils/date';
import type { TeamUpdate } from '../types';
import styles from './UpdateCard.module.css';

interface UpdateCardProps {
  update: TeamUpdate;
  isHighlighted?: boolean;
  onViewOnMap?: () => void;
}

export function UpdateCard({ update, isHighlighted, onViewOnMap }: UpdateCardProps) {
  const cardClassName = `${styles['update-card']} ${isHighlighted ? styles['update-card--highlight'] : ''}`.trim();

  return (
    <article className={cardClassName}>
      <header className={styles['update-card__header']}>
        {update.userPhotoUrl ? (
          <div className={styles['update-card__avatar']} style={{ position: 'relative', fontSize: '1.5rem', padding: 0 }}>
            <img 
              src={update.userPhotoUrl} 
              alt={update.userDisplayName}
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                display: 'block'
              }} 
            />
            <div style={{ 
              position: 'absolute', 
              bottom: '-2px', 
              right: '-2px', 
              fontSize: '1.25rem',
              backgroundColor: 'white',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}>
              {update.userEmoji}
            </div>
          </div>
        ) : (
          <div className={styles['update-card__avatar']} style={{ fontSize: '1.5rem' }}>{update.userEmoji || update.userDisplayName.slice(0, 2)}</div>
        )}
        <div>
          <div className={styles['update-card__meta']}>
            <span className={styles['update-card__name']}>{update.userDisplayName}</span>
            <span className="chip chip--mini">{update.category}</span>
          </div>
          <p className={styles['update-card__time']}>{formatTimeLabel(update.createdAt)}</p>
        </div>
      </header>

      <p className={styles['update-card__text']}>{update.text}</p>

      {update.media.type === 'audio' && update.media.dataUrl && (
        <audio controls className={styles['update-card__audio']} src={update.media.dataUrl} />
      )}

      {update.media.type === 'image' && update.media.dataUrl && (
        <img className={styles['update-card__image']} src={update.media.dataUrl} alt="Update media" />
      )}

      {update.media.type === 'video' && update.media.dataUrl && (
        <video className={styles['update-card__video']} src={update.media.dataUrl} controls preload="metadata" />
      )}

      <footer className={styles['update-card__footer']}>
        {update.location && (
          <span className="chip chip--mini">📍 {update.location.label || `${update.location.lat.toFixed(2)}, ${update.location.lng.toFixed(2)}`}</span>
        )}
        {update.location && onViewOnMap && (
          <button className="button button--link" type="button" onClick={onViewOnMap}>
            View on map
          </button>
        )}
      </footer>
    </article>
  );
}
