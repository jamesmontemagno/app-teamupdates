// Profile API service

import { apiGet, apiPost, apiPut } from './client';
import type { UserProfile, CreateProfileRequest, UpdateProfileRequest, Team } from './types';

export async function getProfile(userId: string): Promise<UserProfile> {
  return apiGet<UserProfile>(`/profile/${userId}`);
}

export async function createProfile(request: CreateProfileRequest): Promise<UserProfile> {
  return apiPost<UserProfile>('/profile', request);
}

export async function updateProfile(userId: string, request: UpdateProfileRequest): Promise<UserProfile> {
  return apiPut<UserProfile>(`/profile/${userId}`, request);
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  return apiGet<Team[]>(`/profile/${userId}/teams`);
}
