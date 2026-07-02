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

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

function toISOString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

/**
 * Save one message to users/{uid}/coachMessages/{auto-id}.
 * User and assistant turns are both stored here as separate documents,
 * ordered by createdAt — this is the coach's durable conversation history.
 */
export async function saveMessage(uid: string, role: ChatRole, content: string): Promise<void> {
  await addDoc(collection(db, 'users', uid, 'coachMessages'), {
    role,
    content,
    createdAt: serverTimestamp(),
  });
}

/**
 * Fetch the most recent `take` messages, returned oldest-first so callers
 * can render them top-to-bottom without re-sorting.
 */
export async function getRecentMessages(uid: string, take = 20): Promise<ChatMessage[]> {
  const q = query(
    collection(db, 'users', uid, 'coachMessages'),
    orderBy('createdAt', 'desc'),
    limit(take),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({
      id: d.id,
      role: d.data().role as ChatRole,
      content: d.data().content as string,
      createdAt: toISOString(d.data().createdAt),
    }))
    .reverse();
}
