// Skeleton loader for timeline and map loading states

import styles from './SkeletonLoader.module.css';

interface SkeletonLoaderProps {
  type?: 'timeline' | 'map' | 'card';
  count?: number;
}

export function SkeletonLoader({ type = 'timeline', count = 3 }: SkeletonLoaderProps) {
  if (type === 'timeline') {
    return (
      <div className={styles['skeleton-container']}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles['skeleton-update-card']}>
            <div className={styles['skeleton-header']}>
              <div className={styles['skeleton-avatar']} />
              <div className={styles['skeleton-meta']}>
                <div className={styles['skeleton-line']} style={{ width: '120px' }} />
                <div className={styles['skeleton-line']} style={{ width: '80px' }} />
              </div>
            </div>
            <div className={styles['skeleton-content']}>
              <div className={styles['skeleton-line']} />
              <div className={styles['skeleton-line']} style={{ width: '90%' }} />
              <div className={styles['skeleton-line']} style={{ width: '75%' }} />
            </div>
            <div className={styles['skeleton-footer']}>
              <div className={styles['skeleton-chip']} />
              <div className={styles['skeleton-chip']} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={styles['skeleton-card']}>
        <div className={styles['skeleton-line']} style={{ width: '60%', height: '24px' }} />
        <div className={styles['skeleton-line']} style={{ width: '40%' }} />
        <div className={styles['skeleton-line']} style={{ width: '50%' }} />
      </div>
    );
  }

  // Map type
  return (
    <div className={styles['skeleton-map']}>
      <div className={styles['skeleton-pulse']}>Loading map...</div>
    </div>
  );
}
