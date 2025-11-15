// Mock seed data for development and testing

import type { Team, UserProfile, TeamUpdate } from '../types';

export const DEFAULT_TEAM_ID = '00000000-0000-0000-0000-000000000001';

export const mockTeams: Team[] = [
  {
    id: DEFAULT_TEAM_ID,
    name: 'Public Team',
    isPublic: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    memberCount: 4,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Engineering',
    isPublic: false,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    memberCount: 3,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Product Team',
    isPublic: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    memberCount: 5,
  },
];

export const mockProfiles: UserProfile[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    displayName: 'Alice Johnson',
    color: '#e63946',
    emoji: '🚀',
    photoUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e63946" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" font-size="50" text-anchor="middle" dy=".3em"%3E🚀%3C/text%3E%3C/svg%3E',
    city: 'Seattle',
    state: 'WA',
    country: 'USA',
    defaultLocation: {
      lat: 47.6062,
      lng: -122.3321,
      displayName: 'Seattle, WA, USA',
    },
    randomizationRadius: 100,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    displayName: 'Bob Smith',
    color: '#457b9d',
    emoji: '💡',
    photoUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23457b9d" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" font-size="50" text-anchor="middle" dy=".3em"%3E💡%3C/text%3E%3C/svg%3E',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    defaultLocation: {
      lat: 37.7749,
      lng: -122.4194,
      displayName: 'San Francisco, CA, USA',
    },
    randomizationRadius: 150,
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    displayName: 'Carol Davis',
    color: '#2a9d8f',
    emoji: '🎨',
    photoUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%232a9d8f" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" font-size="50" text-anchor="middle" dy=".3em"%3E🎨%3C/text%3E%3C/svg%3E',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    defaultLocation: {
      lat: 30.2672,
      lng: -97.7431,
      displayName: 'Austin, TX, USA',
    },
    randomizationRadius: 200,
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    displayName: 'David Wilson',
    color: '#f77f00',
    emoji: '⚡',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    defaultLocation: {
      lat: 40.7128,
      lng: -74.0060,
      displayName: 'New York, NY, USA',
    },
    randomizationRadius: 100,
  },
];

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

function formatDayKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const mockUpdates: TeamUpdate[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    teamId: DEFAULT_TEAM_ID,
    userId: mockProfiles[0].id,
    userDisplayName: mockProfiles[0].displayName,
    userEmoji: mockProfiles[0].emoji,
    userPhotoUrl: mockProfiles[0].photoUrl,
    createdAt: today.toISOString(),
    dayKey: formatDayKey(today),
    category: 'win',
    text: 'Just shipped the new dashboard feature! 🎉 Users are loving the real-time updates.',
    media: {
      type: 'none',
    },
    location: {
      lat: 47.6062 + (Math.random() - 0.5) * 0.002,
      lng: -122.3321 + (Math.random() - 0.5) * 0.002,
      label: 'Seattle Office',
    },
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    teamId: DEFAULT_TEAM_ID,
    userId: mockProfiles[1].id,
    userDisplayName: mockProfiles[1].displayName,
    userEmoji: mockProfiles[1].emoji,
    userPhotoUrl: mockProfiles[1].photoUrl,
    createdAt: today.toISOString(),
    dayKey: formatDayKey(today),
    category: 'blocker',
    text: 'Database migration is taking longer than expected. Need help reviewing the indexes.',
    media: {
      type: 'none',
    },
    location: {
      lat: 37.7749 + (Math.random() - 0.5) * 0.002,
      lng: -122.4194 + (Math.random() - 0.5) * 0.002,
      label: 'SF Office',
    },
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    teamId: DEFAULT_TEAM_ID,
    userId: mockProfiles[2].id,
    userDisplayName: mockProfiles[2].displayName,
    userEmoji: mockProfiles[2].emoji,
    userPhotoUrl: mockProfiles[2].photoUrl,
    createdAt: yesterday.toISOString(),
    dayKey: formatDayKey(yesterday),
    category: 'team',
    text: 'Team standup at 10 AM tomorrow. Please share your updates beforehand!',
    media: {
      type: 'none',
    },
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    teamId: DEFAULT_TEAM_ID,
    userId: mockProfiles[3].id,
    userDisplayName: mockProfiles[3].displayName,
    userEmoji: mockProfiles[3].emoji,
    createdAt: yesterday.toISOString(),
    dayKey: formatDayKey(yesterday),
    category: 'life',
    text: 'Working from the beach this week! 🏖️ Internet is great here.',
    media: {
      type: 'image',
      dataUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%2387ceeb" width="400" height="200"/%3E%3Crect fill="%23f4a460" y="200" width="400" height="100"/%3E%3Ccircle fill="%23ffd700" cx="350" cy="50" r="30"/%3E%3Ctext x="200" y="150" font-size="40" text-anchor="middle"%3E🏖️%3C/text%3E%3C/svg%3E',
      name: 'beach.jpg',
      size: 1024,
    },
    location: {
      lat: 40.7128 + (Math.random() - 0.5) * 0.002,
      lng: -74.0060 + (Math.random() - 0.5) * 0.002,
      label: 'Remote',
    },
  },
  {
    id: '20000000-0000-0000-0000-000000000005',
    teamId: DEFAULT_TEAM_ID,
    userId: mockProfiles[0].id,
    userDisplayName: mockProfiles[0].displayName,
    userEmoji: mockProfiles[0].emoji,
    userPhotoUrl: mockProfiles[0].photoUrl,
    createdAt: twoDaysAgo.toISOString(),
    dayKey: formatDayKey(twoDaysAgo),
    category: 'team',
    text: 'Code review session scheduled for 2 PM. Will go over the new API endpoints.',
    media: {
      type: 'audio',
      dataUrl: 'data:audio/mpeg;base64,SUQzAwAAAAAAFlRJVDIAAAANAAAASGVsbG8gV29ybGQA',
      name: 'update.mp3',
      duration: 15,
      size: 2048,
    },
  },
  {
    id: '20000000-0000-0000-0000-000000000006',
    teamId: '00000000-0000-0000-0000-000000000002',
    userId: mockProfiles[1].id,
    userDisplayName: mockProfiles[1].displayName,
    userEmoji: mockProfiles[1].emoji,
    userPhotoUrl: mockProfiles[1].photoUrl,
    createdAt: today.toISOString(),
    dayKey: formatDayKey(today),
    category: 'win',
    text: 'All tests passing! CI/CD pipeline is green 💚',
    media: {
      type: 'none',
    },
  },
];

export const mockMemberships = [
  { userId: mockProfiles[0].id, teamId: DEFAULT_TEAM_ID, joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { userId: mockProfiles[1].id, teamId: DEFAULT_TEAM_ID, joinedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
  { userId: mockProfiles[2].id, teamId: DEFAULT_TEAM_ID, joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
  { userId: mockProfiles[3].id, teamId: DEFAULT_TEAM_ID, joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { userId: mockProfiles[0].id, teamId: '00000000-0000-0000-0000-000000000002', joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
  { userId: mockProfiles[1].id, teamId: '00000000-0000-0000-0000-000000000002', joinedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString() },
  { userId: mockProfiles[2].id, teamId: '00000000-0000-0000-0000-000000000003', joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
];
