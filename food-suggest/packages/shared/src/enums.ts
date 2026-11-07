/**
 * Shared vocabularies used by the mobile app, the API and the database.
 * Keep these in sync with the Prisma enums in apps/api/prisma/schema.prisma.
 */
import { z } from 'zod';

export const Goal = z.enum([
  'LOSE_WEIGHT',
  'GAIN_WEIGHT',
  'BUILD_MUSCLE',
  'MAINTAIN_WEIGHT',
  'EAT_HEALTHIER',
]);
export type Goal = z.infer<typeof Goal>;

export const DietType = z.enum(['OMNIVORE', 'VEGETARIAN', 'VEGAN', 'PESCATARIAN']);
export type DietType = z.infer<typeof DietType>;

/** Major allergens (union of EU-14 / US-9 lists that matter for our cuisines). */
export const Allergen = z.enum([
  'PEANUT',
  'TREE_NUT',
  'MILK',
  'EGG',
  'FISH',
  'CRUSTACEAN',
  'MOLLUSC',
  'SOY',
  'WHEAT_GLUTEN',
  'SESAME',
  'MUSTARD',
  'CELERY',
  'SULPHITES',
  'LUPIN',
]);
export type Allergen = z.infer<typeof Allergen>;

export const ActivityLevel = z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']);
export type ActivityLevel = z.infer<typeof ActivityLevel>;

export const MealSlot = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']);
export type MealSlot = z.infer<typeof MealSlot>;

export const CookingSkill = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
export type CookingSkill = z.infer<typeof CookingSkill>;

export const BudgetLevel = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type BudgetLevel = z.infer<typeof BudgetLevel>;

export const Sex = z.enum(['FEMALE', 'MALE']);
export type Sex = z.infer<typeof Sex>;

/** How a nutrition value was produced. */
export const NutritionMethod = z.enum(['CALCULATED_FROM_INGREDIENTS', 'LAB_ANALYSIS', 'EXTERNAL_SOURCE']);
export type NutritionMethod = z.infer<typeof NutritionMethod>;

/** Nothing is VERIFIED until a qualified reviewer signs it off. */
export const NutritionReliability = z.enum(['ESTIMATED', 'VERIFIED']);
export type NutritionReliability = z.infer<typeof NutritionReliability>;
