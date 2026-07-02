import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input — single-line text field. 1px border, warm surface, terracotta focus ring.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-md border border-input bg-surface px-3.5 py-1 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow,border-color] duration-base ease-standard",
        "placeholder:text-text-muted/80 selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "focus-visible:border-accent focus-visible:ring-ring/35 focus-visible:ring-[3px]",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/25",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface-sunken",
        className
      )}
      {...props}
    />
  )
}

export { Input }
