import type { Allergen } from '@food-suggest/shared';

/** Lower-case allergen names for use inside sentences. */
export const ALLERGEN_NAMES: Record<Allergen, string> = {
  PEANUT: 'peanuts',
  TREE_NUT: 'tree nuts',
  MILK: 'milk',
  EGG: 'egg',
  FISH: 'fish',
  CRUSTACEAN: 'shellfish',
  MOLLUSC: 'molluscs',
  SOY: 'soy',
  WHEAT_GLUTEN: 'gluten',
  SESAME: 'sesame',
  MUSTARD: 'mustard',
  CELERY: 'celery',
  SULPHITES: 'sulphites',
  LUPIN: 'lupin',
};
