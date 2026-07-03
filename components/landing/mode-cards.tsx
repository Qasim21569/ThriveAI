'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Briefcase, Wallet, Heart, ChevronRight, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/lib/firebase/authContext';
import AuthModal from '@/components/auth/AuthModal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Mode = {
  key: string;
  title: string;
  Icon: LucideIcon;
  desc: string;
  iconClass: string;
  softClass: string;
  comingSoon?: boolean;
};

const MODES: Mode[] = [
  {
    key: 'fitness',
    title: 'Fitness coaching',
    Icon: Dumbbell,
    iconClass: 'text-mode-fitness',
    softClass: 'bg-terracotta-50',
    desc: 'A personalized workout and nutrition plan tailored to your goals, level, and equipment.',
  },
  {
    key: 'mental',
    title: 'Mental wellbeing',
    Icon: Heart,
    iconClass: 'text-mode-mental',
    softClass: 'bg-primary-soft',
    desc: 'Reduce stress and build resilience through guided conversations that adapt to you.',
  },
  {
    key: 'career',
    title: 'Career development',
    Icon: Briefcase,
    iconClass: 'text-mode-career',
    softClass: 'bg-coffee-50',
    desc: 'Interview prep, skill-building, and a roadmap to accelerate your professional growth.',
    comingSoon: true,
  },
  {
    key: 'finance',
    title: 'Financial guidance',
    Icon: Wallet,
    iconClass: 'text-mode-finance',
    softClass: 'bg-sage-50',
    desc: 'Budget optimization, saving strategies, and planning tailored to your income and goals.',
    comingSoon: true,
  },
];

export const ModeCards = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const handleModeSelect = (mode: string) => {
    if (!user) {
      setSelectedMode(mode);
      setShowAuthModal(true);
    } else {
      router.push(`/${mode}`);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (selectedMode) router.push(`/${selectedMode}`);
  };

  return (
    <section id="modes" className="border-y border-border bg-surface">
      <div className="mx-auto max-w-content px-6 py-20">
        <div className="mb-11 text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-[-0.015em] text-foreground md:text-[2.375rem]">
            Choose your coaching area
          </h2>
          <p className="mt-3 text-lg text-text-muted">
            Start with one. Add the rest whenever you&apos;re ready.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {MODES.map((m) => (
            <Card
              key={m.key}
              onClick={() => handleModeSelect(m.key)}
              className="cursor-pointer p-6 transition-[box-shadow,border-color] duration-base ease-standard hover:border-border-strong hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex size-13 shrink-0 items-center justify-center rounded-md ${m.softClass} ${m.iconClass}`}
                  style={{ width: 52, height: 52 }}
                >
                  <m.Icon className="size-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl font-semibold text-foreground">{m.title}</h3>
                    {m.comingSoon && <Badge tone="neutral">Coming soon</Badge>}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-body">{m.desc}</p>
                  <div className={`mt-3.5 flex items-center gap-1 text-sm font-medium ${m.iconClass}`}>
                    {m.comingSoon ? 'Get notified' : 'Get started'} <ChevronRight className="size-4" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          message="Please sign in to access this coaching area"
        />
      )}
    </section>
  );
};
