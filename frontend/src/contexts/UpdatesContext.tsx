import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { formatDayKey, nowAsISOString, sortUpdatesChronologically } from '../utils/date';
import type { LocationPin, MediaAttachment } from '../types';
import type { TeamUpdate } from '../api/types';
import * as api from '../api';
import { getSignalRConnection } from '../api/signalr';
import { showError } from '../utils/toast';
import { useTeam } from './TeamContext';

export interface UpdatePayload {
  text: string;
  category: TeamUpdate['category'];
  media: MediaAttachment;
  location?: LocationPin;
  createdAt?: string;
  userId: string;
  userDisplayName: string;
  userEmoji: string;
  userPhotoUrl?: string;
}

interface UpdatesContextShape {
  updates: TeamUpdate[];
  loading: boolean;
  error: string | null;
  addUpdate: (payload: UpdatePayload) => Promise<void>;
  refetch: () => void;
}

const UpdatesContext = createContext<UpdatesContextShape>({
  updates: [],
  loading: false,
  error: null,
  addUpdate: async () => {},
  refetch: () => {},
});

export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const { teamId } = useTeam();
  const [updates, setUpdates] = useState<TeamUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdates = useCallback(async () => {
    if (!teamId) {
      setUpdates([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedUpdates = await api.getTeamUpdates(teamId);
      setUpdates(sortUpdatesChronologically(fetchedUpdates));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load updates';
      setError(message);
      showError(err, 'Failed to load updates');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  // Subscribe to SignalR for real-time updates
  useEffect(() => {
    if (!teamId) return;

    const signalR = getSignalRConnection();
    
    const unsubscribe = signalR.onUpdateCreated((update: unknown) => {
      const teamUpdate = update as TeamUpdate;
      // Only add updates for the current team
      if (teamUpdate.teamId === teamId) {
        setUpdates((current) => {
          // Check if update already exists
          const exists = current.some(u => u.id === teamUpdate.id);
          if (exists) return current;
          return sortUpdatesChronologically([teamUpdate, ...current]);
        });
      }
    });

    // Join team room
    signalR.connect().then(() => {
      signalR.joinTeam(teamId);
    });

    return () => {
      unsubscribe();
      signalR.leaveTeam(teamId);
    };
  }, [teamId]);

  const addUpdate = async (payload: UpdatePayload) => {
    if (!teamId) {
      showError('No team selected');
      return;
    }

    // Optimistic update
    const optimisticUpdate: TeamUpdate = {
      id: crypto.randomUUID?.() || `temp-${Date.now()}`,
      teamId,
      text: payload.text,
      category: payload.category,
      createdAt: payload.createdAt || nowAsISOString(),
      dayKey: formatDayKey(payload.createdAt || nowAsISOString()),
      media: payload.media,
      location: payload.location,
      userId: payload.userId,
      userDisplayName: payload.userDisplayName,
      userEmoji: payload.userEmoji,
      userPhotoUrl: payload.userPhotoUrl,
    };

    setUpdates((current) => sortUpdatesChronologically([optimisticUpdate, ...current]));

    try {
      const createdUpdate = await api.createUpdate(teamId, {
        userId: payload.userId,
        dayKey: formatDayKey(payload.createdAt || nowAsISOString()),
        text: payload.text,
        category: payload.category,
        media: payload.media ? {
          type: payload.media.type,
          dataUrl: payload.media.dataUrl,
          name: payload.media.name,
          duration: payload.media.duration,
          size: payload.media.size,
        } : undefined,
        location: payload.location,
      });

      // Replace optimistic update with real one
      setUpdates((current) =>
        sortUpdatesChronologically(
          current.map((u) => (u.id === optimisticUpdate.id ? createdUpdate : u))
        )
      );
    } catch (err) {
      // Rollback on error
      setUpdates((current) => current.filter((u) => u.id !== optimisticUpdate.id));
      showError(err, 'Failed to post update');
      throw err;
    }
  };

  const value = useMemo(
    () => ({ updates, loading, error, addUpdate, refetch: fetchUpdates }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updates, loading, error, fetchUpdates]
  );

  return <UpdatesContext.Provider value={value}>{children}</UpdatesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUpdates() {
  return useContext(UpdatesContext);
}
