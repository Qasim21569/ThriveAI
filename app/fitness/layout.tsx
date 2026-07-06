import { AppNav } from '@/components/app/app-nav';

export default function FitnessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      {children}
    </div>
  );
}
