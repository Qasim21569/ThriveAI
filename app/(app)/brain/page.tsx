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
import { PageHeader } from '@/components/ui/page-header';
import { FadeIn } from '@/components/motion/fade-in';
import { Stagger, StaggerItem } from '@/components/motion/stagger';

const TIMELINE_CAP = 20;

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

  // Flatten timeline rows and cap at TIMELINE_CAP
  const allEvents = events.slice(0, TIMELINE_CAP);
  const timelineGroups = groupEventsByDate(allEvents);

  return (
    <div className="px-4 py-10">
      <AuthModal open={showAuthModal} onClose={() => router.push('/')} onSuccess={() => setShowAuthModal(false)} />

      <div className="mx-auto max-w-app">
        <div className="mb-8">
          <PageHeader
            eyebrow="Brain"
            title="What your mentor knows"
            sub="Everything here was learned from your conversations and check-ins. Correct anything. Your edits win."
          />
        </div>

        {!model ? (
          <FadeIn>
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
          </FadeIn>
        ) : (
          <div className="space-y-6">
            <div id="wt-brain-profile">
              <ProfileCard profile={model.profile} onSave={saveProfile} />
            </div>

            <Stagger className="grid gap-4 md:grid-cols-2">
              {LIFE_AREAS.map((areaId, index) => (
                <StaggerItem key={areaId}>
                  {/* First area card gets the walkthrough edit-affordance target id */}
                  <div id={index === 0 ? 'wt-brain-area-edit' : undefined}>
                    <AreaCard
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
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <div id="wt-brain-timeline">
              <Card>
                <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <FadeIn>
                      <p className="text-sm text-text-muted">No events recorded yet.</p>
                    </FadeIn>
                  ) : (
                    <Stagger className="space-y-4">
                      {timelineGroups.map(([day, dayEvents]) => (
                        <StaggerItem key={day}>
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
                        </StaggerItem>
                      ))}
                    </Stagger>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
