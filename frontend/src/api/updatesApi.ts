// Updates API service

import { apiGet, apiPost } from './client';
import type { TeamUpdate, CreateUpdateRequest, UpdateFilters } from './types';

export async function getTeamUpdates(
  teamId: string,
  filters?: UpdateFilters
): Promise<TeamUpdate[]> {
  return apiGet<TeamUpdate[]>(`/teams/${teamId}/updates`, {
    params: {
      day: filters?.day,
      category: filters?.category,
      media: filters?.media,
      location: filters?.location,
    },
  });
}

export async function createUpdate(
  teamId: string,
  request: CreateUpdateRequest
): Promise<TeamUpdate> {
  return apiPost<TeamUpdate>(`/teams/${teamId}/updates`, request);
}

export async function getUserUpdates(userId: string): Promise<TeamUpdate[]> {
  // Note: Backend doesn't have this endpoint yet, but we'll implement it
  return apiGet<TeamUpdate[]>(`/profile/${userId}/updates`);
}
