import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useUpdates } from '../contexts/UpdatesContext';
import { FilterControls } from '../components/FilterControls';
import { UpdateComposer } from '../components/UpdateComposer';
import type { ComposerPayload } from '../components/UpdateComposer';
import { UpdateCard } from '../components/UpdateCard';
import { filterUpdates } from '../utils/filters';
import { friendlyDayLabel, groupUpdatesByDay } from '../utils/date';
import type { FilterState } from '../types';

const defaultFilters: FilterState = {
  dayKey: 'all',
  category: 'all',
  media: 'all',
  locationOnly: false,
};

export function TimelinePage() {
  const { profile } = useUserProfile();
  const { updates, addUpdate } = useUpdates();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => filterUpdates(updates, filters), [updates, filters]);
  const grouped = useMemo(() => groupUpdatesByDay(filtered), [filtered]);

  useEffect(() => {
    const highlight = searchParams.get('highlight');
    if (highlight) {
      setHighlightId(highlight);
      setTimeout(() => setHighlightId(null), 3500);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCreate = (payload: Parameters<typeof addUpdate>[0]) => {
    addUpdate({
      ...payload,
      userId: profile.id,
      userDisplayName: profile.displayName,
    });
  };

  return (
    <div className="page">
      <section className="page__panel">
        <UpdateComposer onCreate={handleCreate} profile={profile} />
      </section>

      <section className="page__panel">
        <div className="page__header">
          <h1 className="page__title">Timeline</h1>
          <p className="text text--muted">{filtered.length} updates, {updates.length} total</p>
        </div>
        <FilterControls updates={updates} filters={filters} onChange={setFilters} />
      </section>

      <section className="page__panel">
        {Object.entries(grouped).length === 0 && (
          <p className="text text--muted">No updates yet. Drop the first one!</p>
        )}
        {Object.entries(grouped)
          .sort((a, b) => (a[0] < b[0] ? 1 : -1))
          .map(([dayKey, entries]) => (
            <div key={dayKey} className="updates-group">
              <h2 className="updates-group__heading">{friendlyDayLabel(dayKey)}</h2>
              <div className="updates-list">
                {entries.map((update) => (
                  <UpdateCard
                    key={update.id}
                    update={update}
                    isHighlighted={highlightId === update.id}
                    onViewOnMap={() => navigate('/map', { state: { focusId: update.id } })}
                  />
                ))}
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
