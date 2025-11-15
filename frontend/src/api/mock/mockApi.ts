// Mock API implementation using sessionStorage

import type {
  Team,
  UserProfile,
  TeamUpdate,
  CreateProfileRequest,
  UpdateProfileRequest,
  CreateUpdateRequest,
  GeocodeRequest,
  GeocodingResult,
  UpdateFilters,
  MediaAttachment,
} from '../types';
import {
  mockTeams,
  mockProfiles,
  mockUpdates,
  mockMemberships,
  DEFAULT_TEAM_ID,
} from './seedData';

const STORAGE_KEY_TEAMS = 'mockApi_teams';
const STORAGE_KEY_PROFILES = 'mockApi_profiles';
const STORAGE_KEY_UPDATES = 'mockApi_updates';
const STORAGE_KEY_MEMBERSHIPS = 'mockApi_memberships';

// Helper to load data from sessionStorage or use seed data
function loadData<T>(key: string, defaultData: T[]): T[] {
  try {
    const stored = sessionStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T[];
    }
  } catch (error) {
    console.error(`Failed to load ${key}`, error);
  }
  return defaultData;
}

// Helper to save data to sessionStorage
function saveData<T>(key: string, data: T[]): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key}`, error);
  }
}

// Simulate network delay
function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Get current state
function getTeams(): Team[] {
  return loadData(STORAGE_KEY_TEAMS, mockTeams);
}

function getProfiles(): UserProfile[] {
  return loadData(STORAGE_KEY_PROFILES, mockProfiles);
}

function getUpdates(): TeamUpdate[] {
  return loadData(STORAGE_KEY_UPDATES, mockUpdates);
}

function getMemberships() {
  return loadData(STORAGE_KEY_MEMBERSHIPS, mockMemberships);
}

// Teams API
export async function mockGetTeams(): Promise<Team[]> {
  await delay();
  const teams = getTeams().filter((t) => t.isPublic);
  return teams;
}

export async function mockGetTeam(teamId: string): Promise<Team> {
  await delay();
  const teams = getTeams();
  const team = teams.find((t) => t.id === teamId);
  if (!team) {
    throw new Error('Team not found');
  }
  return team;
}

export async function mockJoinTeam(teamId: string, userId: string): Promise<void> {
  await delay();
  const memberships = getMemberships();
  const existing = memberships.find((m) => m.teamId === teamId && m.userId === userId);
  if (!existing) {
    memberships.push({
      userId,
      teamId,
      joinedAt: new Date().toISOString(),
    });
    saveData(STORAGE_KEY_MEMBERSHIPS, memberships);
  }
}

// Profile API
export async function mockGetProfile(userId: string): Promise<UserProfile> {
  await delay();
  const profiles = getProfiles();
  const profile = profiles.find((p) => p.id === userId);
  if (!profile) {
    throw new Error('Profile not found');
  }
  return profile;
}

export async function mockCreateProfile(request: CreateProfileRequest): Promise<UserProfile> {
  await delay();
  const profiles = getProfiles();
  const newProfile: UserProfile = {
    id: crypto.randomUUID(),
    displayName: request.displayName,
    color: request.color,
    emoji: request.emoji,
    photoUrl: request.photoUrl,
    city: request.city,
    state: request.state,
    country: request.country,
    randomizationRadius: request.randomizationRadius || 100,
  };
  profiles.push(newProfile);
  saveData(STORAGE_KEY_PROFILES, profiles);

  // Auto-join default team
  const memberships = getMemberships();
  memberships.push({
    userId: newProfile.id,
    teamId: DEFAULT_TEAM_ID,
    joinedAt: new Date().toISOString(),
  });
  saveData(STORAGE_KEY_MEMBERSHIPS, memberships);

  return newProfile;
}

export async function mockUpdateProfile(
  userId: string,
  request: UpdateProfileRequest
): Promise<UserProfile> {
  await delay();
  const profiles = getProfiles();
  const profileIndex = profiles.findIndex((p) => p.id === userId);
  if (profileIndex === -1) {
    throw new Error('Profile not found');
  }

  const updatedProfile = {
    ...profiles[profileIndex],
    ...request,
  };
  profiles[profileIndex] = updatedProfile;
  saveData(STORAGE_KEY_PROFILES, profiles);
  return updatedProfile;
}

export async function mockGetUserTeams(userId: string): Promise<Team[]> {
  await delay();
  const memberships = getMemberships();
  const teams = getTeams();
  const userMemberships = memberships.filter((m) => m.userId === userId);
  const userTeams = teams.filter((t) => userMemberships.some((m) => m.teamId === t.id));
  return userTeams;
}

// Updates API
export async function mockGetTeamUpdates(
  teamId: string,
  filters?: UpdateFilters
): Promise<TeamUpdate[]> {
  await delay();
  let updates = getUpdates().filter((u) => u.teamId === teamId);

  // Apply filters
  if (filters?.day && filters.day !== 'all') {
    updates = updates.filter((u) => u.dayKey === filters.day);
  }
  if (filters?.category && filters.category !== 'all') {
    updates = updates.filter((u) => u.category === filters.category);
  }
  if (filters?.media && filters.media !== 'all') {
    if (filters.media === 'text') {
      updates = updates.filter((u) => !u.media || u.media.type === 'none');
    } else {
      updates = updates.filter((u) => u.media?.type === filters.media);
    }
  }
  if (filters?.location) {
    updates = updates.filter((u) => u.location != null);
  }

  // Sort by date descending
  updates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return updates;
}

export async function mockCreateUpdate(
  teamId: string,
  request: CreateUpdateRequest
): Promise<TeamUpdate> {
  await delay();
  const updates = getUpdates();
  const profiles = getProfiles();
  const profile = profiles.find((p) => p.id === request.userId);

  if (!profile) {
    throw new Error('User profile not found');
  }

  const createdAt = new Date().toISOString();
  const dayKey = createdAt.split('T')[0];

  const newUpdate: TeamUpdate = {
    id: crypto.randomUUID(),
    teamId,
    userId: request.userId,
    userDisplayName: profile.displayName,
    userEmoji: profile.emoji,
    userPhotoUrl: profile.photoUrl,
    createdAt,
    dayKey,
    category: request.category as TeamUpdate['category'],
    text: request.text,
    media: request.media as MediaAttachment | undefined,
    location: request.location,
  };

  updates.unshift(newUpdate);
  saveData(STORAGE_KEY_UPDATES, updates);
  return newUpdate;
}

// Geocoding API
export async function mockGeocodeAddress(request: GeocodeRequest): Promise<GeocodingResult> {
  await delay(500); // Simulate slower geocoding

  // Simple mock geocoding - return hardcoded coordinates for common cities
  const mockLocations: Record<string, GeocodingResult> = {
    'seattle,wa,usa': { lat: 47.6062, lng: -122.3321, displayName: 'Seattle, WA, USA' },
    'san francisco,ca,usa': { lat: 37.7749, lng: -122.4194, displayName: 'San Francisco, CA, USA' },
    'austin,tx,usa': { lat: 30.2672, lng: -97.7431, displayName: 'Austin, TX, USA' },
    'new york,ny,usa': { lat: 40.7128, lng: -74.0060, displayName: 'New York, NY, USA' },
    'chicago,il,usa': { lat: 41.8781, lng: -87.6298, displayName: 'Chicago, IL, USA' },
    'boston,ma,usa': { lat: 42.3601, lng: -71.0589, displayName: 'Boston, MA, USA' },
    'denver,co,usa': { lat: 39.7392, lng: -104.9903, displayName: 'Denver, CO, USA' },
    'portland,or,usa': { lat: 45.5152, lng: -122.6784, displayName: 'Portland, OR, USA' },
  };

  const key = [request.city, request.state, request.country]
    .filter(Boolean)
    .join(',')
    .toLowerCase()
    .replace(/\s+/g, '');

  const result = mockLocations[key];
  if (result) {
    return result;
  }

  // Default fallback
  return {
    lat: 47.6062,
    lng: -122.3321,
    displayName: [request.city, request.state, request.country].filter(Boolean).join(', '),
  };
}
