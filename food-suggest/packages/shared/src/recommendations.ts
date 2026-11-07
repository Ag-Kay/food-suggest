import { z } from 'zod';

import type { MealCard } from './meals';
import { MealSlot } from './enums';
import { ProfileInput } from './profile';

export const RecommendationRequest = z
  .object({
    /** The on-device profile (anonymous users). Signed-in users will use their stored profile (M4). */
    profile: ProfileInput,
    slot: MealSlot.optional(),
    limit: z.number().int().min(1).max(20).default(10),
  })
  .strict();
export type RecommendationRequest = z.infer<typeof RecommendationRequest>;

export interface Recommendation {
  meal: MealCard;
  /** 0–100, relative ranking only. */
  score: number;
  /** Plain-language reasons, built from real nutrition values (never from AI). */
  reasons: string[];
  /** Things to watch, e.g. "Leave out the shito: it contains fish." */
  cautions: string[];
}

export interface RecommendationResponse {
  items: Recommendation[];
  /** How many meals were removed by safety and preference filters. */
  excludedCount: number;
  /** Notes about how the profile was applied (e.g. age-based adjustments). */
  notes: string[];
}
