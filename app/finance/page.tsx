'use client';

import { Wallet } from 'lucide-react';
import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function FinancePage() {
  return (
    <PlaceholderScreen
      eyebrow="Coming soon"
      title="Financial guidance"
      description="Budget optimization, saving strategies, and planning tailored to your goals — this coaching area is in development. Check back soon."
      Icon={Wallet}
      iconClass="text-mode-finance bg-sage-50"
      redirectTo="/#modes"
    />
  );
}
