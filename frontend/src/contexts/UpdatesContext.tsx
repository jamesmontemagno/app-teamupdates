import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { formatDayKey, nowAsISOString, sortUpdatesChronologically } from '../utils/date';
import type { LocationPin, MediaAttachment } from '../types';
import type { TeamUpdate } from '../api/types';
import * as api from '../api';
import { getSignalRConnection } from '../api/signalr';
import { showError } from '../utils/toast';
import { useTeam } from './TeamContext';
import { withSpan, recordUpdateCreated, recordUpdateCreationLatency } from '../telemetry';

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
      await withSpan('updates.fetch', { 'team.id': teamId }, async () => {
        const fetchedUpdates = await api.getTeamUpdates(teamId);
        setUpdates(sortUpdatesChronologically(fetchedUpdates));
      });
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
          // Check if update already exists (primary deduplication)
          const exists = current.some(u => u.id === teamUpdate.id);
          if (exists) {
            return current;
          }
          
          // Add update from SignalR (from other users)
          return sortUpdatesChronologically([teamUpdate, ...current]);
        });
      }
    });

    // Join team room
    signalR.connect().then(() => {
      signalR.joinTeam(teamId);
    });

    return () => {
      // Cleanup: unsubscribe BEFORE leaving team
      unsubscribe();
      signalR.leaveTeam(teamId);
    };
  }, [teamId]);


  const addUpdate = async (payload: UpdatePayload) => {
    if (!teamId) {
      showError('No team selected');
      return;
    }

    const startTime = performance.now();

    try {
      const createdUpdate = await withSpan(
        'update.create',
        {
          'team.id': teamId,
          'user.id': payload.userId,
          'update.category': payload.category,
          'update.has_media': !!payload.media,
          'update.has_location': !!payload.location,
        },
        async () => {
          return await api.createUpdate(teamId, {
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
        }
      );
      
      // Record metrics
      const latencyMs = performance.now() - startTime;
      recordUpdateCreated(payload.category, !!payload.media);
      recordUpdateCreationLatency(latencyMs, payload.category);
      
      // Add the update directly from API response
      // SignalR might have already added it if it arrived faster
      setUpdates((current) => {
        const exists = current.some(u => u.id === createdUpdate.id);
        if (exists) {
          return current;
        }
        return sortUpdatesChronologically([createdUpdate, ...current]);
      });
    } catch (err) {
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
