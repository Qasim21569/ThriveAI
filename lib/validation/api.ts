import { z } from 'zod';

/**
 * Request-body schemas for the AI API routes. These validate the *shape* of
 * the payload (required fields + types), not just truthiness, and mirror the
 * client-side forms. Extra fields are allowed (`.passthrough()`) so optional
 * context the model can use is not rejected.
 */

const nonEmpty = z.string().trim().min(1);

// Sent by the fitness questionnaire to /api/fitness/assessment and /api/llm
export const fitnessRequestSchema = z
  .object({
    age: nonEmpty,
    height: nonEmpty,
    weight: nonEmpty,
    gender: nonEmpty,
    primaryGoal: nonEmpty,
    timeframe: nonEmpty,
    activityLevel: nonEmpty,
    experienceLevel: nonEmpty,
    workoutDaysPerWeek: nonEmpty,
    workoutDuration: nonEmpty,
    dietPreference: nonEmpty,
    // Free-text fields — genuinely optional, the prompt builder already
    // falls back to sensible defaults ("None", "Various exercises") when empty.
    preferredExercises: z.string().optional(),
    dislikedExercises: z.string().optional(),
    injuries: z.string().optional(),
    healthConditions: z.string().optional(),
    additionalInfo: z.string().optional(),
  })
  .passthrough();

// Sent by the mental wellbeing questionnaire to /api/mental/assessment
export const mentalRequestSchema = z
  .object({
    sleepPattern: nonEmpty,
    mealFrequency: nonEmpty,
    caffeineIntake: nonEmpty,
    smokingHabit: nonEmpty,
    alcoholConsumption: nonEmpty,
    dayToDay: nonEmpty,
    emotionalExpression: nonEmpty,
    emotionalComfort: nonEmpty,
    anxietyLevel: nonEmpty,
    physicalAnxiety: nonEmpty,
    intrusiveThoughts: nonEmpty,
    thoughtPatterns: nonEmpty,
    familiarSettings: nonEmpty,
    unfamiliarSettings: nonEmpty,
    stressors: nonEmpty,
    copingStrategies: nonEmpty,
    additionalInfo: z.string().optional(),
  })
  .passthrough();

// Sent by the coach chat UI to /api/coach/chat
export const coachChatRequestSchema = z
  .object({
    message: nonEmpty,
    // The fully-assembled, multi-layer context block — see lib/coach/context.ts
    contextBlock: z.string().optional(),
    history: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        }),
      )
      .max(20)
      .optional(),
  })
  .passthrough();

// Sent by the client to /api/coach/extract to update the Life Model
export const extractRequestSchema = z
  .object({
    conversationText: nonEmpty.max(8000),
    // The client's own current Life Model, passed through to the extraction
    // prompt so the model can reference existing goal/thread ids. Shape is
    // not validated here — it is client-owned data that only flows back
    // into the prompt, never into Firestore from this route.
    lifeModel: z.unknown(),
  })
  .passthrough();

export type FitnessRequest = z.infer<typeof fitnessRequestSchema>;
export type MentalRequest = z.infer<typeof mentalRequestSchema>;
export type CoachChatRequest = z.infer<typeof coachChatRequestSchema>;
export type ExtractRequest = z.infer<typeof extractRequestSchema>;
