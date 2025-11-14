export type Category = 'team' | 'life' | 'win' | 'blocker';
export type MediaType = 'none' | 'audio' | 'image' | 'video';

export interface MediaAttachment {
  type: MediaType;
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

export interface TeamUpdate {
  id: string;
  userId: string;
  userDisplayName: string;
  createdAt: string;
  dayKey: string;
  category: Category;
  text: string;
  media: MediaAttachment;
  location?: LocationPin;
}

export interface UserProfile {
  id: string;
  displayName: string;
  color: string;
  emoji: string;
}

export type MediaFilter = 'all' | 'text' | 'audio' | 'image' | 'video';
export type CategoryFilter = 'all' | Category;

export interface FilterState {
  dayKey: 'all' | string;
  category: CategoryFilter;
  media: MediaFilter;
  locationOnly: boolean;
}
