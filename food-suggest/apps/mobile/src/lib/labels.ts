import type { Allergen, CookingSkill, DietType, Goal, MealDiet, MealSlot } from '@food-suggest/shared';

export const SLOT_LABELS: Record<MealSlot, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
};

export const DIET_LABELS: Record<MealDiet, string> = {
  VEGAN: 'Vegan',
  VEGETARIAN: 'Vegetarian',
  PESCATARIAN: 'Pescatarian',
  OMNIVORE: 'Contains meat',
};

export const DIFFICULTY_LABELS: Record<CookingSkill, string> = {
  BEGINNER: 'Easy',
  INTERMEDIATE: 'Medium',
  ADVANCED: 'Advanced',
};

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  PEANUT: 'Peanuts (groundnuts)',
  TREE_NUT: 'Tree nuts',
  MILK: 'Milk',
  EGG: 'Egg',
  FISH: 'Fish',
  CRUSTACEAN: 'Shellfish (crustaceans)',
  MOLLUSC: 'Molluscs',
  SOY: 'Soy',
  WHEAT_GLUTEN: 'Gluten (wheat, oats)',
  SESAME: 'Sesame',
  MUSTARD: 'Mustard',
  CELERY: 'Celery',
  SULPHITES: 'Sulphites',
  LUPIN: 'Lupin',
};

export const GOAL_OPTIONS: { value: Goal; label: string; description: string }[] = [
  { value: 'EAT_HEALTHIER', label: 'Eat healthier', description: 'More fibre, vegetables and balanced meals' },
  { value: 'LOSE_WEIGHT', label: 'Lose weight', description: 'Lighter, filling meals' },
  { value: 'GAIN_WEIGHT', label: 'Gain weight', description: 'Energy-rich, satisfying meals' },
  { value: 'BUILD_MUSCLE', label: 'Build muscle', description: 'Meals with plenty of protein' },
  { value: 'MAINTAIN_WEIGHT', label: 'Maintain my weight', description: 'Balanced portions' },
];

export const GOAL_LABELS = Object.fromEntries(GOAL_OPTIONS.map((g) => [g.value, g.label])) as Record<Goal, string>;

export const DIET_OPTIONS: { value: DietType; label: string; description: string }[] = [
  { value: 'OMNIVORE', label: 'I eat everything', description: 'Meat, fish, eggs, dairy and plants' },
  { value: 'PESCATARIAN', label: 'Pescatarian', description: 'Fish and seafood, but no meat' },
  { value: 'VEGETARIAN', label: 'Vegetarian', description: 'No meat or fish' },
  { value: 'VEGAN', label: 'Vegan', description: 'No animal products' },
];

export const DIET_TYPE_LABELS = Object.fromEntries(DIET_OPTIONS.map((d) => [d.value, d.label])) as Record<DietType, string>;

export const SKILL_OPTIONS: { value: CookingSkill; label: string; description: string }[] = [
  { value: 'BEGINNER', label: 'Beginner', description: 'Simple recipes, please' },
  { value: 'INTERMEDIATE', label: 'Comfortable', description: 'I cook most days' },
  { value: 'ADVANCED', label: 'Confident', description: 'Happy with longer, involved recipes' },
];

export const TIME_OPTIONS: { value: number | undefined; label: string }[] = [
  { value: 30, label: 'Up to 30 minutes' },
  { value: 60, label: 'Up to 1 hour' },
  { value: 90, label: 'Up to 1½ hours' },
  { value: undefined, label: 'No limit' },
];
