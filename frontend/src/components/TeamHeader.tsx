import styles from './TeamHeader.module.css';

interface TeamHeaderProps {
  viewMode: 'timeline' | 'map';
  onViewModeChange: (mode: 'timeline' | 'map') => void;
  onAddUpdate: () => void;
  updateCount: number;
  totalCount: number;
}

export function TeamHeader({ viewMode, onViewModeChange, onAddUpdate, updateCount, totalCount }: TeamHeaderProps) {
  return (
    <div>
      <div className={styles['header']}>
        <h1 className={styles['title']}>Team Updates</h1>
        <div className={styles['header-actions']}>
          <div className={styles['segmented-control']}>
            <button
              className={`${styles['segmented-control__button']} ${viewMode === 'timeline' ? styles['segmented-control__button--active'] : ''}`}
              onClick={() => onViewModeChange('timeline')}
            >
              📋 Timeline
            </button>
            <button
              className={`${styles['segmented-control__button']} ${viewMode === 'map' ? styles['segmented-control__button--active'] : ''}`}
              onClick={() => onViewModeChange('map')}
            >
              🗺️ Map
            </button>
          </div>
          <button
            className="button button--primary"
            onClick={onAddUpdate}
          >
            ➕ Add Update
          </button>
        </div>
      </div>
      <p className="text text--muted">
        {viewMode === 'timeline' 
          ? `${updateCount} updates, ${totalCount} total`
          : `${updateCount} geotagged updates`
        }
      </p>
    </div>
  );
}
