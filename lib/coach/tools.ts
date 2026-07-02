import { z } from 'zod';

/**
 * The one tool the coach can call in Phase 3. The model never touches
 * Firestore directly — it proposes a call with these arguments, our
 * server validates the shape, and the client executes the actual write.
 */
export const logCheckinArgsSchema = z.object({
  type: z.enum(['workout', 'mood', 'note']),
  summary: z.string().trim().min(1).max(300),
});

export type LogCheckinArgs = z.infer<typeof logCheckinArgsSchema>;

/**
 * The OpenAI-compatible tool definition sent to Groq. This is the JSON
 * schema the model reads to decide when and how to call the function —
 * it never sees our zod schema, only this description.
 */
export const COACH_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'log_checkin',
      description:
        'Log a check-in when the user reports completing a workout, describes their ' +
        "current mood, or shares something worth remembering. Call this whenever the " +
        "user reports something concrete — don't ask permission first, just log it and " +
        'the user will see a confirmation.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['workout', 'mood', 'note'],
            description: 'What kind of check-in this is',
          },
          summary: {
            type: 'string',
            description:
              'A short summary of what happened, e.g. "Chest and triceps, felt strong" ' +
              'or "Feeling anxious about exams this week"',
          },
        },
        required: ['type', 'summary'],
      },
    },
  },
] as const;

const TOOL_CALL_MARKER = '__TOOL_CALL__:';

export interface ExtractedToolCall {
  text: string;
  toolCall: { name: string; arguments: unknown } | null;
}

/**
 * Split a raw stream result (from /api/coach/chat) into the visible text
 * and, if present, the tool call payload appended as a sentinel line.
 * Shared between the chat UI and the eval harness so both parse the wire
 * format the same way.
 */
export function extractToolCall(raw: string): ExtractedToolCall {
  const markerIndex = raw.indexOf(TOOL_CALL_MARKER);
  if (markerIndex === -1) return { text: raw, toolCall: null };

  const text = raw.slice(0, markerIndex).trim();
  const jsonPart = raw.slice(markerIndex + TOOL_CALL_MARKER.length).trim();
  try {
    return { text, toolCall: JSON.parse(jsonPart) };
  } catch {
    return { text, toolCall: null };
  }
}
