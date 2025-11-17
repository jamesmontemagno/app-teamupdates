// API DTOs matching backend models

export interface Team {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
  memberCount?: number;
}

export interface TeamMembership {
  userId: string;
  teamId: string;
  joinedAt: string;
}

export interface TeamUpdate {
  id: string;
  teamId: string;
  userId: string;
  userDisplayName: string;
  userEmoji: string;
  userPhotoUrl?: string;
  createdAt: string;
  dayKey: string;
  category: 'team' | 'life' | 'win' | 'blocker';
  text: string;
  media?: MediaAttachment;
  location?: LocationPin;
}

export interface MediaAttachment {
  type: 'none' | 'audio' | 'image' | 'video';
  dataUrl?: string;
  name?: string;
  duration?: number;
  size?: number;
}

export interface LocationPin {
  lat: number;
  lng: number;
  label?: string;
  accuracy?: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  color: string;
  emoji: string;
  photoUrl?: string;
  city?: string;
  state?: string;
  country?: string;
  defaultLocation?: {
    lat: number;
    lng: number;
    displayName?: string;
  };
  randomizationRadius: number;
  lastLocation?: {
    city?: string;
    state?: string;
    country?: string;
    label?: string;
  };
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

// Request DTOs
export interface CreateProfileRequest {
  displayName: string;
  color: string;
  emoji: string;
  photoUrl?: string;
  city?: string;
  state?: string;
  country?: string;
  randomizationRadius?: number;
}

export interface UpdateProfileRequest {
  displayName?: string;
  color?: string;
  emoji?: string;
  photoUrl?: string;
  city?: string;
  state?: string;
  country?: string;
  randomizationRadius?: number;
}

export interface CreateUpdateRequest {
  userId: string;
  dayKey: string; // Format: YYYY-MM-DD
  text: string;
  category: string;
  media?: {
    type: string;
    dataUrl?: string;
    name?: string;
    duration?: number;
    size?: number;
  };
  location?: {
    lat: number;
    lng: number;
    label?: string;
  };
  lastLocation?: {
    city?: string;
    state?: string;
    country?: string;
    label?: string;
  };
  defaultLocation?: {
    lat: number;
    lng: number;
  };
}

export interface GeocodeRequest {
  city?: string;
  state?: string;
  country?: string;
}

// Filter parameters
export interface UpdateFilters {
  day?: string;
  category?: string;
  media?: string;
  location?: boolean;
}
