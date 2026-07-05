import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[96px] w-full rounded-md border border-input bg-surface px-3.5 py-2.5 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow,border-color] duration-base ease-standard",
          "placeholder:text-[rgb(var(--text-placeholder))] selection:bg-primary selection:text-primary-foreground",
          "focus-visible:border-accent focus-visible:ring-ring/35 focus-visible:ring-[3px]",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/25",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface-sunken",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea } 