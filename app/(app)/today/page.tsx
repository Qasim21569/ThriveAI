'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
import { PageHeader } from '@/components/ui/page-header';
import { MentorVoice } from '@/components/ui/mentor-voice';
import { FadeIn } from '@/components/motion/fade-in';

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
        {/* PageHeader with streak chip as right-aligned children */}
        <PageHeader
          eyebrow="Today"
          title="Daily check-in"
          className="mb-6"
        >
          {/* Streak chip — gold tokens (celebration hue, not interaction accent) */}
          <div
            id="wt-today-streak"
            className="flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-50 px-3 py-1.5"
            aria-label={`${streak} day streak`}
          >
            {/* Sanctioned inline motion element: flame does one 1.06 scale pulse on streak increment.
                Keyed on streak so it re-mounts (and re-animates) each time the value changes.
                motion.span is the right tool here per motion-guidelines "streak increment" entry. */}
            <motion.span
              key={`flame-${streak}`}
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center"
            >
              <Flame className="size-4 text-gold-500" />
            </motion.span>
            {/* Sanctioned inline motion element: number ticks with 200ms y-flip on streak increment.
                Keyed on streak value so each new number flips in from below, then settles.
                motion.span is the right tool here per motion-guidelines "streak increment" entry. */}
            <motion.span
              key={`count-${streak}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="text-sm font-semibold text-gold-500"
            >
              {streak}
            </motion.span>
          </div>
        </PageHeader>

        {reaction ? (
          // Logged-state card enters with FadeIn
          <FadeIn>
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center gap-2 text-success">
                  <CheckCircle2 className="size-5" />
                  <span className="text-sm font-medium">Logged for today</span>
                </div>
                {/* Mentor reaction in MentorVoice rule variant — the mentor's hand */}
                <MentorVoice rule className="mb-6 text-sm">
                  {reaction}
                </MentorVoice>
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
          </FadeIn>
        ) : (
          <>
            {/* Prompt chips at sunken elevation (surface-sunken well per elevation ladder) */}
            <div id="wt-today-prompts" className="mb-4 space-y-2">
              {prompts.map((p) => (
                <p key={p} className="rounded-lg border border-border bg-surface-sunken px-4 py-2.5 text-sm text-text-body">
                  {p}
                </p>
              ))}
            </div>
            <div id="wt-today-entry">
              <Textarea
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="Write it however it comes out — a sentence is enough."
                className="min-h-[140px]"
                disabled={submitting}
                autoFocus
              />
            </div>
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
