'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { OnbordaProvider, Onborda, useOnborda } from 'onborda';
import { WalkthroughCard } from './walkthrough-card';
import { walkthroughTours } from './tours';

const STORAGE_KEYS: Record<string, string> = {
  '/today': 'walkthrough.today.done',
  '/brain': 'walkthrough.brain.done',
};

const TOUR_NAMES: Record<string, string> = {
  '/today': 'today',
  '/brain': 'brain',
};

/**
 * Inner component — reads localStorage and starts the appropriate tour.
 * Must be inside OnbordaProvider to call useOnborda().
 * Reduced-motion: cardTransition={{ duration: 0 }} on <Onborda> means the card
 * animates with zero duration, satisfying the "no transitions" requirement.
 * The backdrop overlay still uses framer-motion opacity, which collapses to
 * instant under MotionConfig reducedMotion="user" (already set in providers.tsx).
 */
function WalkthroughController({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { startOnborda, isOnbordaVisible } = useOnborda();
  const startedRef = useRef<string | null>(null);

  // Mark done when tour is closed (covers skip and Done button).
  // We watch isOnbordaVisible going false after we started a tour.
  const activeTourKey = startedRef.current ? STORAGE_KEYS[startedRef.current] : null;
  const prevVisible = useRef(false);

  useEffect(() => {
    if (prevVisible.current && !isOnbordaVisible && activeTourKey) {
      try {
        localStorage.setItem(activeTourKey, '1');
      } catch {
        // localStorage may be unavailable in some contexts — fail silently.
      }
    }
    prevVisible.current = isOnbordaVisible;
  }, [isOnbordaVisible, activeTourKey]);

  // Start tour on first visit to a walkthrough-enabled route.
  useEffect(() => {
    const tourName = TOUR_NAMES[pathname];
    if (!tourName) return;

    const storageKey = STORAGE_KEYS[pathname];
    let done = false;
    try {
      done = !!localStorage.getItem(storageKey);
    } catch {
      // localStorage unavailable — skip the tour gracefully.
      done = true;
    }

    if (done) return;

    // Small delay so the page has rendered its target elements.
    const timer = setTimeout(() => {
      // Only start when every step target exists in the DOM (a fresh account
      // may not have a timeline yet, etc.) — a tour pointing at a missing
      // element strands the user mid-walkthrough. Not marking done: it
      // retries on a later visit once the page has its content.
      const tour = walkthroughTours.find((t) => t.tour === tourName);
      const allTargetsPresent = tour?.steps.every((s) => document.querySelector(s.selector));
      if (!allTargetsPresent) return;
      startedRef.current = pathname;
      startOnborda(tourName);
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <>{children}</>;
}

/**
 * WalkthroughProvider — wraps the app shell with Onborda.
 * Place inside the (app) layout client wrapper, around children.
 *
 * cardTransition={{ duration: 0 }} disables all card enter/move animations
 * (satisfies the reduced-motion requirement without needing to detect the media
 * query — zero duration is always instant).
 */
export function WalkthroughProvider({ children }: { children: ReactNode }) {
  return (
    <OnbordaProvider>
      <Onborda
        steps={walkthroughTours}
        shadowRgb="58, 42, 26"
        shadowOpacity="0.35"
        cardComponent={WalkthroughCard}
        cardTransition={{ duration: 0 }}
      >
        <WalkthroughController>{children}</WalkthroughController>
      </Onborda>
    </OnbordaProvider>
  );
}
