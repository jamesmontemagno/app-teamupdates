import { useMemo } from 'react';
import { friendlyDayLabel } from '../utils/date';
import type { CategoryFilter, FilterState, MediaFilter, TeamUpdate } from '../types';

const categoryOptions: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'team', label: 'Team' },
  { id: 'life', label: 'Life' },
  { id: 'win', label: 'Win' },
  { id: 'blocker', label: 'Blocker' },
];

const mediaOptions: { id: MediaFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'text', label: 'Text' },
  { id: 'audio', label: 'Audio' },
  { id: 'image', label: 'Photos' },
  { id: 'video', label: 'Video' },
];

interface FilterControlsProps {
  updates: TeamUpdate[];
  filters: FilterState;
  onChange: (next: FilterState) => void;
  showLocationToggle?: boolean;
}

export function FilterControls({ updates, filters, onChange, showLocationToggle = true }: FilterControlsProps) {
  const dayOptions = useMemo(() => {
    const keys = Array.from(new Set(updates.map((update) => update.dayKey))).sort((a, b) => (a < b ? 1 : -1));
    return keys;
  }, [updates]);

  return (
    <div className="filters">
      <div className="filters__row">
        <div className="filters__group">
          {['all', ...dayOptions].map((dayKey) => (
            <button
              type="button"
              key={dayKey}
              className={`chip ${filters.dayKey === dayKey ? 'chip--active' : ''}`}
              onClick={() => onChange({ ...filters, dayKey })}
            >
              {dayKey === 'all' ? 'All days' : friendlyDayLabel(dayKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="filters__row">
        <div className="filters__group">
          {categoryOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`chip ${filters.category === option.id ? 'chip--active' : ''}`}
              onClick={() => onChange({ ...filters, category: option.id })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filters__row">
        <div className="filters__group">
          {mediaOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`chip ${filters.media === option.id ? 'chip--active' : ''}`}
              onClick={() => onChange({ ...filters, media: option.id })}
            >
              {option.label}
            </button>
          ))}
        </div>
        {showLocationToggle && (
          <label className="toggle">
            <input
              type="checkbox"
              checked={filters.locationOnly}
              onChange={(event) => onChange({ ...filters, locationOnly: event.target.checked })}
            />
            Show geotagged only
          </label>
        )}
      </div>
    </div>
  );
}
