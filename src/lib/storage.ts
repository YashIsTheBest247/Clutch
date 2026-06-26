import type { AppState, UserProfile } from '../types';

const KEY = 'clutch.state.v1';

export const defaultProfile: UserProfile = {
  name: 'Yash',
  dayStartHour: 9,
  dayEndHour: 21,
  role: 'Student',
  workStyle: 'I procrastinate, work best in 45-minute focused sprints, and like clear next steps.',
};

export function emptyState(): AppState {
  return {
    profile: defaultProfile,
    tasks: [],
    schedule: [],
    messages: [],
    streak: { count: 0 },
    goals: [],
    habits: [],
  };
}

/** Trailing consecutive-day streak for a habit's completion history. */
export function habitStreak(history: string[]): number {
  const set = new Set(history);
  const d = new Date();
  if (!set.has(todayStr(d))) d.setDate(d.getDate() - 1); // today not done yet → don't break streak
  let streak = 0;
  while (set.has(todayStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Local calendar date as YYYY-MM-DD. */
export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...emptyState(),
      ...parsed,
      profile: { ...defaultProfile, ...parsed.profile },
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — non-fatal */
  }
}

export function uid(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
