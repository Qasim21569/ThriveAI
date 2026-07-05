'use client';

import { motion } from 'framer-motion';

const EASE_STANDARD = [0.4, 0, 0.2, 1] as const;
const DURATION_SLOW = 0.28;

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  viewport?: boolean;
  className?: string;
}

/**
 * FadeIn — opacity 0→1 + y 6→0 in 280ms (--duration-slow).
 * Pass `viewport` to trigger on scroll instead of on mount.
 * All motion collapses instantly under prefers-reduced-motion
 * via the global MotionConfig in providers.tsx.
 */
export function FadeIn({ children, delay = 0, viewport = false, className }: FadeInProps) {
  const initial = { opacity: 0, y: 6 };
  const animate = { opacity: 1, y: 0 };
  const transition = {
    duration: DURATION_SLOW,
    ease: EASE_STANDARD,
    delay,
  };

  if (viewport) {
    return (
      <motion.div
        className={className}
        initial={initial}
        whileInView={animate}
        viewport={{ once: true }}
        transition={transition}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={animate}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
