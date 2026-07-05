import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge — small status / category pill. Mono type, subtle fill + 1px border.
 * Tones stay in the warm family.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-mono text-[11.5px] font-medium leading-none tracking-[0.04em] whitespace-nowrap px-2.5 py-1 [&_svg]:size-3 [&_svg]:pointer-events-none",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-text-body border-border",
        primary: "bg-primary-soft text-coffee-700 border-coffee-100",
        accent: "bg-accent-soft text-terracotta-600 border-terracotta-100",
        success: "bg-success-soft text-sage-500 border-sage-500/25",
        warning: "bg-warning-soft text-amber-500 border-amber-500/30",
        destructive: "bg-destructive-soft text-clay-600 border-clay-500/25",
        gold: "bg-gold-50 text-gold-500 border-gold-500/30",
      },
      variant: {
        soft: "",
        solid: "border-transparent text-primary-foreground",
      },
    },
    compoundVariants: [
      { variant: "solid", tone: "neutral", className: "bg-ink-700" },
      { variant: "solid", tone: "primary", className: "bg-primary" },
      { variant: "solid", tone: "accent", className: "bg-accent" },
      { variant: "solid", tone: "success", className: "bg-success" },
      { variant: "solid", tone: "warning", className: "bg-warning" },
      { variant: "solid", tone: "destructive", className: "bg-destructive" },
      { variant: "solid", tone: "gold", className: "bg-gold-500" },
    ],
    defaultVariants: {
      tone: "neutral",
      variant: "soft",
    },
  }
)

function Badge({
  className,
  tone,
  variant,
  dot = false,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    dot?: boolean
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "span"
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ tone, variant, className }))}
      {...props}
    >
      {dot ? (
        <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      ) : null}
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants }
