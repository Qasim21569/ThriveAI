'use client';

import { motion, Variants } from 'framer-motion';

const EASE_STANDARD = [0.4, 0, 0.2, 1] as const;
const DURATION_SLOW = 0.28;
const STAGGER_CHILDREN = 0.04;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER_CHILDREN,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION_SLOW,
      ease: EASE_STANDARD,
    },
  },
};

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Stagger — variants-based container that staggers child items 40ms apart.
 * Pair with StaggerItem for each animated child.
 * All motion collapses instantly under prefers-reduced-motion
 * via the global MotionConfig in providers.tsx.
 */
export function Stagger({ children, className }: StaggerProps) {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem — motion child that inherits stagger timing from Stagger parent.
 */
export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
