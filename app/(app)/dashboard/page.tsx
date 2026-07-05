'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Dumbbell, Plus, ArrowRight, Activity, Smile, StickyNote, CalendarCheck, Flame, Sparkles } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import { getUserPlans, pickActivePlan, type PlanSummary } from '@/lib/firebase/plans';
import { getRecentCheckins, type Checkin, type CheckinType } from '@/lib/firebase/checkins';
import { getLifeModel } from '@/lib/firebase/lifeModel';
import { computeStreak } from '@/lib/checkins/streak';
import AuthModal from '@/components/auth/AuthModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { Stagger, StaggerItem } from '@/components/motion/stagger';

const TYPE_ICON: Record<CheckinType, React.ComponentType<{ className?: string }>> = {
  workout: Dumbbell,
  mood: Smile,
  note: StickyNote,
  daily: CalendarCheck,
};

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-app px-4 py-12">
      <Skeleton className="mb-2 h-4 w-20" />
      <Skeleton className="mb-8 h-9 w-64" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="p-6 md:col-span-2">
          <Skeleton className="mb-4 h-6 w-40" />
          <Skeleton className="mb-2 h-5 w-56" />
          <Skeleton className="mb-4 h-4 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </Card>
        <Card className="p-6">
          <Skeleton className="mb-4 h-6 w-32" />
          <Skeleton className="mb-4 h-4 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
      <Card className="mt-6 p-6">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="mb-2 h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('there');
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<Checkin[]>([]);
  const [streak, setStreak] = useState(0);
  const [hasBrain, setHasBrain] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      setDisplayName(user.displayName?.split(' ')[0] || 'there');
      try {
        const [userPlans, checkins, model] = await Promise.all([
          getUserPlans(user.uid),
          getRecentCheckins(user.uid, 60),
          getLifeModel(user.uid),
        ]);
        setPlans(userPlans);
        setRecentCheckins(checkins.slice(0, 3));
        setStreak(computeStreak(checkins.map((c) => c.createdAt), new Date().toISOString().slice(0, 10)));
        setHasBrain(model !== null);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  if (loading) return <DashboardSkeleton />;

  const activePlan = pickActivePlan(plans);

  return (
    <div className="px-4 py-12">
      <AuthModal open={showAuthModal} onClose={() => router.push('/')} onSuccess={() => setShowAuthModal(false)} />

      <Stagger className="mx-auto max-w-app">
        <StaggerItem>
          <PageHeader
            eyebrow="Dashboard"
            title={`Welcome back, ${displayName}`}
            className="mb-8"
          />
        </StaggerItem>

        {!hasBrain && (
          <StaggerItem>
            <Card className="mb-6 border-accent/40 bg-primary-soft/40">
              <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="size-5 flex-shrink-0 text-accent" />
                  <p className="text-sm text-text-body">
                    Your mentor doesn&apos;t know you yet — a five-minute intro changes everything.
                  </p>
                </div>
                <Button asChild variant="primary">
                  <Link href="/onboarding">Meet your mentor</Link>
                </Button>
              </CardContent>
            </Card>
          </StaggerItem>
        )}

        <StaggerItem>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Active plan card */}
            <div className="md:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="size-5 text-primary" />
                      <CardTitle>Your active plan</CardTitle>
                    </div>
                    {activePlan && <Badge tone="primary">{activePlan.type}</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  {activePlan ? (
                    <>
                      <h3 className="mb-1 font-serif text-lg font-semibold text-foreground">
                        {activePlan.title}
                      </h3>
                      <p className="mb-4 text-sm text-text-muted">
                        Created {new Date(activePlan.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button asChild variant="outline">
                          <Link href={activePlan.type === 'mental' ? `/mental/report/${activePlan.id}` : `/fitness/plan/${activePlan.id}`}>
                            View full plan <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="primary">
                          <Link href="/coach">
                            <MessageCircle className="size-4" /> Chat with your coach
                          </Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border-strong bg-surface-sunken px-6 py-10 text-center">
                      <p className="mb-1 text-sm font-medium text-foreground">No active plan yet</p>
                      <p className="mb-4 text-sm text-text-muted">Create one and your coach will track it alongside everything else it knows about you.</p>
                      <Button asChild variant="primary">
                        <Link href="/fitness/form">
                          <Plus className="size-4" /> Create your first plan
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="size-5 text-gold-500" />
                      <CardTitle>Today&apos;s check-in</CardTitle>
                    </div>
                    <Badge tone="gold">{streak} day{streak === 1 ? '' : 's'}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-text-body">
                    Two minutes. Your mentor remembers all of it.
                  </p>
                  <Button asChild variant="primary" className="w-full">
                    <Link href="/today">Check in</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="size-5 text-accent" />
                    <CardTitle>Ask your mentor</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-text-body">
                    Advice, decisions, or just a check-in — it knows your whole picture.
                  </p>
                  <Button asChild variant="accent" className="w-full">
                    <Link href="/coach">Open chat</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="size-5 text-primary" />
                  <CardTitle>Recent activity</CardTitle>
                </div>
                {recentCheckins.length > 0 && (
                  <Link href="/progress" className="text-sm text-text-muted hover:text-foreground">
                    View all →
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentCheckins.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-strong bg-surface-sunken px-6 py-10 text-center">
                  <p className="mb-1 text-sm font-medium text-foreground">Nothing logged yet</p>
                  <p className="text-sm text-text-muted">
                    Tell your coach about a workout or how you&apos;re feeling — it will show up here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentCheckins.map((c) => {
                    const Icon = TYPE_ICON[c.type];
                    return (
                      <div key={c.id} className="flex items-center gap-3 rounded-md border border-border bg-surface-sunken p-3">
                        <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                          <Icon className="size-4" />
                        </div>
                        <p className="min-w-0 flex-1 truncate text-sm text-text-body">{c.summary}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </StaggerItem>

        {plans.length > 1 && (
          <div className="mt-4">
            <Link href="/profile" className="text-sm text-text-muted hover:text-foreground">
              View all {plans.length} plans in your profile →
            </Link>
          </div>
        )}
      </Stagger>
    </div>
  );
}
