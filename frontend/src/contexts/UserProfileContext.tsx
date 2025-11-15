import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { UserProfile } from '../types';

const STORAGE_KEY = 'teamUpdatesUserProfile';
const ONBOARDING_KEY = 'teamUpdatesOnboarded';

const defaultProfile: UserProfile = {
  id: 'anonymous',
  displayName: 'You',
  color: '#5f7a90',
  emoji: '🌟',
  randomizationRadius: 100,
};

// eslint-disable-next-line react-refresh/only-export-components
export function isNewUser(): boolean {
  return !localStorage.getItem(ONBOARDING_KEY);
}

// eslint-disable-next-line react-refresh/only-export-components
export function markUserOnboarded(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

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
  geocodeLocation: (city?: string, state?: string, country?: string) => Promise<void>;
  geocoding: boolean;
  geocodeError: string | null;
}

const UserProfileContext = createContext<UserProfileContextShape>({
  profile: defaultProfile,
  updateProfile: () => {},
  geocodeLocation: async () => {},
  geocoding: false,
  geocodeError: null,
});

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

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

  const geocodeLocation = useCallback(async (city?: string, state?: string, country?: string) => {
    setGeocoding(true);
    setGeocodeError(null);
    try {
      const { geocodeAddress } = await import('../utils/geocoding');
      const result = await geocodeAddress(city, state, country);
      updateProfile({
        city,
        state,
        country,
        defaultLocation: {
          lat: result.lat,
          lng: result.lng,
          displayName: result.displayName,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to geocode location';
      setGeocodeError(message);
      throw error;
    } finally {
      setGeocoding(false);
    }
  }, [updateProfile]);

  const value = useMemo(
    () => ({ profile, updateProfile, geocodeLocation, geocoding, geocodeError }),
    [profile, updateProfile, geocodeLocation, geocoding, geocodeError]
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUserProfile() {
  return useContext(UserProfileContext);
}
