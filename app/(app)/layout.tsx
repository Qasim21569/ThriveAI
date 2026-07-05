import { AppNav } from '@/components/app/app-nav';
import { PageTransition } from '@/components/motion/page-transition';
import { AppShell } from '@/components/app/app-shell';

/**
 * Shared shell for every authenticated app page (dashboard, coach,
 * progress, profile, settings). A route group — the "(app)" folder name
 * doesn't appear in the URL, so /dashboard, /coach etc. are unchanged.
 * Each page still owns its own auth check (shows AuthModal if signed
 * out) — this layout only owns the persistent nav around them.
 *
 * AppShell is a client wrapper that mounts WalkthroughProvider without
 * converting this server component layout to a client component.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <AppShell>
        <PageTransition>{children}</PageTransition>
      </AppShell>
    </div>
  );
}
