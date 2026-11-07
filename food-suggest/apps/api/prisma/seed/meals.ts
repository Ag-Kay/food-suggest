/**
 * Draft recipes for the first content release.
 *
 * Quantities are typical home-cooking amounts written by the Food Suggest team,
 * in grams of edible portion. They are DRAFTS (`recipeReviewed: false`) until a
 * cook or nutrition reviewer checks them. Nutrition is calculated from these
 * quantities and is always shown as an estimate.
 */
import type { CookingSkill, MealSlot } from '../../src/generated/prisma/enums.ts';

import type { CategorySlug, CuisineSlug } from './catalogue.js';

export interface VariantIngredientSeed {
  slug: string;
  grams: number;
  quantity: number;
  unit: string;
  optional?: boolean;
  note?: string;
}

export interface VariantSeed {
  name: string;
  isDefault?: boolean;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: CookingSkill;
  notes?: string;
  ingredients: VariantIngredientSeed[];
  steps: string[];
}

export interface MealSeed {
  slug: string;
  name: string;
  localNames?: string[];
  description: string;
  cuisine: CuisineSlug;
  slots: MealSlot[];
  categories: CategorySlug[];
  variants: VariantSeed[];
}

/** Grams-only ingredient line. */
const g = (slug: string, grams: number, extra: Partial<VariantIngredientSeed> = {}): VariantIngredientSeed => ({
  slug,
  grams,
  quantity: grams,
  unit: 'g',
  ...extra,
});
/** Counted or spoon-measured line, with its gram weight for nutrition. */
const u = (slug: string, quantity: number, unit: string, grams: number, extra: Partial<VariantIngredientSeed> = {}): VariantIngredientSeed => ({
  slug,
  grams,
  quantity,
  unit,
  ...extra,
});

