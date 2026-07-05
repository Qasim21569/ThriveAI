import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * PageHeader — standardizes every in-app page title area.
 *
 * Layout:
 *   - Left: optional eyebrow (mono ds-label), serif title, optional sub text
 *   - Right: optional children (action buttons, etc.)
 * On mobile the two columns stack (eyebrow/title/sub above, actions below).
 *
 * Type scale (per theme decision):
 *   - Title: serif 600, 30px mobile / 36px desktop, −0.015em tracking
 *   - Eyebrow: existing ds-label mono treatment
 *   - Sub: text-muted, sans 14px/1.6
 */
export interface PageHeaderProps {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  sub?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

function PageHeader({ eyebrow, title, sub, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      {/* Left: eyebrow + title + sub */}
      <div className="flex flex-col gap-1">
        {eyebrow ? (
          <p className="ds-label">{eyebrow}</p>
        ) : null}
        <h1
          className={cn(
            "font-serif font-semibold tracking-[-0.015em] text-foreground",
            "text-3xl md:text-4xl"
          )}
        >
          {title}
        </h1>
        {sub ? (
          <p className="text-sm leading-relaxed text-muted-foreground mt-0.5">
            {sub}
          </p>
        ) : null}
      </div>

      {/* Right: action slot (stacks below on mobile) */}
      {children ? (
        <div className="flex shrink-0 items-center gap-2 sm:mt-1">
          {children}
        </div>
      ) : null}
    </div>
  )
}

export { PageHeader }
