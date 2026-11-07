/**
 * Rule-based recommendation engine.
 *
 * Safety filters (allergens, diet, avoided foods) are deterministic and run
 * first; nothing here depends on AI. Scoring thresholds are simple, documented
 * heuristics for ranking — not medical or dietetic targets.
 */
import {
  canReceiveWeightLossTargets,
  type Allergen,
  type CookingSkill,
  type MealCard,
  type MealSlot,
  type ProfileInput,
  type Recommendation,
  type RecommendationResponse,
} from '@food-suggest/shared';

import { ALLERGEN_NAMES } from './allergen-names.js';
import { dietSatisfies } from '../meals/derive.js';

export interface OptionalIngredient {
  slug: string;
  name: string;
  allergens: Allergen[];
}

export interface RecommendationCandidate {
  card: MealCard;
  /** Slugs of ingredients the default variant needs. */
  requiredIngredients: string[];
  /** Ingredients the cook can leave out (condiments, garnishes). */
  optionalIngredients: OptionalIngredient[];
  /** Display names for required ingredient slugs (for reasons). */
  ingredientNames: Record<string, string>;
}

export interface RecommendOptions {
  slot?: MealSlot;
  limit?: number;
  now?: Date;
}

/** Heuristic thresholds (per serving). Documented in docs/DECISIONS.md. */
export const THRESHOLDS = {
  veryHighProteinG: 45,
  highProteinG: 30,
  goodProteinG: 20,
  proteinPer100KcalHigh: 8,
  proteinPer100KcalGood: 6,
  fibreGoodG: 6,
  lighterMealMaxKcal: 550,
  heavyMealMinKcal: 750,
  energyRichMinKcal: 650,
  balancedMinKcal: 400,
  balancedMaxKcal: 750,
  moderateSodiumMaxMg: 600,
  highSodiumMinMg: 900,
  quickMealMaxMinutes: 30,
} as const;

const SKILL_RANK: Record<CookingSkill, number> = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2 };
const DIET_NAMES = { VEGAN: 'vegan', VEGETARIAN: 'vegetarian', PESCATARIAN: 'pescatarian', OMNIVORE: '' } as const;

interface Contribution {
  points: number;
  reason?: string;
}

type EffectiveGoal = NonNullable<ProfileInput['goal']> | undefined;

function round(n: number) {
  return Math.round(n);
}

/** Goal-based scoring from per-serving nutrition. */
export function goalContributions(
  goal: EffectiveGoal,
  n: NonNullable<MealCard['nutrition']>,
  showCalories: boolean,
): Contribution[] {
  const T = THRESHOLDS;
  const out: Contribution[] = [];
  const proteinPer100Kcal = n.energyKcal > 0 ? (n.proteinG / n.energyKcal) * 100 : 0;
  const kcal = showCalories ? ` (about ${n.energyKcal} kcal)` : '';
  const fibre = n.fibreG ?? 0;

  switch (goal) {
    case 'BUILD_MUSCLE':
      if (n.proteinG >= T.veryHighProteinG)
        out.push({ points: 38, reason: `About ${round(n.proteinG)} g of protein per serving, useful for your muscle-building goal.` });
      else if (n.proteinG >= T.highProteinG)
        out.push({ points: 30, reason: `About ${round(n.proteinG)} g of protein per serving, useful for your muscle-building goal.` });
      else if (n.proteinG >= T.goodProteinG)
        out.push({ points: 15, reason: `A good source of protein (${round(n.proteinG)} g per serving).` });
      if (proteinPer100KcalHigh(proteinPer100Kcal)) out.push({ points: 10 });
      break;

    case 'LOSE_WEIGHT':
      if (n.energyKcal <= T.lighterMealMaxKcal)
        out.push({ points: 20, reason: `A lighter meal per serving${kcal}.` });
      if (n.energyKcal >= T.heavyMealMinKcal) out.push({ points: -15 });
      if (proteinPer100Kcal >= T.proteinPer100KcalGood)
        out.push({ points: 10, reason: 'Plenty of protein for the energy it provides.' });
      if (fibre >= T.fibreGoodG)
        out.push({ points: 10, reason: `A good source of fibre (${round(fibre)} g per serving).` });
      break;

    case 'GAIN_WEIGHT':
      if (n.energyKcal >= T.energyRichMinKcal)
        out.push({ points: 20, reason: `An energy-rich meal${kcal}, helpful when you want to gain weight.` });
      if (n.proteinG >= 25)
        out.push({ points: 10, reason: `Includes ${round(n.proteinG)} g of protein per serving.` });
      break;

    case 'MAINTAIN_WEIGHT':
      if (n.energyKcal >= T.balancedMinKcal && n.energyKcal <= T.balancedMaxKcal)
        out.push({ points: 15, reason: `A balanced portion${kcal}.` });
      if (fibre >= 5) out.push({ points: 5 });
      break;

    case 'EAT_HEALTHIER':
    default:
      if (fibre >= T.fibreGoodG)
        out.push({ points: goal ? 15 : 5, reason: `A good source of fibre (${round(fibre)} g per serving).` });
      if (n.sodiumMg != null && n.sodiumMg <= T.moderateSodiumMaxMg)
        out.push({ points: goal ? 10 : 0, reason: goal ? 'Moderate in salt.' : undefined });
      break;
  }
  return out;
}

