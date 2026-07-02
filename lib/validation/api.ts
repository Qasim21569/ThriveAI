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
    preferredExercises: nonEmpty,
    dislikedExercises: nonEmpty,
    dietPreference: nonEmpty,
    injuries: nonEmpty,
    healthConditions: nonEmpty,
    additionalInfo: nonEmpty,
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

export type FitnessRequest = z.infer<typeof fitnessRequestSchema>;
export type MentalRequest = z.infer<typeof mentalRequestSchema>;
