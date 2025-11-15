import { useMemo } from 'react';
import { UpdateCard } from './UpdateCard';
import { groupUpdatesByDay } from '../utils/date';
import { friendlyDayLabel } from '../utils/date';
import type { TeamUpdate } from '../api/types';
import layoutStyles from '../pages/PageLayout.module.css';

interface TimelineViewProps {
  updates: TeamUpdate[];
  highlightId: string | null;
  onViewOnMap: () => void;
}

export function TimelineView({ updates, highlightId, onViewOnMap }: TimelineViewProps) {
  const grouped = useMemo(() => groupUpdatesByDay(updates), [updates]);

  if (Object.entries(grouped).length === 0) {
    return <p className="text text--muted">No updates yet. Drop the first one!</p>;
  }

  return (
    <>
      {Object.entries(grouped)
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([dayKey, entries]) => (
          <div key={dayKey} className={layoutStyles['updates-group']}>
            <h2 className={layoutStyles['updates-group__heading']}>{friendlyDayLabel(dayKey)}</h2>
            <div className={layoutStyles['updates-list']}>
              {entries.map((update) => (
                <UpdateCard
                  key={update.id}
                  update={update}
                  isHighlighted={highlightId === update.id}
                  onViewOnMap={onViewOnMap}
                />
              ))}
            </div>
          </div>
        ))}
    </>
  );
}
