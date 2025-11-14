import { format, formatISO, isToday, isYesterday, parseISO } from 'date-fns';
import type { TeamUpdate } from '../types';

export function formatDayKey(date: Date | string) {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return format(parsed, 'yyyy-MM-dd');
}

export function friendlyDayLabel(dayKey: string) {
  const parsed = parseISO(dayKey);
  if (isToday(parsed)) return 'Today';
  if (isYesterday(parsed)) return 'Yesterday';
  return format(parsed, 'EEEE, MMM d');
}

export function formatTimeLabel(date: string) {
  return format(parseISO(date), 'p');
}

export function sortUpdatesChronologically(updates: TeamUpdate[]) {
  return [...updates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function groupUpdatesByDay(updates: TeamUpdate[]) {
  const groups: Record<string, TeamUpdate[]> = {};
  updates.forEach((update) => {
    if (!groups[update.dayKey]) {
      groups[update.dayKey] = [];
    }
    groups[update.dayKey].push(update);
  });
  return groups;
}

export function getDayKeysByRecency(updates: TeamUpdate[]) {
  return Array.from(new Set(updates.map((update) => update.dayKey))).sort((a, b) => (a < b ? 1 : -1));
}

export function nowAsISOString() {
  return formatISO(new Date());
}
