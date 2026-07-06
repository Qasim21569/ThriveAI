'use client';

import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const CATEGORIES: { title: string; items: string[]; note: string }[] = [
  {
    title: 'Mental health indicators',
    items: [
      'Anxiety levels and how they show up day to day',
      'Physical symptoms like a racing heartbeat or dizziness',
      'Intrusive thoughts and how they affect you',
    ],
    note: 'These indicators help surface emotional distress and guide early support.',
  },
  {
    title: 'Lifestyle and physical health',
    items: [
      'Sleep patterns and quality of rest',
      'Eating habits and meal frequency',
      'Caffeine, alcohol, and smoking habits',
    ],
    note: 'These habits significantly influence psychological wellbeing.',
  },
  {
    title: 'Temperament and emotional regulation',
    items: [
      'Day-to-day temperament and mood shifts',
      'How comfortable you are expressing emotions',
      'Your emotional awareness and intelligence',
    ],
    note: 'These insights reflect emotional stability and how you relate to others.',
  },
  {
    title: 'Social functioning and personality',
    items: [
      'How outgoing you are in familiar settings',
      'How you adapt to unfamiliar environments',
      'Your social comfort zones and boundaries',
    ],
    note: 'These elements reflect social adaptability and tendencies.',
  },
];

const STEPS: { title: string; desc: string }[] = [
  { title: 'Complete the questionnaire', desc: 'Answer thoughtful questions about your mental health, lifestyle, emotional regulation, and social functioning.' },
  { title: 'AI analysis', desc: 'Your coach analyzes your responses to identify patterns, potential concerns, and strengths.' },
  { title: 'Receive your report', desc: 'Get a clear report covering your current state, areas to improve, and practical next steps.' },
  { title: 'Put it into practice', desc: 'Use the insights and recommendations to make positive, lasting changes.' },
];

const MentalLanding = () => {
  return (
    <section id="mental-mode" className="mx-auto max-w-content px-6 py-16 md:py-20">
      {/* Header */}
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <Badge tone="accent" dot>
          Mental wellbeing
        </Badge>
        <h1 className="mt-5 font-serif text-4xl font-semibold tracking-[-0.02em] text-foreground md:text-5xl">
          A calmer, clearer mind
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-text-body">
          Personalized guidance for self-awareness, emotional balance, and resilience.
        </p>
      </div>

      {/* About */}
      <Card className="mx-auto mb-16 max-w-3xl p-8 md:p-10">
        <h2 className="font-serif text-2xl font-semibold text-foreground">About mental wellbeing</h2>
        <div className="mt-4 space-y-3 text-text-body">
          <p>
            A thoughtful questionnaire helps you gain insight into your mental health, lifestyle, and
            emotional patterns.
          </p>
          <p>
            Your responses shape a personalized report about your current state, areas for growth,
            and practical solutions.
          </p>
          <p>
            This isn&apos;t a diagnostic tool. It&apos;s a gateway to self-awareness. Your data is
            handled with care and privacy.
          </p>
        </div>
      </Card>

      {/* What we assess */}
      <div className="mx-auto mb-16 max-w-3xl">
        <h2 className="mb-10 text-center font-serif text-2xl font-semibold text-foreground md:text-3xl">
          What we look at
        </h2>
        <div className="grid gap-4">
          {CATEGORIES.map((cat) => (
            <Card key={cat.title} className="p-6 md:p-7">
              <h3 className="text-lg font-semibold text-foreground">{cat.title}</h3>
              <ul className="mt-3 space-y-2 text-text-body">
                {cat.items.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-l-2 border-accent/40 pl-3 text-sm italic text-text-muted">
                {cat.note}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="mx-auto mb-16 max-w-3xl">
        <h2 className="mb-10 text-center font-serif text-2xl font-semibold text-foreground md:text-3xl">
          How it works
        </h2>
        <div className="grid gap-4">
          {STEPS.map((step, i) => (
            <Card key={step.title} className="flex-row items-start gap-5 p-6 md:p-7">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-lg font-semibold text-primary">
                {i + 1}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 leading-relaxed text-text-body">{step.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Important note */}
      <Alert tone="info" className="mx-auto mb-16 max-w-3xl">
        <Info />
        <div>
          <AlertTitle>An important note</AlertTitle>
          <AlertDescription>
            This assessment is not a diagnostic tool and doesn&apos;t replace professional medical
            advice. If you&apos;re experiencing severe symptoms, please reach out to a qualified
            healthcare provider.
          </AlertDescription>
        </div>
      </Alert>

      {/* CTA */}
      <div className="text-center">
        <Button asChild variant="primary" size="lg">
          <Link href="/mental/form">
            Take the assessment <ArrowRight className="size-[18px]" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default MentalLanding;
