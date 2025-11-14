import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { UserProfile } from '../types';

const STORAGE_KEY = 'teamUpdatesUserProfile';

const defaultProfile: UserProfile = {
  id: 'anonymous',
  displayName: 'You',
  color: '#5f7a90',
  emoji: '🌟',
};

function loadProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as UserProfile;
    }
  } catch (error) {
    console.error('Unable to load profile', error);
  }
  return defaultProfile;
}

function persistProfile(profile: UserProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Unable to persist profile', error);
  }
}

interface UserProfileContextShape {
  profile: UserProfile;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const UserProfileContext = createContext<UserProfileContextShape>({
  profile: defaultProfile,
  updateProfile: () => {},
});

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setProfile((current) => {
      const next = {
        ...current,
        ...data,
      };
      if (!next.id || next.id === 'anonymous') {
        next.id = crypto.randomUUID?.() || current.id || 'unknown';
      }
      persistProfile(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ profile, updateProfile }), [profile, updateProfile]);

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
