import { db } from './firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
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
 * Save a new plan to users/{uid}/plans/{auto-id}, marking it the sole
 * active plan. A newly created plan becoming "the" active plan is the
 * expected behavior — a stale check-in-time isActive:true left on every
 * previous plan would make "active" mean nothing.
 * Returns the generated Firestore document ID (used as the plan URL).
 */
export async function savePlan(
  uid: string,
  type: PlanType,
  title: string,
  data: unknown,
): Promise<string> {
  const existing = await getUserPlans(uid);

  const ref = await addDoc(collection(db, 'users', uid, 'plans'), {
    type,
    title,
    data,
    isActive: true,
    createdAt: serverTimestamp(),
  });

  if (existing.length > 0) {
    const batch = writeBatch(db);
    for (const p of existing) {
      batch.update(doc(db, 'users', uid, 'plans', p.id), { isActive: false });
    }
    await batch.commit();
  }

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

/**
 * Pick the "active" plan from a list: the one explicitly marked isActive,
 * falling back to the most recent if none is (covers plans saved before
 * setActivePlan existed, and the always-newest-first ordering from
 * getUserPlans already puts the fallback candidate first).
 */
export function pickActivePlan(plans: PlanSummary[]): PlanSummary | null {
  return plans.find((p) => p.isActive) ?? plans[0] ?? null;
}

/**
 * Mark one plan active and every other plan for this user inactive.
 * A single batched write — either all of it applies or none of it does.
 */
export async function setActivePlan(uid: string, planId: string, allPlanIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  for (const id of allPlanIds) {
    batch.update(doc(db, 'users', uid, 'plans', id), { isActive: id === planId });
  }
  await batch.commit();
}

/** Permanently delete a plan. */
export async function deletePlan(uid: string, planId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'plans', planId));
}
