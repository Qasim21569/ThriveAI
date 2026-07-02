'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Dumbbell, Smile, StickyNote } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import { getRecentCheckins, type Checkin, type CheckinType } from '@/lib/firebase/checkins';
import AuthModal from '@/components/auth/AuthModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TYPE_ICON: Record<CheckinType, React.ComponentType<{ className?: string }>> = {
  workout: Dumbbell,
  mood: Smile,
  note: StickyNote,
};

const TYPE_TONE: Record<CheckinType, 'primary' | 'accent' | 'neutral'> = {
  workout: 'primary',
  mood: 'accent',
  note: 'neutral',
};

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ProgressPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<Checkin[]>([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      try {
        const data = await getRecentCheckins(user.uid, 50);
        setCheckins(data);
      } catch (error) {
        console.error('Error loading check-ins:', error);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const workoutCount = checkins.filter((c) => c.type === 'workout').length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
          <p className="text-text-muted">Loading your progress…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <AuthModal open={showAuthModal} onClose={() => router.push('/')} onSuccess={() => setShowAuthModal(false)} />

      <div className="mx-auto max-w-app">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            aria-label="Back to dashboard"
            className="inline-flex size-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-accent">Progress</span>
            <h1 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
              Your check-in history
            </h1>
          </div>
        </div>

        {checkins.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="font-mono text-2xl font-semibold text-foreground">{checkins.length}</div>
              <div className="text-xs text-text-muted">total check-ins</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="font-mono text-2xl font-semibold text-foreground">{workoutCount}</div>
              <div className="text-xs text-text-muted">workouts logged</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="font-mono text-2xl font-semibold text-foreground">
                {formatRelative(checkins[0].createdAt)}
              </div>
              <div className="text-xs text-text-muted">last check-in</div>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {checkins.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border-strong bg-surface-sunken px-6 py-12 text-center">
                <p className="mb-1 text-text-muted">No check-ins yet.</p>
                <p className="text-sm text-text-muted">
                  Tell your coach about a workout or how you&apos;re feeling — it&apos;ll show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {checkins.map((c) => {
                  const Icon = TYPE_ICON[c.type];
                  return (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 rounded-md border border-border bg-surface-sunken p-3"
                    >
                      <div className="mt-0.5 flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge tone={TYPE_TONE[c.type]}>{c.type}</Badge>
                          <span className="text-xs text-text-muted">{formatRelative(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-text-body">{c.summary}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
