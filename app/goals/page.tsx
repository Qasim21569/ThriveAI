'use client';

import { Target } from 'lucide-react';
import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function GoalsPage() {
  return (
    <PlaceholderScreen
      eyebrow="Not available"
      title="Goals"
      description="The goals feature isn't part of this version. For now, explore the fitness or mental wellbeing coaching areas."
      Icon={Target}
      iconClass="text-primary bg-primary-soft"
      redirectTo="/"
    />
  );
}
