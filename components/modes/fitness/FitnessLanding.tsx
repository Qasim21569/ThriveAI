'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STEPS: { title: string; desc: string }[] = [
  {
    title: 'Complete your profile',
    desc: 'Share your current fitness level, any health conditions, exercise preferences, and available equipment so we understand your situation.',
  },
  {
    title: 'Define your goals',
    desc: 'Tell us what you want to achieve — weight loss, muscle gain, endurance, flexibility, or sport performance. Be as specific as you like.',
  },
  {
    title: 'Set your schedule',
    desc: 'Share your weekly availability — how many days you can train and for how long — so your plan fits your real life.',
  },
  {
    title: 'Receive your custom plan',
    desc: 'Your coach analyzes everything and builds a plan with workouts, nutrition guidance, and progress tracking tailored to you.',
  },
];

const FitnessLanding = () => {
  return (
    <section id="fitness-mode" className="mx-auto max-w-content px-6 py-16 md:py-20">
      {/* Header */}
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <Badge tone="accent" dot>
          Fitness coaching
        </Badge>
        <h1 className="mt-5 font-serif text-4xl font-semibold tracking-[-0.02em] text-foreground md:text-5xl">
          Your personal fitness coach
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-text-body">
          A coach that adapts to your goals, schedule, and preferences — and evolves as you make
          progress.
        </p>
      </div>

      {/* About */}
      <Card className="mx-auto mb-16 max-w-3xl p-8 md:p-10">
        <h2 className="font-serif text-2xl font-semibold text-foreground">About fitness coaching</h2>
        <div className="mt-4 space-y-3 text-text-body">
          <p>
            Fitness coaching creates a customized plan based on your profile, goals, and
            preferences — not a generic template.
          </p>
          <p>
            Your coach analyzes your specific needs, adapts to your progress, and provides guidance
            that grows with you.
          </p>
          <p>
            Whether you want to build muscle, lose weight, improve endurance, or feel better overall,
            you get a program made just for you.
          </p>
        </div>
      </Card>

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

      {/* CTA */}
      <div className="text-center">
        <Button asChild variant="primary" size="lg">
          <Link href="/fitness/form">
            Build my plan <ArrowRight className="size-[18px]" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default FitnessLanding;
