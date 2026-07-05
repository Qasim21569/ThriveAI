'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const EASE_STANDARD = [0.4, 0, 0.2, 1] as const;
const DURATION_BASE = 0.18;

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * PageTransition — wraps page content with a fade + 4px rise entrance (180ms).
 * Keyed on the current pathname so a new animation fires on each navigation.
 * No exit animations per guidelines (SSR/back-nav honesty).
 * All motion collapses instantly under prefers-reduced-motion
 * via the global MotionConfig in providers.tsx.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: DURATION_BASE,
        ease: EASE_STANDARD,
      }}
    >
      {children}
    </motion.div>
  );
}
