'use client';

import { Briefcase } from 'lucide-react';
import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function CareerPage() {
  return (
    <PlaceholderScreen
      eyebrow="Coming soon"
      title="Career coaching"
      description="Interview prep, skill-building, and a roadmap to accelerate your growth — this coaching area is in development. Check back soon."
      Icon={Briefcase}
      iconClass="text-mode-career bg-coffee-50"
      redirectTo="/#modes"
    />
  );
}
