/** Shopping recipes built from the real seed files (no database, no licensed data). */
import { INGREDIENTS } from '../../../prisma/seed/ingredients.js';
import { MEALS } from '../../../prisma/seed/meals.js';
import type { RecipeForShopping } from './builder.js';

const bySlug = new Map(INGREDIENTS.map((i) => [i.slug, i]));

export function seedRecipes(): Map<string, RecipeForShopping> {
  return new Map(
    MEALS.map((meal) => {
      const variant = meal.variants.find((v) => v.isDefault) ?? meal.variants[0]!;
      return [
        meal.slug,
        {
          slug: meal.slug,
          name: meal.name,
          servings: variant.servings,
          ingredients: variant.ingredients.map((vi) => {
            const ing = bySlug.get(vi.slug)!;
            return {
              slug: vi.slug,
              name: ing.name,
              category: ing.shoppingCategory,
              quantity: vi.quantity,
              unit: vi.unit,
              optional: vi.optional ?? false,
            };
          }),
        },
      ];
    }),
  );
}
