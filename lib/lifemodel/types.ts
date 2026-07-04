export const LIFE_AREAS = ['career', 'health', 'mental', 'financial', 'social'] as const;
export type LifeAreaId = (typeof LIFE_AREAS)[number];

export const EVENT_TYPES = ['milestone', 'setback', 'activity', 'decision', 'feeling', 'fact'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface Goal {
  id: string;
  text: string;
  targetDate: string | null; // ISO date or null
  status: 'active' | 'done' | 'dropped';
}

export interface Thread {
  id: string;
  text: string; // open loop, e.g. "interviewing at TCS"
  status: 'open' | 'closed';
}

export interface AreaState {
  status: string; // 2-3 sentence current situation
  summary: string; // rolling narrative of this area's history
  goals: Goal[];
  threads: Thread[];
}

export interface Profile {
  identity: string; // who the user is
  personality: string;
  coachingStyle: string; // how this user likes to be coached
}

export interface LifeEvent {
  id: string;
  date: string; // ISO timestamp
  area: LifeAreaId;
  type: EventType;
  content: string;
}

export interface LifeModel {
  profile: Profile;
  areas: Record<LifeAreaId, AreaState>;
}

export function emptyLifeModel(): LifeModel {
  const areas = {} as Record<LifeAreaId, AreaState>;
  for (const area of LIFE_AREAS) {
    areas[area] = { status: '', summary: '', goals: [], threads: [] };
  }
  return {
    profile: { identity: '', personality: '', coachingStyle: '' },
    areas,
  };
}
