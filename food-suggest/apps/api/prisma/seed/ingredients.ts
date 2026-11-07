/**
 * Ingredient catalogue.
 *
 * Nutrient values are NOT typed here. Each ingredient points at a food in a
 * source table (WAFCT code or USDA FDC id) and the seed reads the real values
 * from that source. All quantities in recipes are grams of EDIBLE portion
 * (peeled, deboned), which is what the source tables report per 100 g.
 *
 * Allergen tags are assigned by the Food Suggest team from standard
 * ingredient knowledge. `allergensReviewed: false` marks ingredients whose
 * allergen content varies by brand (spice blends, stock cubes) — meals using
 * them are excluded for users with allergies until resolved.
 */
import type { Allergen, DietCompatibility, SourceMatch } from '../../src/generated/prisma/enums.ts';

type NutrientRef =
  | { source: 'wafct-2019'; code: string; match: SourceMatch; note?: string }
  | { source: 'usda-fdc'; fdcId: number; match: SourceMatch; note?: string };

export interface IngredientSeed {
  slug: string;
  name: string;
  aliases?: string[];
  shoppingCategory: string;
  diet: DietCompatibility;
  allergens?: Allergen[];
  allergensReviewed?: boolean;
  gramsPerUnit?: number;
  /** null = no reliable data; only allowed for optional ingredients. */
  nutrients: NutrientRef | null;
}

const w = (code: string, match: SourceMatch = 'EXACT', note?: string): NutrientRef => ({
  source: 'wafct-2019',
  code,
  match,
  note,
});

