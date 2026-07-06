/**
 * Celebration moments (motion guidelines: "Celebration register — used
 * exactly twice"). One warm confetti burst, guarded so each moment fires
 * once: streak milestones once per milestone, onboarding once ever.
 * No-ops under prefers-reduced-motion and during SSR.
 */

// Warm-palette hex equivalents of --gold-500 / --terracotta-500 / --sage-500.
const PARTICLE_COLORS = ['#B2801A', '#B05830', '#6E7C5A'];

export function isStreakMilestone(streak: number): boolean {
  if (streak === 3 || streak === 7 || streak === 14) return true;
  return streak >= 30 && streak % 30 === 0;
}

export function celebrate(kind: 'streak' | 'onboarding', milestone?: number): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const guardKey = kind === 'streak' ? `celebrate.streak.${milestone ?? 0}` : 'celebrate.onboarding';
  try {
    if (localStorage.getItem(guardKey)) return;
    localStorage.setItem(guardKey, '1');
  } catch {
    // localStorage unavailable — celebrate anyway rather than crash.
  }

  // Dynamic import keeps canvas-confetti out of the shared bundle and out
  // of vitest's module graph.
  void import('canvas-confetti')
    .then(({ default: confetti }) => {
      void confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 32,
        ticks: 160, // ~800ms at 60fps
        origin: { y: 0.7 },
        colors: PARTICLE_COLORS,
        disableForReducedMotion: true,
      });
    })
    .catch((error) => console.error('Celebration failed to load:', error));
}
