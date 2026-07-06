import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Alert — inline feedback banner. tone + optional icon + title/description.
 */
const alertVariants = cva(
  "flex gap-3 rounded-md border p-4 [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:mt-0.5",
  {
    variants: {
      tone: {
        info: "bg-surface-raised border-border-strong text-foreground [&>svg]:text-text-muted",
        success: "bg-success-soft border-success/25 text-success [&>svg]:text-success",
        warning: "bg-warning-soft border-warning/30 text-warning [&>svg]:text-warning",
        destructive: "bg-destructive-soft border-destructive/25 text-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: { tone: "info" },
  }
)

function Alert({
  className,
  tone,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div role="alert" data-slot="alert" className={cn(alertVariants({ tone, className }))} {...props} />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("text-sm font-semibold text-current", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm leading-relaxed text-text-body", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
