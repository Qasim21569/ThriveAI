import { cn } from '@/lib/utils';

/**
 * Skeleton — a pulsing placeholder shape used while real content loads.
 * Replaces full-screen spinners on pages where the final layout is known
 * ahead of time (cards, text lines) so the page doesn't visually "jump."
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
