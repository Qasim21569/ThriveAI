'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Dumbbell, Plus, ArrowRight } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import { getUserPlans, type PlanSummary } from '@/lib/firebase/plans';
import AuthModal from '@/components/auth/AuthModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('there');
  const [plans, setPlans] = useState<PlanSummary[]>([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      setDisplayName(user.displayName?.split(' ')[0] || 'there');
      try {
        const userPlans = await getUserPlans(user.uid);
        setPlans(userPlans);
      } catch (error) {
        console.error('Error loading plans:', error);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
          <p className="text-text-muted">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const activePlan = plans[0] ?? null;

  return (
    <div className="min-h-screen bg-background px-4 py-12">
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
                      <Link href={`/fitness/plan/${activePlan.id}`}>
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

        {plans.length > 1 && (
          <div className="mt-6">
            <Link href="/profile" className="text-sm text-text-muted hover:text-foreground">
              View all {plans.length} plans in your profile →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
