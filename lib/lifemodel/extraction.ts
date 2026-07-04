import { z } from 'zod';
import { LIFE_AREAS, EVENT_TYPES } from './types';

const areaEnum = z.enum(LIFE_AREAS);
const shortText = z.string().trim().min(1);

/**
 * The structured diff the extraction model returns. Every field is
 * bounded (array caps, char caps) because this is the boundary where
 * untrusted model output enters our system — same philosophy as
 * logCheckinArgsSchema in lib/coach/tools.ts.
 */
export const extractionDiffSchema = z.object({
  events: z
    .array(
      z.object({
        area: areaEnum,
        type: z.enum(EVENT_TYPES),
        content: shortText.max(300),
      }),
    )
    .max(10)
    .default([]),
  areas: z
    .array(
      z.object({
        area: areaEnum,
        status: shortText.max(400).optional(),
        summary: shortText.max(600).optional(),
        addGoals: z
          .array(z.object({ text: shortText.max(200), targetDate: z.string().nullable() }))
          .max(5)
          .optional(),
        closeGoalIds: z.array(z.string()).max(10).optional(),
        addThreads: z.array(shortText.max(200)).max(5).optional(),
        closeThreadIds: z.array(z.string()).max(10).optional(),
      }),
    )
    .max(5)
    .default([]),
  profile: z
    .object({
      identity: shortText.max(600).optional(),
      personality: shortText.max(400).optional(),
      coachingStyle: shortText.max(400).optional(),
    })
    .optional(),
});

export type ExtractionDiff = z.infer<typeof extractionDiffSchema>;