function proteinPer100KcalHigh(value: number) {
  return value >= THRESHOLDS.proteinPer100KcalHigh;
}

export function recommend(
  candidates: RecommendationCandidate[],
  profile: ProfileInput,
  { slot, limit = 10, now = new Date() }: RecommendOptions = {},
): RecommendationResponse {
  const notes: string[] = [];
  const userAllergens = new Set(profile.allergens);
  const avoid = new Set(profile.avoidIngredients);
  const liked = new Set(profile.likedIngredients);
  const disliked = new Set(profile.dislikedIngredients);
  const cuisines = new Set(profile.cuisines);

  let goal: EffectiveGoal = profile.goal;
  if (goal === 'LOSE_WEIGHT' && !canReceiveWeightLossTargets(profile.birthYear, now)) {
    goal = 'EAT_HEALTHIER';
    notes.push("Because you're under 18, we suggest balanced, nourishing meals rather than weight-loss meals.");
  }

  let excludedCount = 0;
  const scored: Recommendation[] = [];

  for (const c of candidates) {
    const m = c.card;

    // ── Hard filters (safety and explicit choices) ────────────────────────────
    const unsafe =
      m.allergens.some((a) => userAllergens.has(a)) ||
      (userAllergens.size > 0 && !m.allergenInfoComplete) ||
      (profile.dietType && !dietSatisfies(m.diet, profile.dietType)) ||
      c.requiredIngredients.some((s) => avoid.has(s)) ||
      (profile.maxCookMinutes != null && m.totalMinutes > profile.maxCookMinutes);
    const wrongSlot = slot && !m.slots.includes(slot);
    if (wrongSlot) continue;
    if (unsafe) {
      excludedCount++;
      continue;
    }

    // ── Cautions about optional extras ───────────────────────────────────────
    const cautions: string[] = [];
    for (const o of c.optionalIngredients) {
      const hits = o.allergens.filter((a) => userAllergens.has(a));
      if (hits.length) {
        cautions.push(`Leave out the ${o.name.toLowerCase()}: it contains ${hits.map((a) => ALLERGEN_NAMES[a]).join(' and ')}.`);
      } else if (avoid.has(o.slug)) {
        cautions.push(`Leave out the ${o.name.toLowerCase()}, which you avoid.`);
      }
    }

    // ── Scoring ─────────────────────────────────────────────────────────────
    const contributions: Contribution[] = [];
    if (m.nutrition) {
      contributions.push(...goalContributions(goal, m.nutrition, profile.showCalories));
      if (m.nutrition.sodiumMg != null && m.nutrition.sodiumMg >= THRESHOLDS.highSodiumMinMg) {
        cautions.push('Fairly high in salt; you can use less when cooking.');
      }
    } else {
      cautions.push("We don't have nutrition information for this meal yet.");
    }

    if (profile.dietType && profile.dietType !== 'OMNIVORE') {
      contributions.push({ points: 5, reason: `Fits your ${DIET_NAMES[profile.dietType]} diet.` });
    }
    if (cuisines.has(m.cuisine.slug)) {
      contributions.push({ points: 10, reason: `${m.cuisine.name} food, which you said you enjoy.` });
    }
    const likedHere = c.requiredIngredients.filter((s) => liked.has(s));
    if (likedHere.length) {
      const names = likedHere.slice(0, 2).map((s) => (c.ingredientNames[s] ?? s).toLowerCase());
      contributions.push({ points: Math.min(15, 5 * likedHere.length), reason: `Made with ${names.join(' and ')}, which you like.` });
    }
    const dislikedHere = c.requiredIngredients.filter((s) => disliked.has(s)).length;
    if (dislikedHere) contributions.push({ points: -10 * dislikedHere });

    if (profile.cookingSkill && SKILL_RANK[m.difficulty] > SKILL_RANK[profile.cookingSkill]) {
      contributions.push({ points: -10 });
      cautions.push('A bit more involved than your usual cooking.');
    }
    if (m.totalMinutes <= THRESHOLDS.quickMealMaxMinutes) {
      contributions.push({ points: 5, reason: `Ready in about ${m.totalMinutes} minutes.` });
    }
    if (profile.preferredSlots.length && m.slots.some((s) => profile.preferredSlots.includes(s))) {
      contributions.push({ points: 5 });
    }

    const score = Math.max(0, Math.min(100, 40 + contributions.reduce((sum, x) => sum + x.points, 0)));
    const reasons = contributions
      .filter((x): x is Required<Contribution> => !!x.reason && x.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)
      .map((x) => x.reason);

    scored.push({ meal: m, score, reasons, cautions });
  }

  scored.sort((a, b) => b.score - a.score || a.meal.name.localeCompare(b.meal.name));
  return { items: scored.slice(0, limit), excludedCount, notes };
}
