import { z } from 'zod';

/**
 * Schemas for validating what the model returns, not what the client sends.
 * Paired with Groq's `response_format: { type: 'json_object' }`, these
 * replace the old regex-based JSON "repair" hack: json_object mode
 * guarantees syntactically valid JSON, and these schemas catch the
 * remaining failure mode — valid JSON with the wrong shape. Nested objects
 * use `.passthrough()` so a field the model adds that we don't use doesn't
 * cause a rejection; only the fields the app actually reads are required.
 */

export const fitnessPlanSchema = z
  .object({
    diet: z
      .object({
        meals: z.array(z.record(z.string(), z.unknown())).optional(),
        recommendations: z.array(z.string()).optional(),
        restrictions: z.array(z.string()).optional(),
      })
      .passthrough(),
    workouts: z.array(z.record(z.string(), z.unknown())),
    goals: z
      .object({
        short_term: z.array(z.string()).optional(),
        long_term: z.array(z.string()).optional(),
        metrics: z.record(z.string(), z.unknown()).optional(),
      })
      .passthrough(),
    weekly_routine: z.record(z.string(), z.unknown()).optional(),
    health_summary: z
      .object({
        overview: z.string().optional(),
        recommendations: z.array(z.string()).optional(),
        cautions: z.array(z.string()).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const fitnessAssessmentSchema = z
  .object({
    greeting: z.string().optional(),
    overview: z
      .object({
        summary: z.string().optional(),
        strengths: z.array(z.string()).optional(),
        areas_to_improve: z.array(z.string()).optional(),
      })
      .passthrough()
      .optional(),
    training_recommendations: z.record(z.string(), z.unknown()).optional(),
    nutrition_recommendations: z.record(z.string(), z.unknown()).optional(),
    action_plan: z.record(z.string(), z.unknown()).optional(),
    personal_insights: z.array(z.string()).optional(),
  })
  .passthrough();

export const mentalAssessmentSchema = z
  .object({
    greeting: z.string().optional(),
    overview: z
      .object({
        summary: z.string().optional(),
        strengths: z.array(z.string()).optional(),
        challenges: z.array(z.string()).optional(),
      })
      .passthrough()
      .optional(),
    areas: z.record(z.string(), z.unknown()).optional(),
    recommendations: z.record(z.string(), z.unknown()).optional(),
    action_plan: z.record(z.string(), z.unknown()).optional(),
    personal_insights: z.array(z.string()).optional(),
  })
  .passthrough();
