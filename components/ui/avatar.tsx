import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Avatar — round image with initials fallback. Warm coffee tint fallback.
 * Lightweight (no extra radix dependency).
 */
const sizeMap = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
} as const

function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  src?: string | null
  alt?: string
  fallback?: string
  size?: keyof typeof sizeMap
}) {
  const [error, setError] = React.useState(false)
  const showImg = src && !error
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary-soft font-medium text-coffee-700 select-none",
        sizeMap[size],
        className
      )}
      {...props}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={alt}
          className="size-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span>{fallback?.slice(0, 2).toUpperCase() || "?"}</span>
      )}
    </div>
  )
}

export { Avatar }
