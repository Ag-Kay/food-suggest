/**
 * Seeds reference data, ingredients (with nutrients from their sources) and draft
 * meals, then calculates per-serving nutrition for every meal variant.
 *
 * Idempotent for catalogue data. Meal variants are rebuilt on every run, so do not
 * run against a database with real users' meal plans (development only for now).
 *
 * Run: pnpm db:seed   (needs prisma/seed/data/wafct.local.json — see scripts/extract_wafct.py)
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseFdcFood } from '../../src/integrations/fdc/client.js';
import { createDb } from '../../src/lib/db.js';
import { calculateVariantNutrition, type NutrientsPer100g } from '../../src/modules/nutrition/calculator.js';
import { CATEGORIES, CUISINES, SOURCES } from './catalogue.js';
import { INGREDIENTS, type IngredientSeed } from './ingredients.js';
import { MEALS } from './meals.js';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), 'data');

try {
  process.loadEnvFile();
} catch {
  // no .env
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
if (process.env.NODE_ENV === 'production') throw new Error('Refusing to run the dev seed in production');

const db = createDb(url);

// ── Source data loaders ──────────────────────────────────────────────────────

interface WafctFood extends Partial<Record<keyof NutrientsPer100g, number | null>> {
  name: string;
  lowQualityFields: string[];
}

function loadWafct(): Record<string, WafctFood> {
  const file = join(dataDir, 'wafct.local.json');
  if (!existsSync(file)) {
    throw new Error(
      'Missing prisma/seed/data/wafct.local.json. Download WAFCT_2019.xlsx from FAO and run:\n' +
        '  python3 -I scripts/extract_wafct.py /path/to/WAFCT_2019.xlsx',
    );
  }
  return JSON.parse(readFileSync(file, 'utf8')).foods;
}

function resolveNutrients(
  ing: IngredientSeed,
  wafct: Record<string, WafctFood>,
): { values: NutrientsPer100g; sourceRef: string; basis: string; lowQuality: string[] } | null {
  const ref = ing.nutrients;
  if (!ref) return null;

  if (ref.source === 'wafct-2019') {
    const f = wafct[ref.code];
    if (!f) throw new Error(`${ing.slug}: WAFCT code ${ref.code} not found`);
    const core = ['energyKcal', 'proteinG', 'carbsG', 'fatG'] as const;
    for (const k of core) {
      if (f[k] == null) throw new Error(`${ing.slug}: WAFCT ${ref.code} has no ${k}`);
    }
    return {
      values: f as NutrientsPer100g,
      sourceRef: ref.code,
      basis: `${f.name} — per 100 g edible portion`,
      lowQuality: f.lowQualityFields,
    };
  }

  const file = join(dataDir, 'fdc', `${ref.fdcId}.json`);
  if (!existsSync(file)) throw new Error(`${ing.slug}: run "pnpm fdc:fetch" to download FDC ${ref.fdcId}`);
  const food = parseFdcFood(JSON.parse(readFileSync(file, 'utf8')));
  return {
    values: food.nutrients,
    sourceRef: String(ref.fdcId),
    basis: `${food.description} — per 100 g`,
    lowQuality: [],
  };
}

const dec = (v: number | null | undefined) => (v == null ? null : v);

// ── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  const wafct = loadWafct();

  const sourceIds = new Map<string, string>();
  for (const s of SOURCES) {
    const row = await db.nutritionSource.upsert({ where: { slug: s.slug }, create: { ...s }, update: { ...s } });
    sourceIds.set(s.slug, row.id);
  }

  const cuisineIds = new Map<string, string>();
  for (const c of CUISINES) {
    const row = await db.cuisine.upsert({ where: { slug: c.slug }, create: { ...c }, update: { ...c } });
    cuisineIds.set(c.slug, row.id);
  }

  const categoryIds = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await db.category.upsert({ where: { slug: c.slug }, create: { ...c }, update: { ...c } });
    categoryIds.set(c.slug, row.id);
  }

  const ingredients = new Map<string, { id: string; nutrients: NutrientsPer100g | null }>();
  for (const ing of INGREDIENTS) {
    const data = {
      slug: ing.slug,
      name: ing.name,
      aliases: ing.aliases ?? [],
      shoppingCategory: ing.shoppingCategory,
      dietCompatibility: ing.diet,
      gramsPerUnit: ing.gramsPerUnit ?? null,
      allergensReviewed: ing.allergensReviewed ?? true,
    };
    const row = await db.ingredient.upsert({ where: { slug: ing.slug }, create: data, update: data });

    await db.ingredientAllergen.deleteMany({ where: { ingredientId: row.id } });
    if (ing.allergens?.length) {
      await db.ingredientAllergen.createMany({
        data: ing.allergens.map((allergen) => ({ ingredientId: row.id, allergen })),
      });
    }

    const resolved = resolveNutrients(ing, wafct);
    if (resolved && ing.nutrients) {
      const v = resolved.values;
      const nutrientData = {
        sourceId: sourceIds.get(ing.nutrients.source)!,
        sourceRef: resolved.sourceRef,
        basis: resolved.basis,
        matchQuality: ing.nutrients.match,
        matchNote: ing.nutrients.note ?? null,
        energyKcal: v.energyKcal,
        proteinG: v.proteinG,
        carbsG: v.carbsG,
        fatG: v.fatG,
        fibreG: dec(v.fibreG),
        sugarsG: dec(v.sugarsG),
        saturatedFatG: dec(v.saturatedFatG),
        sodiumMg: dec(v.sodiumMg),
        ironMg: dec(v.ironMg),
        calciumMg: dec(v.calciumMg),
        reliability: 'ESTIMATED' as const,
      };
      await db.ingredientNutrients.upsert({
        where: { ingredientId: row.id },
        create: { ingredientId: row.id, ...nutrientData },
        update: nutrientData,
      });
    } else {
      await db.ingredientNutrients.deleteMany({ where: { ingredientId: row.id } });
    }
    ingredients.set(ing.slug, { id: row.id, nutrients: resolved?.values ?? null });
  }
  console.log(`✓ ${INGREDIENTS.length} ingredients`);

  const problems: string[] = [];
  for (const meal of MEALS) {
    const mealData = {
      slug: meal.slug,
      name: meal.name,
      localNames: meal.localNames ?? [],
      description: meal.description,
      cuisineId: cuisineIds.get(meal.cuisine)!,
      slots: meal.slots,
      status: 'PUBLISHED' as const,
    };
    const row = await db.meal.upsert({ where: { slug: meal.slug }, create: mealData, update: mealData });

    await db.mealCategory.deleteMany({ where: { mealId: row.id } });
    await db.mealCategory.createMany({
      data: meal.categories.map((c) => ({ mealId: row.id, categoryId: categoryIds.get(c)! })),
    });

    await db.mealVariant.deleteMany({ where: { mealId: row.id } });
    for (const v of meal.variants) {
      const variant = await db.mealVariant.create({
        data: {
          mealId: row.id,
          name: v.name,
          isDefault: v.isDefault ?? false,
          servings: v.servings,
          prepMinutes: v.prepMinutes,
          cookMinutes: v.cookMinutes,
          difficulty: v.difficulty,
          notes: v.notes ?? null,
          recipeReviewed: false,
          ingredients: {
            create: v.ingredients.map((vi, position) => {
              const ing = ingredients.get(vi.slug);
              if (!ing) throw new Error(`${meal.slug}: unknown ingredient ${vi.slug}`);
              return {
                ingredientId: ing.id,
                quantity: vi.quantity,
                unit: vi.unit,
                grams: vi.grams,
                optional: vi.optional ?? false,
                note: vi.note ?? null,
                position,
              };
            }),
          },
          steps: { create: v.steps.map((text, position) => ({ text, position })) },
        },
      });

      const result = calculateVariantNutrition(
        v.ingredients.map((vi) => ({
          slug: vi.slug,
          grams: vi.grams,
          optional: vi.optional ?? false,
          nutrients: ingredients.get(vi.slug)!.nutrients,
        })),
        v.servings,
      );
      if (!result.ok) {
        problems.push(`${meal.slug} / ${v.name}: ${result.reason} ${[...result.missingGrams, ...result.missingNutrients].join(', ')}`);
        continue;
      }
      const p = result.perServing;
      await db.variantNutrition.create({
        data: {
          variantId: variant.id,
          rawGramsPerServing: result.rawGramsPerServing,
          energyKcal: p.energyKcal,
          proteinG: p.proteinG,
          carbsG: p.carbsG,
          fatG: p.fatG,
          fibreG: p.fibreG,
          sugarsG: p.sugarsG,
          saturatedFatG: p.saturatedFatG,
          sodiumMg: p.sodiumMg,
          method: result.method,
          reliability: result.reliability,
        },
      });
    }
  }
  console.log(`✓ ${MEALS.length} meals`);
  if (problems.length) {
    console.warn('Variants without nutrition:\n  ' + problems.join('\n  '));
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
