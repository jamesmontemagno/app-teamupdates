import { TeamUpdate, FilterState } from '../types';

export function filterUpdates(updates: TeamUpdate[], filters: FilterState) {
  return updates.filter((update) => {
    if (filters.dayKey !== 'all' && update.dayKey !== filters.dayKey) {
      return false;
    }

    if (filters.category !== 'all' && update.category !== filters.category) {
      return false;
    }

    if (filters.locationOnly && !update.location) {
      return false;
    }

    if (filters.media !== 'all') {
      if (filters.media === 'text' && update.media.type !== 'none') {
        return false;
      }

      if (filters.media !== 'text' && update.media.type !== filters.media) {
        return false;
      }
    }

    return true;
  });
}
