// Teams API service

import { apiGet, apiPost } from './client';
import type { Team } from './types';

export async function getTeams(): Promise<Team[]> {
  return apiGet<Team[]>('/teams');
}

export async function getTeam(teamId: string): Promise<Team> {
  return apiGet<Team>(`/teams/${teamId}`);
}

export async function joinTeam(teamId: string, userId: string): Promise<void> {
  return apiPost<void>(`/teams/${teamId}/join`, { userId });
}
