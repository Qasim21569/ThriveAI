import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface MemoryDoc {
  summary: string;
  summarizedCount: number;
  lastUpdated: string;
}

function toISOString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

/**
 * Read the rolling memory summary: a compressed paragraph representing
 * everything older than the "recent" window the context pipeline shows
 * in full. `summarizedCount` records how many check-ins existed when this
 * summary was generated, so the caller can tell whether it's stale.
 */
export async function getMemory(uid: string): Promise<MemoryDoc | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'memory', 'summary'));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    summary: d.summary as string,
    summarizedCount: (d.summarizedCount as number) ?? 0,
    lastUpdated: toISOString(d.lastUpdated),
  };
}

export async function saveMemory(uid: string, summary: string, summarizedCount: number): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'memory', 'summary'), {
    summary,
    summarizedCount,
    lastUpdated: serverTimestamp(),
  });
}
