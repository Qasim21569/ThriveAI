import { db } from './firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

export type CheckinType = 'workout' | 'mood' | 'note' | 'daily';

export interface Checkin {
  id: string;
  type: CheckinType;
  summary: string;
  createdAt: string;
}

function toISOString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

/**
 * Save a check-in to users/{uid}/checkins/{auto-id}.
 * This is the write the coach's `log_checkin` tool triggers — the first
 * place in the app where an AI decision results in real, persisted state.
 */
export async function saveCheckin(
  uid: string,
  type: CheckinType,
  summary: string,
): Promise<void> {
  await addDoc(collection(db, 'users', uid, 'checkins'), {
    type,
    summary,
    createdAt: serverTimestamp(),
  });
}

/**
 * Fetch the most recent `take` check-ins, newest first (for a feed/timeline view).
 */
export async function getRecentCheckins(uid: string, take = 20): Promise<Checkin[]> {
  const q = query(
    collection(db, 'users', uid, 'checkins'),
    orderBy('createdAt', 'desc'),
    limit(take),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    type: d.data().type as CheckinType,
    summary: d.data().summary as string,
    createdAt: toISOString(d.data().createdAt),
  }));
}
