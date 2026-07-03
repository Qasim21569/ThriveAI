'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Dumbbell, Plus, ArrowRight, Activity, Smile, StickyNote } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import { getUserPlans, pickActivePlan, type PlanSummary } from '@/lib/firebase/plans';
import { getRecentCheckins, type Checkin, type CheckinType } from '@/lib/firebase/checkins';
import AuthModal from '@/components/auth/AuthModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const TYPE_ICON: Record<CheckinType, React.ComponentType<{ className?: string }>> = {
  workout: Dumbbell,
  mood: Smile,
  note: StickyNote,
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

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      setDisplayName(user.displayName?.split(' ')[0] || 'there');
      try {
        const [userPlans, checkins] = await Promise.all([
          getUserPlans(user.uid),
          getRecentCheckins(user.uid, 3),
        ]);
        setPlans(userPlans);
        setRecentCheckins(checkins);
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

      <div className="mx-auto max-w-app">
        <div className="mb-8">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-accent">Dashboard</span>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.015em] text-foreground md:text-4xl">
            Welcome back, {displayName}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Active plan card */}
          <Card className="md:col-span-2">
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
                  <p className="mb-4 text-text-muted">You don&apos;t have a plan yet.</p>
                  <Button asChild variant="primary">
                    <Link href="/fitness/form">
                      <Plus className="size-4" /> Create your first plan
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coach CTA card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="size-5 text-accent" />
                <CardTitle>Ask your coach</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-text-body">
                Get advice, adjust your plan, or just check in — your coach knows your plan.
              </p>
              <Button asChild variant="accent" className="w-full">
                <Link href="/coach">Open chat</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

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
              <p className="text-sm text-text-muted">
                Nothing logged yet — tell your coach about a workout or how you&apos;re feeling.
              </p>
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

        {plans.length > 1 && (
          <div className="mt-4">
            <Link href="/profile" className="text-sm text-text-muted hover:text-foreground">
              View all {plans.length} plans in your profile →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
