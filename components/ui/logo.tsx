import { cn } from '@/lib/utils';

/**
 * Theme-adaptive brand mark. Colors come from semantic tokens, so the logo
 * recolors itself in dark mode (the old static SVG hardcoded the retired
 * coffee/terracotta palette). Wordmark renders as HTML text in the display
 * serif rather than SVG text, so it always matches the loaded font.
 */
export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <svg viewBox="0 0 48 48" className={cn('size-7 shrink-0', markClassName)} aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill="rgb(var(--foreground))" />
        <path d="M24 33 V20" stroke="rgb(var(--background))" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M24 22 C24 15.5 18.5 12.5 14.5 12.5 C14.5 19 19.5 22 24 22 Z" fill="rgb(var(--background))" />
        <path d="M24 25 C24 19.5 28.8 16.8 32.5 16.8 C32.5 22.6 28 25 24 25 Z" fill="rgb(var(--accent))" />
      </svg>
      <span className="font-serif text-[21px] leading-none tracking-tight text-foreground">
        ThriveAI
      </span>
    </span>
  );
}
