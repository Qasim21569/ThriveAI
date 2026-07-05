import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button — the primary interactive control for ThriveAI.
 * Warm palette, 1px borders, soft shadows, 150ms fades.
 * Active: scale 0.98 (tactile). Focus-visible: 2px ring offset. Disabled: 50% + no shadow.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[color,background-color,box-shadow,transform] duration-fast ease-standard disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[1.1em] shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover active:bg-primary-active",
        // `primary` is an explicit alias of `default` (the coffee primary button).
        primary:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover active:bg-primary-active",
        secondary:
          "bg-surface text-foreground border border-border-strong shadow-xs hover:bg-surface-raised",
        outline:
          "bg-transparent text-primary border border-primary hover:bg-primary-soft",
        ghost:
          "bg-transparent text-text-body hover:bg-muted",
        accent:
          "bg-accent text-accent-foreground shadow-xs hover:bg-accent-hover",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive-hover",
        link: "text-primary underline underline-offset-[3px] hover:opacity-80 active:scale-100",
      },
      size: {
        sm: "h-[34px] rounded-sm px-3.5 text-[13px]",
        default: "h-10 rounded-md px-[18px] text-sm",
        lg: "h-12 rounded-md px-6 text-base",
        icon: "size-10 rounded-md",
      },
    },
    compoundVariants: [
      { variant: "link", size: "sm", className: "h-auto px-0" },
      { variant: "link", size: "default", className: "h-auto px-0" },
      { variant: "link", size: "lg", className: "h-auto px-0" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