export const INGREDIENTS: IngredientSeed[] = [
  // Grains, doughs and starches
  { slug: 'rice-white', name: 'White rice (raw)', aliases: ['rice'], shoppingCategory: 'Grains & flours', diet: 'VEGAN', nutrients: w('01_036') },
  { slug: 'kenkey', name: 'Kenkey (cooked)', aliases: ['dokon', 'komi'], shoppingCategory: 'Grains & flours', diet: 'VEGAN', nutrients: w('01_099') },
  { slug: 'banku', name: 'Banku (cooked)', shoppingCategory: 'Grains & flours', diet: 'VEGAN',
    nutrients: w('01_098', 'PROXY', 'Uses cooked fermented white-maize dough (tô). Banku also contains cassava dough, so values are approximate.') },
  { slug: 'oats-rolled', name: 'Rolled oats', aliases: ['oatmeal'], shoppingCategory: 'Grains & flours', diet: 'VEGAN', allergens: ['WHEAT_GLUTEN'], nutrients: w('01_101') },
  { slug: 'spaghetti', name: 'Spaghetti (dry)', aliases: ['pasta'], shoppingCategory: 'Grains & flours', diet: 'VEGAN', allergens: ['WHEAT_GLUTEN'],
    nutrients: w('01_052', 'CLOSE', 'Dry macaroni: same durum-wheat pasta, different shape.') },
  { slug: 'millet-flour', name: 'Millet flour', aliases: ['hausa koko flour'], shoppingCategory: 'Grains & flours', diet: 'VEGAN',
    nutrients: w('01_063', 'CLOSE', 'Pearl millet flour; traditional koko uses fermented millet dough.') },

  // Roots, tubers and plantain
  { slug: 'cassava', name: 'Cassava', aliases: ['bankye'], shoppingCategory: 'Tubers & plantain', diet: 'VEGAN', nutrients: w('02_001') },
  { slug: 'yam', name: 'Yam', aliases: ['bayere', 'puna'], shoppingCategory: 'Tubers & plantain', diet: 'VEGAN',
    nutrients: w('02_019', 'CLOSE', 'WAFCT pale yam; Ghanaian white yam varieties differ slightly.') },
  { slug: 'plantain-ripe', name: 'Ripe plantain', aliases: ['borode'], shoppingCategory: 'Tubers & plantain', diet: 'VEGAN', nutrients: w('02_042') },
  { slug: 'plantain-unripe', name: 'Unripe plantain', shoppingCategory: 'Tubers & plantain', diet: 'VEGAN', nutrients: w('02_046') },

  // Beans, nuts and seeds
  { slug: 'cowpea', name: 'Black-eyed beans (dry)', aliases: ['cowpea', 'adua'], shoppingCategory: 'Beans, nuts & seeds', diet: 'VEGAN', nutrients: w('03_004') },
  { slug: 'groundnut-paste', name: 'Groundnut paste', aliases: ['peanut butter', 'nkate'], shoppingCategory: 'Beans, nuts & seeds', diet: 'VEGAN', allergens: ['PEANUT'], nutrients: w('06_026') },
  { slug: 'melon-seed', name: 'Melon seed (agushi)', aliases: ['egusi', 'akatoa'], shoppingCategory: 'Beans, nuts & seeds', diet: 'VEGAN', nutrients: w('06_013') },

  // Vegetables
  { slug: 'tomato', name: 'Tomato', shoppingCategory: 'Vegetables', diet: 'VEGAN', nutrients: w('04_021') },
  { slug: 'tomato-paste', name: 'Tomato paste', shoppingCategory: 'Canned & jarred', diet: 'VEGAN', nutrients: w('04_066') },
  { slug: 'onion', name: 'Onion', aliases: ['gyeene'], shoppingCategory: 'Vegetables', diet: 'VEGAN', nutrients: w('04_018') },
  { slug: 'chilli-pepper', name: 'Fresh chilli pepper', aliases: ['moko', 'kpakpo shito'], shoppingCategory: 'Vegetables', diet: 'VEGAN', nutrients: w('04_046') },
  { slug: 'garden-egg', name: 'Garden egg', aliases: ['nyaadewa', 'African eggplant'], shoppingCategory: 'Vegetables', diet: 'VEGAN',
    nutrients: w('04_074', 'CLOSE', 'WAFCT "native eggplant" (Solanum aethiopicum), the species sold as garden egg.') },
  { slug: 'kontomire', name: 'Cocoyam leaves (kontomire)', aliases: ['kontomire', 'nkontommire'], shoppingCategory: 'Vegetables', diet: 'VEGAN', nutrients: w('04_009') },
  { slug: 'ginger', name: 'Fresh ginger', aliases: ['akakaduro'], shoppingCategory: 'Vegetables', diet: 'VEGAN', nutrients: w('04_082') },
  { slug: 'garlic', name: 'Garlic', shoppingCategory: 'Vegetables', diet: 'VEGAN', nutrients: w('04_015') },
  { slug: 'lettuce', name: 'Lettuce', shoppingCategory: 'Vegetables', diet: 'VEGAN', nutrients: w('04_040') },
  { slug: 'cucumber', name: 'Cucumber', shoppingCategory: 'Vegetables', diet: 'VEGAN', nutrients: w('04_032') },
  { slug: 'spinach', name: 'Spinach', shoppingCategory: 'Vegetables', diet: 'VEGAN', nutrients: w('04_057') },
  { slug: 'sorghum-leaves', name: 'Waakye leaves (dried sorghum leaves)', aliases: ['waakye leaves'], shoppingCategory: 'Spices & seasonings', diet: 'VEGAN',
    // Used for colour and removed before serving; no composition data.
    nutrients: null },

  // Fruit
  { slug: 'banana', name: 'Banana', shoppingCategory: 'Fruit', diet: 'VEGAN', nutrients: w('05_028') },
  { slug: 'avocado', name: 'Avocado', aliases: ['pear'], shoppingCategory: 'Fruit', diet: 'VEGAN', nutrients: w('05_002') },
  { slug: 'lemon', name: 'Lemon', shoppingCategory: 'Fruit', diet: 'VEGAN', nutrients: w('05_014') },

  // Oils
  { slug: 'palm-oil', name: 'Red palm oil', aliases: ['zomi'], shoppingCategory: 'Oils', diet: 'VEGAN', nutrients: w('11_004') },
  { slug: 'vegetable-oil', name: 'Vegetable oil', shoppingCategory: 'Oils', diet: 'VEGAN',
    nutrients: w('11_016', 'CLOSE', 'Sunflower oil; all refined vegetable oils are ~900 kcal/100 g.') },
  { slug: 'olive-oil', name: 'Olive oil', shoppingCategory: 'Oils', diet: 'VEGAN', nutrients: w('11_014') },

  // Meat, fish and eggs
  { slug: 'chicken-thigh', name: 'Chicken thigh/leg meat (skinless)', shoppingCategory: 'Meat & poultry', diet: 'OMNIVORE_ONLY', nutrients: w('07_003') },
  { slug: 'chicken-breast', name: 'Chicken breast (skinless)', shoppingCategory: 'Meat & poultry', diet: 'OMNIVORE_ONLY', nutrients: w('07_033') },
  { slug: 'goat-meat', name: 'Goat meat', aliases: ['aponkye nam'], shoppingCategory: 'Meat & poultry', diet: 'OMNIVORE_ONLY', nutrients: w('07_069') },
  { slug: 'egg', name: 'Egg', shoppingCategory: 'Dairy & eggs', diet: 'VEGETARIAN', allergens: ['EGG'], gramsPerUnit: 50, nutrients: w('08_001') },
  { slug: 'tilapia', name: 'Tilapia', shoppingCategory: 'Fish & seafood', diet: 'PESCATARIAN', allergens: ['FISH'], nutrients: w('09_041') },
  { slug: 'horse-mackerel', name: 'Horse mackerel (kpanla)', aliases: ['kpanla', 'kpanlogo'], shoppingCategory: 'Fish & seafood', diet: 'PESCATARIAN', allergens: ['FISH'], nutrients: w('09_049') },
  { slug: 'dried-fish', name: 'Dried/smoked fish', aliases: ['koobi', 'momoni'], shoppingCategory: 'Fish & seafood', diet: 'PESCATARIAN', allergens: ['FISH'],
    nutrients: w('09_053', 'CLOSE', 'WAFCT "fish, whole, dried"; smoked fish varies by species.') },
  { slug: 'dried-shrimp', name: 'Dried shrimp/crayfish', aliases: ['crayfish', 'shrimp powder'], shoppingCategory: 'Fish & seafood', diet: 'PESCATARIAN', allergens: ['CRUSTACEAN'], nutrients: w('09_057') },
  { slug: 'sardines-canned', name: 'Sardines in oil (canned, drained)', shoppingCategory: 'Canned & jarred', diet: 'PESCATARIAN', allergens: ['FISH'], nutrients: w('09_037') },
  { slug: 'salmon', name: 'Salmon fillet', shoppingCategory: 'Fish & seafood', diet: 'PESCATARIAN', allergens: ['FISH'],
    nutrients: { source: 'usda-fdc', fdcId: 175167, match: 'EXACT', note: 'Atlantic salmon, farmed, raw (SR Legacy).' } },

  // Dairy
  { slug: 'milk', name: 'Milk (reduced fat)', shoppingCategory: 'Dairy & eggs', diet: 'VEGETARIAN', allergens: ['MILK'], nutrients: w('10_013') },
  { slug: 'evaporated-milk', name: 'Evaporated milk', shoppingCategory: 'Dairy & eggs', diet: 'VEGETARIAN', allergens: ['MILK'], nutrients: w('10_016') },

  // Seasonings and condiments
  { slug: 'salt', name: 'Salt', shoppingCategory: 'Spices & seasonings', diet: 'VEGAN', nutrients: w('13_015') },
  { slug: 'sugar', name: 'Sugar', shoppingCategory: 'Spices & seasonings', diet: 'VEGAN', nutrients: w('13_002') },
  { slug: 'black-pepper', name: 'Black pepper', shoppingCategory: 'Spices & seasonings', diet: 'VEGAN', nutrients: w('13_014') },
  { slug: 'thyme', name: 'Dried thyme', shoppingCategory: 'Spices & seasonings', diet: 'VEGAN', nutrients: w('04_083') },
  { slug: 'curry-powder', name: 'Curry powder', shoppingCategory: 'Spices & seasonings', diet: 'VEGAN',
    // Blends can contain mustard or celery; brand-dependent.
    allergensReviewed: false, nutrients: w('13_022') },
  { slug: 'stock-cube', name: 'Stock cube', aliases: ['maggi'], shoppingCategory: 'Spices & seasonings', diet: 'OMNIVORE_ONLY',
    // Often contains wheat, soy, celery and animal fat; varies by brand.
    allergensReviewed: false, nutrients: null },
  { slug: 'shito', name: 'Shito (black pepper sauce)', shoppingCategory: 'Canned & jarred', diet: 'PESCATARIAN', allergens: ['FISH', 'CRUSTACEAN'],
    // Composite condiment; no composition data yet.
    nutrients: null },
];
