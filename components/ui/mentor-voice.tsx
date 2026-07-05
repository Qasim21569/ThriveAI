import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * MentorVoice — the signature typographic device for ThriveAI.
 *
 * Applied to everything the AI knows or says about the user:
 *   - Area statuses on /brain
 *   - Onboarding playback lines
 *   - Mentor reactions on /today
 *   - "Knows your goals…" straplines in chat
 *
 * `rule={false}` (default): inline span with .mentor-voice (serif italic, ink-700)
 * `rule={true}`: blockquote with .mentor-voice-rule (adds 2px accent left border + padding)
 *
 * When it's about the user, it's in the mentor's hand.
 */
export interface MentorVoiceProps {
  children: React.ReactNode
  rule?: boolean
  className?: string
}

function MentorVoice({ children, rule = false, className }: MentorVoiceProps) {
  if (rule) {
    return (
      <blockquote
        className={cn("mentor-voice-rule", className)}
      >
        {children}
      </blockquote>
    )
  }

  return (
    <span className={cn("mentor-voice", className)}>
      {children}
    </span>
  )
}

export { MentorVoice }