export const MEALS: MealSeed[] = [
  {
    slug: 'jollof-rice-chicken',
    name: 'Jollof rice with chicken',
    description: 'Rice cooked in a rich, spiced tomato and pepper sauce, served with chicken.',
    cuisine: 'ghanaian',
    slots: ['LUNCH', 'DINNER'],
    categories: ['rice-dishes'],
    variants: [
      {
        name: 'Home-style',
        isDefault: true,
        servings: 4,
        prepMinutes: 20,
        cookMinutes: 60,
        difficulty: 'INTERMEDIATE',
        ingredients: [
          g('rice-white', 400),
          g('chicken-thigh', 500),
          g('vegetable-oil', 60),
          g('onion', 150),
          g('tomato', 300),
          g('tomato-paste', 70),
          g('chilli-pepper', 15),
          g('ginger', 15),
          g('garlic', 10),
          u('curry-powder', 1, 'tsp', 3),
          u('thyme', 1, 'tsp', 2),
          u('salt', 1, 'tsp', 6),
          u('black-pepper', 0.5, 'tsp', 1),
          u('stock-cube', 1, 'piece', 4, { optional: true }),
        ],
        steps: [
          'Season the chicken with salt, garlic, ginger and thyme. Steam or grill until cooked through.',
          'Blend the tomatoes, half the onion and the chilli pepper.',
          'Fry the remaining sliced onion in the oil, then add the tomato paste and fry for 5 minutes.',
          'Add the blended mixture, curry powder and black pepper. Simmer until the sauce thickens and the oil rises.',
          'Wash the rice, stir it into the sauce, add about 600 ml water, cover tightly and cook on low heat until tender.',
          'Serve the rice with the chicken.',
        ],
      },
    ],
  },
  {
    slug: 'waakye',
    name: 'Waakye',
    description: 'Rice and black-eyed beans cooked together with waakye leaves, usually served with egg and shito.',
    cuisine: 'ghanaian',
    slots: ['BREAKFAST', 'LUNCH'],
    categories: ['rice-dishes', 'beans-and-legumes'],
    variants: [
      {
        name: 'With boiled egg',
        isDefault: true,
        servings: 4,
        prepMinutes: 15,
        cookMinutes: 75,
        difficulty: 'BEGINNER',
        notes: 'Soak the beans overnight to shorten cooking time.',
        ingredients: [
          g('rice-white', 300),
          g('cowpea', 150),
          u('egg', 4, 'piece', 200),
          u('salt', 1, 'tsp', 4),
          g('sorghum-leaves', 10, { optional: true, note: 'For colour; remove before serving' }),
          u('shito', 4, 'tbsp', 60, { optional: true, note: 'To serve' }),
        ],
        steps: [
          'Boil the beans with the waakye leaves until almost soft (about 45 minutes).',
          'Add the washed rice, salt and enough water to cover by 2 cm. Cook covered on low heat until the rice is tender.',
          'Boil the eggs for 10 minutes, cool and peel.',
          'Remove the leaves and serve the waakye with the eggs and shito if you like.',
        ],
      },
    ],
  },
  {
    slug: 'red-red',
    name: 'Red red',
    description: 'Black-eyed beans stewed in red palm oil and tomato, served with fried ripe plantain.',
    cuisine: 'ghanaian',
    slots: ['LUNCH', 'DINNER'],
    categories: ['beans-and-legumes'],
    variants: [
      {
        name: 'Plant-based',
        isDefault: true,
        servings: 4,
        prepMinutes: 15,
        cookMinutes: 60,
        difficulty: 'BEGINNER',
        ingredients: [
          g('cowpea', 300),
          g('palm-oil', 60),
          g('onion', 150),
          g('tomato', 300),
          g('chilli-pepper', 10),
          g('ginger', 10),
          u('salt', 1, 'tsp', 5),
          g('plantain-ripe', 600),
          g('vegetable-oil', 40, { note: 'Approximate oil absorbed when frying' }),
        ],
        steps: [
          'Boil the beans until soft (about 45 minutes) and drain.',
          'Heat the palm oil, fry the chopped onion, then add the blended tomato, chilli and ginger. Simmer for 10 minutes.',
          'Stir in the beans and salt and simmer for 10 more minutes.',
          'Slice the plantain and fry in hot vegetable oil until golden. Drain well.',
          'Serve the beans with the fried plantain.',
        ],
      },
      {
        name: 'With smoked fish',
        servings: 4,
        prepMinutes: 15,
        cookMinutes: 60,
        difficulty: 'BEGINNER',
        ingredients: [
          g('cowpea', 300),
          g('palm-oil', 60),
          g('onion', 150),
          g('tomato', 300),
          g('chilli-pepper', 10),
          g('ginger', 10),
          g('dried-fish', 80),
          u('salt', 0.5, 'tsp', 3),
          g('plantain-ripe', 600),
          g('vegetable-oil', 40, { note: 'Approximate oil absorbed when frying' }),
        ],
        steps: [
          'Boil the beans until soft and drain.',
          'Fry the onion in palm oil, add the blended tomato, chilli and ginger, then the flaked fish. Simmer for 10 minutes.',
          'Stir in the beans and salt and simmer for 10 more minutes.',
          'Fry the sliced plantain until golden and serve together.',
        ],
      },
    ],
  },
  {
    slug: 'kontomire-stew-plantain',
    name: 'Kontomire stew with boiled plantain',
    localNames: ['Abom', 'Palava sauce'],
    description: 'Cocoyam leaves cooked with palm oil, agushi and egg, served with boiled green plantain.',
    cuisine: 'ghanaian',
    slots: ['LUNCH', 'DINNER'],
    categories: ['soups-and-stews'],
    variants: [
      {
        name: 'With egg and agushi',
        isDefault: true,
        servings: 4,
        prepMinutes: 25,
        cookMinutes: 40,
        difficulty: 'INTERMEDIATE',
        ingredients: [
          g('kontomire', 500),
          g('palm-oil', 60),
          g('onion', 120),
          g('tomato', 250),
          g('chilli-pepper', 10),
          g('melon-seed', 100),
          u('egg', 4, 'piece', 200),
          u('salt', 1, 'tsp', 5),
          g('plantain-unripe', 800),
        ],
        steps: [
          'Wash the kontomire, remove the tough stems, then boil for 10 minutes. Drain and chop.',
          'Mix the ground agushi with a little water into a paste.',
          'Fry the onion in palm oil, add the blended tomato and chilli and simmer for 10 minutes.',
          'Drop spoonfuls of agushi paste into the sauce and let them set without stirring, about 5 minutes.',
          'Stir in the kontomire and salt, then crack in the eggs and cook gently until set.',
          'Boil the peeled plantain for 20 minutes and serve with the stew.',
        ],
      },
    ],
  },
  {
    slug: 'fufu-light-soup-goat',
    name: 'Fufu and light soup with goat',
    localNames: ['Aponkye nkrakra'],
    description: 'Pounded cassava and plantain with a spicy tomato soup and goat meat.',
    cuisine: 'ghanaian',
    slots: ['LUNCH', 'DINNER'],
    categories: ['swallows', 'soups-and-stews'],
    variants: [
      {
        name: 'Home-style',
        isDefault: true,
        servings: 4,
        prepMinutes: 30,
        cookMinutes: 75,
        difficulty: 'ADVANCED',
        notes: 'Pounding is traditional; fufu flour or a fufu machine are common shortcuts.',
        ingredients: [
          g('goat-meat', 600),
          g('tomato', 400),
          g('onion', 150),
          g('chilli-pepper', 15),
          g('ginger', 15),
          g('garlic', 5),
          u('salt', 1, 'tsp', 6),
          g('cassava', 800),
          g('plantain-unripe', 400),
        ],
        steps: [
          'Season the goat meat with salt, ginger, garlic and half the onion. Steam in its own juices for 15 minutes.',
          'Add about 1.5 litres of water, the whole tomatoes, chilli and remaining onion. Boil for 15 minutes.',
          'Remove the tomatoes, chilli and onion, blend them and strain back into the pot. Simmer for 30–40 minutes.',
          'Boil the peeled cassava and plantain until soft, then pound together until smooth and stretchy.',
          'Serve the fufu in bowls with the soup and meat.',
        ],
      },
    ],
  },
  {
    slug: 'groundnut-soup-omo-tuo',
    name: 'Groundnut soup with rice balls',
    localNames: ['Nkatenkwan', 'Omo tuo'],
    description: 'Chicken in a creamy groundnut and tomato soup, served with soft rice balls.',
    cuisine: 'ghanaian',
    slots: ['LUNCH', 'DINNER'],
    categories: ['soups-and-stews', 'rice-dishes'],
    variants: [
      {
        name: 'With chicken',
        isDefault: true,
        servings: 4,
        prepMinutes: 20,
        cookMinutes: 70,
        difficulty: 'INTERMEDIATE',
        ingredients: [
          g('chicken-thigh', 600),
          g('groundnut-paste', 200),
          g('tomato', 300),
          g('tomato-paste', 30),
          g('onion', 150),
          g('chilli-pepper', 15),
          g('ginger', 10),
          u('salt', 1, 'tsp', 6),
          g('rice-white', 400),
        ],
        steps: [
          'Season the chicken with salt, ginger and half the onion and steam for 10 minutes.',
          'Add water, the whole tomatoes, chilli and remaining onion. Boil for 15 minutes, then blend the vegetables and return them.',
          'Mix the groundnut paste and tomato paste with a little hot water until smooth, then stir into the soup.',
          'Simmer for 30–40 minutes, stirring now and then, until the oil rises to the top.',
          'Cook the rice with extra water until very soft, mash lightly and shape into balls.',
          'Serve the rice balls in bowls of soup.',
        ],
      },
    ],
  },
  {
    slug: 'banku-grilled-tilapia',
    name: 'Banku and grilled tilapia',
    description: 'Fermented corn and cassava dough with grilled tilapia and fresh pepper sauce.',
    cuisine: 'ghanaian',
    slots: ['LUNCH', 'DINNER'],
    categories: ['swallows', 'fish-and-seafood'],
    variants: [
      {
        name: 'With fresh pepper',
        isDefault: true,
        servings: 4,
        prepMinutes: 20,
        cookMinutes: 40,
        difficulty: 'INTERMEDIATE',
        ingredients: [
          g('banku', 1200, { note: 'About 4 balls, cooked' }),
          g('tilapia', 900, { note: 'Edible portion of about 4 whole fish' }),
          g('vegetable-oil', 20),
          g('chilli-pepper', 60),
          g('tomato', 200),
          g('onion', 100),
          u('salt', 1, 'tsp', 5),
        ],
        steps: [
          'Clean and score the tilapia, season with salt and a little blended onion, and brush with oil.',
          'Grill for 10–15 minutes on each side until cooked through.',
          'Grind the chilli, tomato, onion and a pinch of salt into a fresh pepper sauce.',
          'Serve the tilapia with banku and the pepper sauce.',
        ],
      },
    ],
  },
  {
    slug: 'kenkey-fried-fish',
    name: 'Kenkey and fried fish',
    description: 'Fermented corn dumplings with fried fish and fresh pepper sauce.',
    cuisine: 'ghanaian',
    slots: ['LUNCH', 'DINNER'],
    categories: ['swallows', 'fish-and-seafood'],
    variants: [
      {
        name: 'With horse mackerel',
        isDefault: true,
        servings: 4,
        prepMinutes: 15,
        cookMinutes: 25,
        difficulty: 'BEGINNER',
        notes: 'Kenkey is usually bought ready-made.',
        ingredients: [
          g('kenkey', 1200, { note: 'About 4 balls' }),
          g('horse-mackerel', 600),
          g('vegetable-oil', 40, { note: 'Approximate oil absorbed when frying' }),
          g('chilli-pepper', 40),
          g('tomato', 200),
          g('onion', 100),
          u('salt', 1, 'tsp', 4),
        ],
        steps: [
          'Clean and season the fish with salt, then fry in hot oil until crisp. Drain well.',
          'Grind the chilli, tomato, onion and a pinch of salt into a fresh pepper sauce.',
          'Serve the kenkey with the fish and pepper sauce.',
        ],
      },
    ],
  },
  {
    slug: 'yam-garden-egg-stew',
    name: 'Boiled yam with garden egg stew',
    localNames: ['Nyaadewa abom'],
    description: 'Boiled yam with a palm-oil stew of garden eggs, tomato and egg.',
    cuisine: 'ghanaian',
    slots: ['BREAKFAST', 'LUNCH', 'DINNER'],
    categories: ['soups-and-stews'],
    variants: [
      {
        name: 'With egg',
        isDefault: true,
        servings: 4,
        prepMinutes: 20,
        cookMinutes: 40,
        difficulty: 'BEGINNER',
        ingredients: [
          g('yam', 1000),
          g('garden-egg', 500),
          g('palm-oil', 60),
          g('onion', 120),
          g('tomato', 250),
          g('chilli-pepper', 10),
          u('egg', 4, 'piece', 200),
          u('salt', 1, 'tsp', 6),
          g('dried-shrimp', 20, { optional: true }),
        ],
        steps: [
          'Peel and cut the yam, then boil in salted water until tender (about 20 minutes).',
          'Boil the garden eggs for 10 minutes, peel and mash.',
          'Fry the onion in palm oil, add the blended tomato and chilli and simmer for 10 minutes.',
          'Stir in the mashed garden eggs (and shrimp if using), then the beaten eggs. Cook gently until set.',
          'Serve the stew with the yam.',
        ],
      },
    ],
  },
  {
    slug: 'hausa-koko',
    name: 'Hausa koko',
    description: 'Smooth, spiced millet porridge flavoured with ginger, a popular breakfast.',
    cuisine: 'ghanaian',
    slots: ['BREAKFAST'],
    categories: ['porridges'],
    variants: [
      {
        name: 'Lightly sweetened',
        isDefault: true,
        servings: 4,
        prepMinutes: 10,
        cookMinutes: 20,
        difficulty: 'BEGINNER',
        ingredients: [
          g('millet-flour', 160),
          g('ginger', 15),
          g('sugar', 40),
          u('salt', 1, 'pinch', 1),
          g('evaporated-milk', 80, { optional: true, note: 'To serve' }),
        ],
        steps: [
          'Mix the millet flour and grated ginger with 300 ml cold water into a smooth paste.',
          'Bring 900 ml water to the boil, then slowly stir in the paste.',
          'Keep stirring over low heat for 10–15 minutes until smooth and thick.',
          'Sweeten with sugar and add a pinch of salt. Add milk if you like.',
        ],
      },
    ],
  },
  {
    slug: 'kelewele',
    name: 'Kelewele',
    description: 'Ripe plantain cubes tossed in ginger and chilli, then fried until caramelised.',
    cuisine: 'ghanaian',
    slots: ['SNACK'],
    categories: ['snacks'],
    variants: [
      {
        name: 'Classic',
        isDefault: true,
        servings: 4,
        prepMinutes: 15,
        cookMinutes: 15,
        difficulty: 'BEGINNER',
        ingredients: [
          g('plantain-ripe', 800),
          g('ginger', 20),
          g('chilli-pepper', 5),
          g('onion', 30),
          u('salt', 0.5, 'tsp', 3),
          g('vegetable-oil', 60, { note: 'Approximate oil absorbed when frying' }),
        ],
        steps: [
          'Peel and cube the plantain.',
          'Blend the ginger, chilli, onion and salt and toss with the plantain. Rest for 10 minutes.',
          'Fry in hot oil in batches until golden brown. Drain well.',
        ],
      },
    ],
  },
  {
    slug: 'oats-banana-groundnut',
    name: 'Oats with banana and groundnut paste',
    description: 'Creamy oats cooked in milk, topped with banana and a spoon of groundnut paste.',
    cuisine: 'international',
    slots: ['BREAKFAST'],
    categories: ['porridges'],
    variants: [
      {
        name: 'Single serving',
        isDefault: true,
        servings: 1,
        prepMinutes: 2,
        cookMinutes: 6,
        difficulty: 'BEGINNER',
        ingredients: [
          g('oats-rolled', 60),
          u('milk', 1, 'cup', 250),
          u('banana', 1, 'piece', 100),
          u('groundnut-paste', 1, 'tbsp', 16),
        ],
        steps: [
          'Simmer the oats in the milk for 4–5 minutes, stirring, until creamy.',
          'Top with sliced banana and the groundnut paste.',
        ],
      },
    ],
  },
  {
    slug: 'chicken-avocado-salad',
    name: 'Chicken and avocado salad',
    description: 'Grilled chicken breast with lettuce, tomato, cucumber and avocado, dressed with lemon and olive oil.',
    cuisine: 'international',
    slots: ['LUNCH', 'DINNER'],
    categories: ['salads'],
    variants: [
      {
        name: 'Single serving',
        isDefault: true,
        servings: 1,
        prepMinutes: 10,
        cookMinutes: 12,
        difficulty: 'BEGINNER',
        ingredients: [
          g('chicken-breast', 150),
          g('lettuce', 80),
          g('tomato', 100),
          g('cucumber', 80),
          u('avocado', 0.5, 'piece', 70),
          u('olive-oil', 2, 'tsp', 10),
          u('lemon', 0.5, 'piece', 15),
          u('salt', 1, 'pinch', 1),
          u('black-pepper', 1, 'pinch', 0.5),
        ],
        steps: [
          'Season the chicken with salt and pepper and grill for 5–6 minutes on each side until cooked through. Rest, then slice.',
          'Chop the lettuce, tomato, cucumber and avocado.',
          'Whisk the olive oil with lemon juice, toss with the salad and top with the chicken.',
        ],
      },
    ],
  },
  {
    slug: 'spaghetti-sardine-tomato',
    name: 'Spaghetti with sardines and tomato',
    description: 'Spaghetti in a quick garlic and tomato sauce with canned sardines.',
    cuisine: 'international',
    slots: ['LUNCH', 'DINNER'],
    categories: ['pasta', 'fish-and-seafood'],
    variants: [
      {
        name: 'Home-style',
        isDefault: true,
        servings: 4,
        prepMinutes: 10,
        cookMinutes: 25,
        difficulty: 'BEGINNER',
        ingredients: [
          g('spaghetti', 400),
          g('sardines-canned', 250),
          g('tomato', 400),
          g('onion', 120),
          g('garlic', 10),
          g('olive-oil', 30),
          u('salt', 1, 'tsp', 4),
          g('chilli-pepper', 5, { optional: true }),
        ],
        steps: [
          'Cook the spaghetti in salted boiling water until just tender. Drain.',
          'Soften the onion and garlic in olive oil, add the chopped tomatoes and simmer for 10 minutes.',
          'Break in the sardines and warm through, then toss with the spaghetti.',
        ],
      },
    ],
  },
  {
    slug: 'salmon-rice-spinach',
    name: 'Baked salmon with rice and garlic spinach',
    description: 'Lemon-baked salmon with plain rice and spinach wilted with garlic.',
    cuisine: 'international',
    slots: ['LUNCH', 'DINNER'],
    categories: ['fish-and-seafood', 'rice-dishes'],
    variants: [
      {
        name: 'Home-style',
        isDefault: true,
        servings: 4,
        prepMinutes: 10,
        cookMinutes: 25,
        difficulty: 'BEGINNER',
        ingredients: [
          g('salmon', 600),
          g('rice-white', 300),
          g('spinach', 400),
          g('garlic', 10),
          g('olive-oil', 20),
          u('lemon', 1, 'piece', 30),
          u('salt', 1, 'tsp', 4),
          u('black-pepper', 0.5, 'tsp', 1),
        ],
        steps: [
          'Heat the oven to 200 °C. Season the salmon with salt, pepper and lemon and bake for 12–15 minutes.',
          'Cook the rice in salted water until tender.',
          'Warm the olive oil, add the garlic for 30 seconds, then the spinach until just wilted.',
          'Serve the salmon with the rice and spinach.',
        ],
      },
    ],
  },
];
