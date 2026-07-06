import { db } from './firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import {
  LIFE_AREAS,
  emptyLifeModel,
  type LifeModel,
  type LifeAreaId,
  type AreaState,
  type LifeEvent,
  type EventType,
} from '@/lib/lifemodel/types';

/**
 * The brain's storage. Docs live at users/{uid}/lifeModel/{docId} where
 * docId is 'profile' or one of the five area ids. Events are an append-only
 * timeline at users/{uid}/events. All reads/writes use the client SDK,
 * consistent with the app's no-Admin-SDK architecture.
 */

export async function getLifeModel(uid: string): Promise<LifeModel | null> {
  const profileSnap = await getDoc(doc(db, 'users', uid, 'lifeModel', 'profile'));
  if (!profileSnap.exists()) return null;

  const model = emptyLifeModel();
  const p = profileSnap.data();
  model.profile = {
    identity: (p.identity as string) ?? '',
    personality: (p.personality as string) ?? '',
    coachingStyle: (p.coachingStyle as string) ?? '',
  };

  const areaSnaps = await Promise.all(
    LIFE_AREAS.map((a) => getDoc(doc(db, 'users', uid, 'lifeModel', a))),
  );
  areaSnaps.forEach((snap, i) => {
    if (!snap.exists()) return;
    const d = snap.data();
    model.areas[LIFE_AREAS[i]] = {
      status: (d.status as string) ?? '',
      summary: (d.summary as string) ?? '',
      goals: (d.goals as AreaState['goals']) ?? [],
      threads: (d.threads as AreaState['threads']) ?? [],
    };
  });

  return model;
}

export async function saveLifeModel(uid: string, model: LifeModel): Promise<void> {
  await Promise.all([
    setDoc(doc(db, 'users', uid, 'lifeModel', 'profile'), {
      ...model.profile,
      updatedAt: serverTimestamp(),
    }),
    ...LIFE_AREAS.map((a) =>
      setDoc(doc(db, 'users', uid, 'lifeModel', a), {
        ...model.areas[a],
        updatedAt: serverTimestamp(),
      }),
    ),
  ]);
}

export async function addEvents(uid: string, events: LifeEvent[]): Promise<void> {
  await Promise.all(
    events.map((e) =>
      addDoc(collection(db, 'users', uid, 'events'), {
        date: e.date,
        area: e.area,
        type: e.type,
        content: e.content,
        createdAt: serverTimestamp(),
      }),
    ),
  );
}

/**
 * Reset the life model for a user — deletes the 6 lifeModel docs (profile +
 * 5 areas) and all docs in users/{uid}/events. Check-ins, messages, and plans
 * are left untouched so the brain can re-learn from the kept history.
 */
export async function resetLifeModel(uid: string): Promise<void> {
  // Delete the 6 lifeModel documents in parallel
  const lifeModelDocIds = ['profile', ...LIFE_AREAS] as const;
  await Promise.all(
    lifeModelDocIds.map((docId) =>
      deleteDoc(doc(db, 'users', uid, 'lifeModel', docId)),
    ),
  );

  // Delete all events documents via getDocs + deleteDoc batch
  const eventsSnap = await getDocs(collection(db, 'users', uid, 'events'));
  await Promise.all(eventsSnap.docs.map((d) => deleteDoc(d.ref)));
}

export async function getRecentEvents(uid: string, take = 30): Promise<LifeEvent[]> {
  const q = query(
    collection(db, 'users', uid, 'events'),
    orderBy('date', 'desc'),
    limit(take),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    date: d.data().date as string,
    area: d.data().area as LifeAreaId,
    type: d.data().type as EventType,
    content: d.data().content as string,
  }));
}
