import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { formatDayKey, nowAsISOString, sortUpdatesChronologically } from '../utils/date';
import type { LocationPin, MediaAttachment, TeamUpdate } from '../types';

const STORAGE_KEY = 'teamUpdates_v1_records';

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
  addUpdate: (payload: UpdatePayload) => void;
}

const UpdatesContext = createContext<UpdatesContextShape>({
  updates: [],
  addUpdate: () => {},
});

function loadFromStorage(): TeamUpdate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as TeamUpdate[];
    }
  } catch (error) {
    console.error('Unable to load stored updates', error);
  }
  return [];
}

function persist(updates: TeamUpdate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updates));
  } catch (error) {
    console.error('Unable to persist updates', error);
  }
}

export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const [updates, setUpdates] = useState<TeamUpdate[]>(() => loadFromStorage());

  const addUpdate = (payload: UpdatePayload) => {
    const createdAt = payload.createdAt || nowAsISOString();
    const dayKey = formatDayKey(createdAt);
    const newUpdate: TeamUpdate = {
      id: crypto.randomUUID?.() || `${Date.now()}`,
      text: payload.text,
      category: payload.category,
      createdAt,
      dayKey,
      media: payload.media,
      location: payload.location,
      userId: payload.userId,
      userDisplayName: payload.userDisplayName,
      userEmoji: payload.userEmoji,
      userPhotoUrl: payload.userPhotoUrl,
    };

    setUpdates((current) => sortUpdatesChronologically([newUpdate, ...current]));
  };

  useEffect(() => {
    persist(updates);
  }, [updates]);

  const value = useMemo(() => ({ updates, addUpdate }), [updates]);

  return <UpdatesContext.Provider value={value}>{children}</UpdatesContext.Provider>;
}

export function useUpdates() {
  return useContext(UpdatesContext);
}
