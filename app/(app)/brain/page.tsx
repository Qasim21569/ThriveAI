'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain as BrainIcon } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import type { User } from 'firebase/auth';
import { getLifeModel, saveLifeModel, getRecentEvents } from '@/lib/firebase/lifeModel';
import { LIFE_AREAS, type LifeModel, type LifeEvent, type Profile, type AreaState, type LifeAreaId } from '@/lib/lifemodel/types';
import { ProfileCard } from '@/components/brain/profile-card';
import { AreaCard } from '@/components/brain/area-card';
import AuthModal from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function groupEventsByDate(events: LifeEvent[]): [string, LifeEvent[]][] {
  const groups = new Map<string, LifeEvent[]>();
  for (const e of events) {
    const day = e.date.slice(0, 10);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(e);
  }
  return [...groups.entries()];
}

export default function BrainPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<LifeModel | null>(null);
  const [events, setEvents] = useState<LifeEvent[]>([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      setUser(u);
      try {
        const [m, evts] = await Promise.all([getLifeModel(u.uid), getRecentEvents(u.uid, 30)]);
        setModel(m);
        setEvents(evts);
      } catch (error) {
        console.error('Error loading brain page:', error);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const saveProfile = async (profile: Profile) => {
    if (!user || !model) return;
    const next = { ...model, profile };
    await saveLifeModel(user.uid, next);
    setModel(next);
  };

  const saveArea = (areaId: LifeAreaId) => async (area: AreaState) => {
    if (!user || !model) return;
    const next = { ...model, areas: { ...model.areas, [areaId]: area } };
    await saveLifeModel(user.uid, next);
    setModel(next);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-app px-4 py-10">
        <Skeleton className="mb-2 h-4 w-16" />
        <Skeleton className="mb-8 h-9 w-72" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-10">
      <AuthModal open={showAuthModal} onClose={() => router.push('/')} onSuccess={() => setShowAuthModal(false)} />

      <div className="mx-auto max-w-app">
        <div className="mb-8">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-accent">Brain</span>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-foreground md:text-4xl">
            What your mentor knows
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Everything here was learned from your conversations and check-ins. Correct anything — your edits win.
          </p>
        </div>

        {!model ? (
          <Card>
            <CardContent className="px-6 py-12 text-center">
              <BrainIcon className="mx-auto mb-4 size-10 text-text-muted" />
              <p className="mb-2 font-serif text-lg font-semibold text-foreground">Nothing learned yet</p>
              <p className="mb-6 text-sm text-text-muted">
                The brain builds itself from your daily check-ins and chats.
              </p>
              <div className="flex justify-center gap-3">
                <Button asChild variant="primary"><Link href="/today">Do today&apos;s check-in</Link></Button>
                <Button asChild variant="outline"><Link href="/coach">Talk to your mentor</Link></Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <ProfileCard profile={model.profile} onSave={saveProfile} />

            <div className="grid gap-4 md:grid-cols-2">
              {LIFE_AREAS.map((areaId) => (
                <AreaCard
                  key={areaId}
                  areaId={areaId}
                  area={model.areas[areaId]}
                  onSave={saveArea(areaId)}
                  action={
                    areaId === 'health'
                      ? { label: 'Fitness assessment →', href: '/fitness/form' }
                      : areaId === 'mental'
                        ? { label: 'Wellbeing check →', href: '/mental/form' }
                        : undefined
                  }
                />
              ))}
            </div>

            <Card>
              <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-sm text-text-muted">No events recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {groupEventsByDate(events).map(([day, dayEvents]) => (
                      <div key={day}>
                        <p className="mb-1.5 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">
                          {new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                        </p>
                        <div className="space-y-1.5">
                          {dayEvents.map((e) => (
                            <div key={e.id} className="flex items-start gap-2.5 rounded-md border border-border bg-surface-sunken px-3 py-2">
                              <span className="mt-0.5 rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[10px] uppercase text-primary">
                                {e.area}
                              </span>
                              <p className="min-w-0 flex-1 text-sm text-text-body">{e.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
