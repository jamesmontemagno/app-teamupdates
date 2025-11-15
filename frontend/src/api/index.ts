// API factory - switches between real and mock APIs based on environment

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
} from './types';

// Real API imports
import * as teamsApi from './teamsApi';
import * as updatesApi from './updatesApi';
import * as profileApi from './profileApi';
import * as geocodeApi from './geocodeApi';

// Mock API imports
import * as mockApi from './mock/mockApi';

// Check if mock mode is enabled
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// Helper function to check mode
export function isMockMode(): boolean {
  return USE_MOCK_API;
}

// Teams API
export async function getTeams(): Promise<Team[]> {
  return USE_MOCK_API ? mockApi.mockGetTeams() : teamsApi.getTeams();
}

export async function getTeam(teamId: string): Promise<Team> {
  return USE_MOCK_API ? mockApi.mockGetTeam(teamId) : teamsApi.getTeam(teamId);
}

export async function joinTeam(teamId: string, userId: string): Promise<void> {
  return USE_MOCK_API ? mockApi.mockJoinTeam(teamId, userId) : teamsApi.joinTeam(teamId, userId);
}

// Profile API
export async function getProfile(userId: string): Promise<UserProfile> {
  return USE_MOCK_API ? mockApi.mockGetProfile(userId) : profileApi.getProfile(userId);
}

export async function createProfile(request: CreateProfileRequest): Promise<UserProfile> {
  return USE_MOCK_API ? mockApi.mockCreateProfile(request) : profileApi.createProfile(request);
}

export async function updateProfile(userId: string, request: UpdateProfileRequest): Promise<UserProfile> {
  return USE_MOCK_API ? mockApi.mockUpdateProfile(userId, request) : profileApi.updateProfile(userId, request);
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  return USE_MOCK_API ? mockApi.mockGetUserTeams(userId) : profileApi.getUserTeams(userId);
}

// Updates API
export async function getTeamUpdates(teamId: string, filters?: UpdateFilters): Promise<TeamUpdate[]> {
  return USE_MOCK_API ? mockApi.mockGetTeamUpdates(teamId, filters) : updatesApi.getTeamUpdates(teamId, filters);
}

export async function createUpdate(teamId: string, request: CreateUpdateRequest): Promise<TeamUpdate> {
  return USE_MOCK_API ? mockApi.mockCreateUpdate(teamId, request) : updatesApi.createUpdate(teamId, request);
}

export async function getUserUpdates(userId: string): Promise<TeamUpdate[]> {
  return USE_MOCK_API ? mockApi.mockGetTeamUpdates('', {}) : updatesApi.getUserUpdates(userId);
}

// Geocoding API
export async function geocodeAddress(request: GeocodeRequest): Promise<GeocodingResult> {
  return USE_MOCK_API ? mockApi.mockGeocodeAddress(request) : geocodeApi.geocodeAddress(request);
}
