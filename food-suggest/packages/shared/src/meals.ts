import { z } from 'zod';

import { Allergen, CookingSkill, DietType, MealSlot, NutritionMethod, NutritionReliability } from './enums';

/** Diet a meal satisfies, from most to least restrictive. */
export const MealDiet = z.enum(['VEGAN', 'VEGETARIAN', 'PESCATARIAN', 'OMNIVORE']);
export type MealDiet = z.infer<typeof MealDiet>;

export const MealListQuery = z
  .object({
    q: z.string().trim().min(1).max(80).optional(),
    cuisine: z.string().min(1).max(50).optional(),
    category: z.string().min(1).max(50).optional(),
    slot: MealSlot.optional(),
    diet: DietType.optional(),
    maxMinutes: z.coerce.number().int().min(5).max(480).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    offset: z.coerce.number().int().min(0).max(10_000).default(0),
  })
  .strict();
export type MealListQuery = z.infer<typeof MealListQuery>;

export interface NutritionSummary {
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG: number | null;
  sugarsG: number | null;
  saturatedFatG: number | null;
  sodiumMg: number | null;
  method: NutritionMethod;
  reliability: NutritionReliability;
}

export interface MealCard {
  slug: string;
  name: string;
  localNames: string[];
  description: string;
  cuisine: { slug: string; name: string };
  slots: MealSlot[];
  imageUrl: string | null;
  totalMinutes: number;
  difficulty: CookingSkill;
  diet: MealDiet;
  allergens: Allergen[];
  /** False when any ingredient's allergen content is unknown. The app must warn. */
  allergenInfoComplete: boolean;
  /** Per serving of the default variant; null if it could not be calculated. */
  nutrition: NutritionSummary | null;
}

export interface MealListResponse {
  items: MealCard[];
  total: number;
  limit: number;
  offset: number;
}

export interface MealDetailIngredient {
  slug: string;
  name: string;
  quantity: number;
  unit: string;
  grams: number | null;
  optional: boolean;
  note: string | null;
  allergens: Allergen[];
}

export interface NutritionSourceRef {
  ingredient: string;
  source: string;
  sourceRef: string | null;
  match: 'EXACT' | 'CLOSE' | 'PROXY';
  matchNote: string | null;
}

export interface MealVariantDetail {
  id: string;
  name: string;
  isDefault: boolean;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: CookingSkill;
  notes: string | null;
  recipeReviewed: boolean;
  diet: MealDiet;
  allergens: Allergen[];
  /** Allergens present only in optional ingredients (e.g. a condiment). */
  optionalAllergens: Allergen[];
  /** False when any ingredient's allergen content is unknown (brand-dependent). */
  allergenInfoComplete: boolean;
  ingredients: MealDetailIngredient[];
  steps: string[];
  nutrition: (NutritionSummary & { rawGramsPerServing: number }) | null;
  nutritionSources: NutritionSourceRef[];
}

export interface MealDetail extends Omit<
    MealCard,
    'totalMinutes' | 'difficulty' | 'diet' | 'allergens' | 'allergenInfoComplete' | 'nutrition'
  > {
  categories: { slug: string; name: string }[];
  variants: MealVariantDetail[];
  /** Photo credit; shown with the photo (required by CC BY / CC BY-SA licences). */
  image: ImageCredit | null;
}

export interface ImageCredit {
  alt: string;
  /** "Photographer / Source". */
  credit: string;
  license: string;
  sourceUrl: string | null;
}
