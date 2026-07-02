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
