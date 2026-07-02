import { db } from './firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

export type PlanType = 'fitness' | 'mental';

// Metadata only — used for list views (no heavy data field)
export interface PlanSummary {
  id: string;
  type: PlanType;
  title: string;
  createdAt: string;
  isActive: boolean;
}

// Full record including the generated plan JSON
export interface PlanRecord extends PlanSummary {
  data: Record<string, unknown>;
}

function toISOString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

/**
 * Save a new plan to users/{uid}/plans/{auto-id}.
 * Returns the generated Firestore document ID (used as the plan URL).
 */
export async function savePlan(
  uid: string,
  type: PlanType,
  title: string,
  data: unknown,
): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'plans'), {
    type,
    title,
    data,
    isActive: true,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Fetch a single plan by ID.
 * Returns null when the document doesn't exist or belongs to a different user.
 */
export async function getPlan(uid: string, planId: string): Promise<PlanRecord | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'plans', planId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    type: d.type as PlanType,
    title: d.title as string,
    createdAt: toISOString(d.createdAt),
    isActive: Boolean(d.isActive),
    data: d.data as Record<string, unknown>,
  };
}

/**
 * List all plans for a user, newest first.
 * Only returns summary fields — not the full data payload — so the list
 * view stays fast regardless of how large individual plans grow.
 */
export async function getUserPlans(uid: string): Promise<PlanSummary[]> {
  const q = query(
    collection(db, 'users', uid, 'plans'),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    type: d.data().type as PlanType,
    title: d.data().title as string,
    createdAt: toISOString(d.data().createdAt),
    isActive: Boolean(d.data().isActive),
  }));
}
