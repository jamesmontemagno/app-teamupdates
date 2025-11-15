import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useUpdates } from '../contexts/UpdatesContext';
import { FilterControls } from '../components/FilterControls';
import { TeamHeader } from '../components/TeamHeader';
import { TimelineView } from '../components/TimelineView';
import { MapView } from '../components/MapView';
import { UpdateComposerModal } from '../components/UpdateComposerModal';
import type { ComposerPayload } from '../components/UpdateComposer';
import { filterUpdates } from '../utils/filters';
import type { FilterState } from '../types';
import layoutStyles from './PageLayout.module.css';

const defaultFilters: FilterState = {
  dayKey: 'all',
  category: 'all',
  media: 'all',
  locationOnly: false,
};

type ViewMode = 'timeline' | 'map';

export function TeamPage() {
  const { profile } = useUserProfile();
  const { updates, addUpdate } = useUpdates();
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showComposer, setShowComposer] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const highlight = searchParams.get('highlight');
  const [highlightId, setHighlightId] = useState<string | null>(highlight);

  const filtered = useMemo(() => {
    const currentFilters = viewMode === 'map' ? { ...filters, locationOnly: true } : filters;
    return filterUpdates(updates, currentFilters);
  }, [updates, filters, viewMode]);
  const locationUpdates = filtered.filter((update) => update.location);

  useEffect(() => {
    if (highlight) {
      const timer = setTimeout(() => setHighlightId(null), 3500);
      setSearchParams({}, { replace: true });
      return () => clearTimeout(timer);
    }
  }, [highlight, setSearchParams]);

  const handleCreate = (payload: ComposerPayload) => {
    addUpdate({
      ...payload,
      userId: profile.id,
      userDisplayName: profile.displayName,
      userEmoji: profile.emoji,
      userPhotoUrl: profile.photoUrl,
    });
    setShowComposer(false);
  };

  const handleViewInTimeline = (updateId: string) => {
    setViewMode('timeline');
    setHighlightId(updateId);
  };

  return (
    <div className={layoutStyles['page']}>
      {/* Header with Add Update button and View toggle */}
      <section className={layoutStyles['page__panel']}>
        <TeamHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAddUpdate={() => setShowComposer(true)}
          updateCount={viewMode === 'timeline' ? filtered.length : locationUpdates.length}
          totalCount={updates.length}
        />
        <FilterControls 
          updates={updates} 
          filters={filters} 
          onChange={setFilters} 
          showLocationToggle={viewMode === 'timeline'}
        />
      </section>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <section className={layoutStyles['page__panel']}>
          <TimelineView
            updates={filtered}
            highlightId={highlightId}
            onViewOnMap={() => setViewMode('map')}
          />
        </section>
      )}

      {/* Map View */}
      {viewMode === 'map' && (
        <MapView
          updates={filtered}
          onViewInTimeline={handleViewInTimeline}
        />
      )}

      {/* Add Update Modal */}
      {showComposer && (
        <UpdateComposerModal
          profile={profile}
          onClose={() => setShowComposer(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
