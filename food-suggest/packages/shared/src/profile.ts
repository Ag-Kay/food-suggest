import { z } from 'zod';

import {
  ActivityLevel,
  Allergen,
  BudgetLevel,
  CookingSkill,
  DietType,
  Goal,
  MealSlot,
  Sex,
} from './enums';

/** Minimum supported age (product decision, see docs/DECISIONS.md). */
export const MIN_AGE = 16;
/** Users below this age get no weight-loss calorie targets. */
export const ADULT_AGE = 18;

/**
 * Personalisation profile. Every field is optional except the age gate:
 * users choose how much they share. Used both for the anonymous (on-device)
 * profile and the server-stored profile of registered users.
 */
export const ProfileInput = z
  .object({
    birthYear: z
      .number()
      .int()
      .min(1900)
      .refine((y) => minimumAgeFromBirthYear(y) >= MIN_AGE, {
        message: `Food Suggest is available to people aged ${MIN_AGE} and over.`,
      }),
    heightCm: z.number().min(100).max(250).optional(),
    weightKg: z.number().min(30).max(350).optional(),
    sex: Sex.optional(),
    activityLevel: ActivityLevel.optional(),
    goal: Goal.optional(),
    dietType: DietType.optional(),
    allergens: z.array(Allergen).max(Allergen.options.length).default([]),
    avoidIngredientIds: z.array(z.string().min(1)).max(200).default([]),
    likedIngredientIds: z.array(z.string().min(1)).max(200).default([]),
    dislikedIngredientIds: z.array(z.string().min(1)).max(200).default([]),
    cuisineIds: z.array(z.string().min(1)).max(50).default([]),
    mealsPerDay: z.number().int().min(1).max(8).optional(),
    preferredSlots: z.array(MealSlot).max(4).default([]),
    maxCookMinutes: z.number().int().min(5).max(480).optional(),
    cookingSkill: CookingSkill.optional(),
    budget: BudgetLevel.optional(),
    showCalories: z.boolean().default(false),
  })
  .strict();
export type ProfileInput = z.infer<typeof ProfileInput>;

/**
 * We only collect birth year (data minimisation), so the exact age is unknown.
 * Assume the birthday has NOT happened yet this year: the youngest age the
 * person could be. This keeps the age gates conservative.
 */
export function minimumAgeFromBirthYear(birthYear: number, now = new Date()): number {
  return now.getUTCFullYear() - birthYear - 1;
}

/** Weight-loss targets are only offered to adults. */
export function canReceiveWeightLossTargets(birthYear: number, now = new Date()): boolean {
  return minimumAgeFromBirthYear(birthYear, now) >= ADULT_AGE;
}
