import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile } from '../api/types';
import * as api from '../api';
import { ApiError } from '../api/client';
import { showError } from '../utils/toast';
import { withSpan } from '../telemetry';

const USER_ID_KEY = 'teamUpdatesUserId';
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

interface UserProfileContextShape {
  profile: UserProfile;
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  geocodeLocation: (city?: string, state?: string, country?: string) => Promise<void>;
  geocoding: boolean;
  geocodeError: string | null;
}

const UserProfileContext = createContext<UserProfileContextShape>({
  profile: defaultProfile,
  loading: false,
  updateProfile: async () => {},
  geocodeLocation: async () => {},
  geocoding: false,
  geocodeError: null,
});

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem(USER_ID_KEY);
    if (userId) {
      setLoading(true);
      api.getProfile(userId)
        .then((fetchedProfile) => {
          setProfile(fetchedProfile);
        })
        .catch((err) => {
          // Handle 404 - user not found, clear userId and redirect
          if (err instanceof ApiError && err.status === 404) {
            localStorage.removeItem(USER_ID_KEY);
            navigate('/profile/new');
          } else {
            console.error('Failed to load profile', err);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [navigate]);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    const userId = localStorage.getItem(USER_ID_KEY);
    if (!userId || userId === 'anonymous') {
      showError('Please create a profile first');
      return;
    }

    try {
      await withSpan(
        'profile.update',
        {
          'user.id': userId,
          'profile.has_location': !!(data.defaultLocation || data.city),
        },
        async () => {
          const updatedProfile = await api.updateProfile(userId, data);
          setProfile(updatedProfile);
        }
      );
    } catch (err) {
      showError(err, 'Failed to update profile');
      throw err;
    }
  }, []);

  const geocodeLocation = useCallback(async (city?: string, state?: string, country?: string) => {
    setGeocoding(true);
    setGeocodeError(null);

    try {
      await withSpan(
        'geocode.location',
        {
          'location.city': city || '',
          'location.state': state || '',
          'location.country': country || '',
        },
        async () => {
          const result = await api.geocodeAddress({ city, state, country });
          await updateProfile({
            city,
            state,
            country,
            defaultLocation: {
              lat: result.lat,
              lng: result.lng,
              displayName: result.displayName,
            },
          });
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to geocode location';
      setGeocodeError(message);
      showError(error, 'Failed to geocode location');
      throw error;
    } finally {
      setGeocoding(false);
    }
  }, [updateProfile]);

  const value = useMemo(
    () => ({ profile, loading, updateProfile, geocodeLocation, geocoding, geocodeError }),
    [profile, loading, updateProfile, geocodeLocation, geocoding, geocodeError]
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUserProfile() {
  return useContext(UserProfileContext);
}
