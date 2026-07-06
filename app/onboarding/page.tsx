'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles, ArrowRight, Pencil } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import type { User } from 'firebase/auth';
import { INTERVIEW_QUESTIONS, buildInterviewTranscript, type InterviewEntry } from '@/lib/onboarding/interview';
import { runExtraction } from '@/lib/coach/extraction-client';
import { getLifeModel } from '@/lib/firebase/lifeModel';
import { emptyLifeModel, LIFE_AREAS, type LifeModel } from '@/lib/lifemodel/types';
import { celebrate } from '@/lib/celebrate';
import AuthModal from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MentorVoice } from '@/components/ui/mentor-voice';
import { FadeIn } from '@/components/motion/fade-in';
import { Stagger, StaggerItem } from '@/components/motion/stagger';

interface Bubble {
  id: string;
  role: 'mentor' | 'user';
  text: string;
}

type Phase = 'welcome' | 'interview' | 'seeding' | 'playback' | 'fallback';

const AREA_LABEL: Record<string, string> = {
  career: 'Career',
  health: 'Health',
  mental: 'Mental',
  financial: 'Financial',
  social: 'Social',
};

// Welcome flow card content
const WELCOME_CARDS = [
  {
    heading: 'A mentor that actually knows you',
    body: "Most advice fails because it's generic. ThriveAI remembers everything you share: your goals, your blocks, your wins, and it brings that memory to every conversation.",
    eyebrow: 'Welcome',
  },
  {
    heading: 'You stay in control',
    body: "Everything your mentor learns lives on your Brain page. You can read it, edit it, or delete it any time. Your data never leaves your account without your say.",
    eyebrow: 'Transparency',
  },
  {
    heading: "Here's what happens next",
    body: "Five short questions, about five minutes. Your answers seed your mentor's memory so the first conversation feels like talking to someone who already gets the picture. You can skip at any point.",
    eyebrow: 'What to expect',
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [welcomeStep, setWelcomeStep] = useState<0 | 1 | 2>(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [entries, setEntries] = useState<InterviewEntry[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [pendingFollowup, setPendingFollowup] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [seededModel, setSeededModel] = useState<LifeModel | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) {
        setShowAuthModal(true);
        return;
      }
      setUser(u);
      // Phase stays 'welcome' — bubbles are seeded only when user advances past welcome
    });
    return unsub;
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [bubbles, phase]);

  // Seeds intro bubbles and transitions to interview phase
  const beginInterview = () => {
    setBubbles([
      { id: 'intro', role: 'mentor', text: "Hi, I'm your mentor. Five quick questions so I actually know you, then we're done. Nothing is shared; you can correct anything later." },
      { id: 'q0', role: 'mentor', text: INTERVIEW_QUESTIONS[0].question },
    ]);
    setPhase('interview');
  };

  const handleWelcomeContinue = () => {
    if (welcomeStep < 2) {
      setWelcomeStep((prev) => (prev + 1) as 0 | 1 | 2);
    } else {
      beginInterview();
    }
  };

  const finishInterview = async (finalEntries: InterviewEntry[], currentUser: User) => {
    setPhase('seeding');
    try {
      const idToken = await currentUser.getIdToken();
      const transcript = buildInterviewTranscript(finalEntries);
      if (!transcript) {
        setPhase('fallback');
        return;
      }
      const base = (await getLifeModel(currentUser.uid).catch(() => null)) ?? emptyLifeModel();
      const outcome = await runExtraction(currentUser.uid, idToken, base, transcript);
      if (outcome) {
        setSeededModel(outcome.model);
        setPhase('playback');
        celebrate('onboarding');
      } else {
        setPhase('fallback');
      }
    } catch (error) {
      console.error('Onboarding seeding failed:', error);
      setPhase('fallback');
    }
  };

  const askNext = (nextIndex: number, finalEntries: InterviewEntry[], currentUser: User) => {
    if (nextIndex < INTERVIEW_QUESTIONS.length) {
      setQuestionIndex(nextIndex);
      setBubbles((prev) => [
        ...prev,
        { id: `q${nextIndex}`, role: 'mentor', text: INTERVIEW_QUESTIONS[nextIndex].question },
      ]);
    } else {
      void finishInterview(finalEntries, currentUser);
    }
  };

  const handleAnswer = async () => {
    const text = input.trim();
    if (!text || busy || !user) return;
    setBusy(true);
    setInput('');
    const current = INTERVIEW_QUESTIONS[questionIndex];
    const questionText = pendingFollowup ?? current.question;
    setBubbles((prev) => [...prev, { id: `a-${Date.now()}`, role: 'user', text }]);
    const newEntry: InterviewEntry = { area: current.area, question: questionText, answer: text };
    const nextEntries = [...entries, newEntry];
    setEntries(nextEntries);

    try {
      if (pendingFollowup) {
        // Follow-up answered — move on unconditionally (max one follow-up per area).
        setPendingFollowup(null);
        askNext(questionIndex + 1, nextEntries, user);
      } else {
        let followup: string | null = null;
        try {
          const idToken = await user.getIdToken();
          const res = await fetch('/api/coach/followup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ area: current.area, question: current.question, answer: text }),
          });
          if (res.ok) followup = ((await res.json()) as { followup: string | null }).followup;
        } catch (error) {
          console.error('Follow-up fetch failed (skipping):', error);
        }
        if (followup) {
          setPendingFollowup(followup);
          setBubbles((prev) => [...prev, { id: `f-${Date.now()}`, role: 'mentor', text: followup as string }]);
        } else {
          askNext(questionIndex + 1, nextEntries, user);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleAnswer();
    }
  };

  // Fixed: show "1 of 5" on the first question (was showing "0 of 5")
  const progress = Math.min(questionIndex + 1, INTERVIEW_QUESTIONS.length);

  const currentCard = WELCOME_CARDS[welcomeStep];
  const isLastWelcomeStep = welcomeStep === 2;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AuthModal open={showAuthModal} onClose={() => router.push('/')} onSuccess={() => setShowAuthModal(false)} />

      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-serif text-base text-foreground">
            {phase === 'welcome' ? 'ThriveAI' : 'Meet your mentor'}
          </p>
          {phase === 'interview' && (
            <p className="text-xs text-text-muted">{progress} of {INTERVIEW_QUESTIONS.length} areas</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/today')}>
          Skip for now
        </Button>
      </header>

      {/* Welcome phase — 3-step card flow */}
      {phase === 'welcome' && (
        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="mx-auto w-full max-w-md">
            <FadeIn key={welcomeStep}>
              <div className="rounded-xl border border-border bg-surface px-6 py-8 shadow-sm">
                {/* Eyebrow */}
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-accent">
                  {currentCard.eyebrow}
                </p>

                {/* Heading — Instrument Serif, no forced weight (400-only font) */}
                <h1 className="mb-4 font-serif text-[28px] leading-tight tracking-[-0.01em] text-foreground md:text-[32px]">
                  {currentCard.heading}
                </h1>

                {/* Body */}
                <p className="mb-8 text-sm leading-relaxed text-text-body">
                  {currentCard.body}
                </p>

                {/* Progress dots */}
                <div className="mb-8 flex items-center gap-2" aria-label={`Step ${welcomeStep + 1} of 3`}>
                  {([0, 1, 2] as const).map((i) => (
                    <span
                      key={i}
                      className={[
                        'h-1.5 rounded-full transition-all',
                        i === welcomeStep
                          ? 'w-5 bg-accent'
                          : i < welcomeStep
                          ? 'w-1.5 bg-accent/40'
                          : 'w-1.5 bg-border',
                      ].join(' ')}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <Button
                    variant="primary"
                    className="w-full min-h-[44px]"
                    onClick={handleWelcomeContinue}
                  >
                    {isLastWelcomeStep ? "Let's go" : 'Continue'}
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full min-h-[44px]"
                    onClick={() => router.push('/today')}
                  >
                    Skip everything
                  </Button>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      )}

      {phase === 'interview' && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto flex max-w-xl flex-col gap-3">
              {bubbles.map((b) => (
                <FadeIn key={b.id}>
                  <div className={`flex ${b.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={[
                        'max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-sm leading-relaxed',
                        b.role === 'user'
                          ? 'rounded-br-xs bg-primary text-primary-foreground'
                          : 'rounded-bl-xs border border-border bg-surface-sunken text-text-body',
                      ].join(' ')}
                    >
                      {b.text}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
          <div className="border-t border-border bg-surface-sunken px-4 py-3.5">
            <div className="mx-auto flex max-w-xl items-end gap-2.5">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Answer in your own words…"
                className="min-h-[44px] resize-none"
                rows={1}
                disabled={busy || !user}
              />
              <Button onClick={() => void handleAnswer()} variant="primary" size="icon" disabled={busy || !input.trim()} aria-label="Send answer">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {phase === 'seeding' && (
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <Sparkles className="mx-auto mb-4 size-8 animate-pulse text-accent" />
            <p className="font-serif text-lg text-foreground">Building your picture…</p>
            <p className="mt-1 text-sm text-text-muted">Turning what you shared into your mentor&apos;s memory.</p>
          </div>
        </div>
      )}

      {phase === 'playback' && seededModel && (
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="mx-auto max-w-xl">
            <h2 className="mb-1 font-serif text-[30px] leading-tight tracking-[-0.015em] text-foreground md:text-[36px]">
              Here&apos;s my picture of you
            </h2>
            <p className="mb-6 text-sm text-text-muted">Correct anything. Your edits always win.</p>
            {seededModel.profile.identity && (
              <div className="mb-5 rounded-lg border border-border bg-surface-sunken px-4 py-3">
                <MentorVoice rule className="block text-sm leading-relaxed">
                  {seededModel.profile.identity}
                </MentorVoice>
              </div>
            )}
            <Stagger className="mb-8 space-y-3">
              {LIFE_AREAS.filter((a) => seededModel.areas[a].status).map((a) => (
                <StaggerItem key={a}>
                  <div className="rounded-lg border border-border bg-surface px-4 py-3 shadow-sm">
                    <p className="mb-0.5 font-mono text-xs uppercase tracking-[0.08em] text-accent">{AREA_LABEL[a]}</p>
                    <MentorVoice className="block text-sm leading-relaxed">
                      {seededModel.areas[a].status}
                    </MentorVoice>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="primary" className="flex-1" onClick={() => router.push('/today')}>
                Looks right, let&apos;s go <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => router.push('/brain')}>
                <Pencil className="size-4" /> Fix something
              </Button>
            </div>
          </div>
        </div>
      )}

      {phase === 'fallback' && (
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="max-w-md text-center">
            <p className="mb-2 font-serif text-lg text-foreground">I&apos;ll learn as we go</p>
            <p className="mb-6 text-sm text-text-muted">
              I couldn&apos;t finish building your picture just now, but everything you shared is safe.
              I&apos;ll pick it up from our conversations.
            </p>
            <Button variant="primary" onClick={() => router.push('/today')}>
              Start your first check-in <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
