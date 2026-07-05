'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, Send, CheckCircle2, MessageCircle, Brain } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import type { User } from 'firebase/auth';
import { saveCheckin, getRecentCheckins } from '@/lib/firebase/checkins';
import { buildMentorContext } from '@/lib/coach/context';
import { runExtraction } from '@/lib/coach/extraction-client';
import { buildDailyPrompts } from '@/lib/checkins/prompts';
import { computeStreak } from '@/lib/checkins/streak';
import type { LifeModel } from '@/lib/lifemodel/types';
import AuthModal from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const FALLBACK_REACTION = 'Logged. Showing up daily is the whole game — see you tomorrow.';

export default function TodayPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [loggedToday, setLoggedToday] = useState(false);
  const [model, setModel] = useState<LifeModel | null>(null);
  const [contextBlock, setContextBlock] = useState('');
  const [entry, setEntry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      setUser(u);
      try {
        const idToken = await u.getIdToken();
        const [ctx, checkins] = await Promise.all([
          buildMentorContext(u.uid, idToken),
          getRecentCheckins(u.uid, 60),
        ]);
        setModel(ctx.model);
        setContextBlock(ctx.contextBlock);
        setPrompts(buildDailyPrompts(ctx.model));
        const today = new Date().toISOString().slice(0, 10);
        setStreak(computeStreak(checkins.map((c) => c.createdAt), today));
        setLoggedToday(checkins.some((c) => c.type === 'daily' && c.createdAt.slice(0, 10) === today));
      } catch (error) {
        console.error('Error loading today page:', error);
        setPrompts(buildDailyPrompts(null));
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const handleSubmit = async () => {
    const text = entry.trim();
    if (!text || submitting || !user) return;
    setSaveError(false);
    setSubmitting(true);
    const wasLoggedToday = loggedToday;
    try {
      // The raw log is truth: persist first, AI afterwards.
      try {
        await saveCheckin(user.uid, 'daily', text.slice(0, 1500));
      } catch (error) {
        console.error('Failed to save check-in:', error);
        setSaveError(true);
        return;
      }
      setLoggedToday(true);
      setStreak((s) => (s === 0 ? 1 : s + (wasLoggedToday ? 0 : 1)));

      const idToken = await user.getIdToken();
      const checkinText = `Daily check-in.\nPrompts shown: ${prompts.join(' | ')}\nAnswer: ${text}`;
      const [reactionResult] = await Promise.allSettled([
        fetch('/api/coach/react', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ checkinText: text, contextBlock: contextBlock || undefined }),
        }).then(async (res) => {
          if (!res.ok) throw new Error(`React failed: ${res.status}`);
          return (await res.json()).reaction as string;
        }),
        model ? runExtraction(user.uid, idToken, model, checkinText) : Promise.resolve(null),
      ]);
      setReaction(reactionResult.status === 'fulfilled' ? reactionResult.value : FALLBACK_REACTION);
    } catch (error) {
      console.error('Check-in submit error:', error);
      setReaction(FALLBACK_REACTION);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="mb-6 h-9 w-48" />
        <Skeleton className="mb-3 h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 py-10">
      <AuthModal open={showAuthModal} onClose={() => router.push('/')} onSuccess={() => setShowAuthModal(false)} />

      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-accent">Today</span>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-foreground">Daily check-in</h1>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5"
            aria-label={`${streak} day streak`}
          >
            <Flame className="size-4 text-accent" />
            <span className="text-sm font-semibold text-foreground">{streak}</span>
          </div>
        </div>

        {reaction ? (
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-2 text-success">
                <CheckCircle2 className="size-5" />
                <span className="text-sm font-medium">Logged for today</span>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-text-body">{reaction}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/coach"><MessageCircle className="size-4" /> Talk it through</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/brain"><Brain className="size-4" /> See your brain</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 space-y-2">
              {prompts.map((p) => (
                <p key={p} className="rounded-lg border border-border bg-surface-sunken px-4 py-2.5 text-sm text-text-body">
                  {p}
                </p>
              ))}
            </div>
            <Textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="Write it however it comes out — a sentence is enough."
              className="min-h-[140px]"
              disabled={submitting}
              autoFocus
            />
            <Button
              onClick={handleSubmit}
              variant="primary"
              className="mt-3 w-full"
              disabled={submitting || !entry.trim()}
            >
              {submitting ? 'Logging…' : (<><Send className="size-4" /> Log today</>)}
            </Button>
            {saveError && (
              <p className="mt-3 text-center text-xs text-destructive">
                Couldn&apos;t save your check-in — check your connection and try again.
              </p>
            )}
            {loggedToday && (
              <p className="mt-3 text-center text-xs text-text-muted">
                Already logged today — this adds to it.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
