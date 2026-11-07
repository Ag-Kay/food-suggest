import type { Allergen, CookingSkill, MealDiet, MealSlot } from '@food-suggest/shared';

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
