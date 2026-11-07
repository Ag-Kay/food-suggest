/**
 * USDA FoodData Central client (server-side only).
 *
 * Licence: FDC data is public domain (CC0 1.0). USDA asks that apps credit
 * "U.S. Department of Agriculture, Agricultural Research Service. FoodData Central".
 * The API key must never ship in the mobile app (USDA deactivates leaked keys).
 * Docs: https://fdc.nal.usda.gov/api-guide
 */
import type { NutrientsPer100g } from '../../modules/nutrition/calculator.js';

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

/** USDA nutrient numbers → our fields. All values are per 100 g. */
const NUTRIENT_NUMBERS = {
  energyKcal: '208',
  proteinG: '203',
  fatG: '204',
  carbsG: '205',
  fibreG: '291',
  sugarsG: '269',
  saturatedFatG: '606',
  sodiumMg: '307',
  ironMg: '303',
  calciumMg: '301',
} as const satisfies Record<keyof NutrientsPer100g, string>;

/** Foundation Foods often omit 208 and give Atwater energy instead. */
const ENERGY_FALLBACKS = ['958', '957'] as const;

export interface FdcFood {
  fdcId: number;
  description: string;
  dataType: string;
  nutrients: NutrientsPer100g;
}

export class FdcError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'FdcError';
  }
}

type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export interface FdcClientOptions {
  apiKey: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}

/** Raw nutrient entry in either the "full" or "abridged" response format. */
interface RawNutrient {
  number?: string;
  nutrientNumber?: string;
  amount?: number;
  value?: number;
  nutrient?: { number?: string };
}

export function parseFdcNutrients(foodNutrients: RawNutrient[]): NutrientsPer100g {
  const byNumber = new Map<string, number>();
  for (const n of foodNutrients) {
    const num = n.nutrient?.number ?? n.number ?? n.nutrientNumber;
    const amount = n.amount ?? n.value;
    if (num && typeof amount === 'number' && Number.isFinite(amount)) byNumber.set(num, amount);
  }

  const get = (num: string) => byNumber.get(num) ?? null;
  let energy = get(NUTRIENT_NUMBERS.energyKcal);
  for (const fallback of ENERGY_FALLBACKS) energy ??= get(fallback);

  const core = {
    energyKcal: energy,
    proteinG: get(NUTRIENT_NUMBERS.proteinG),
    carbsG: get(NUTRIENT_NUMBERS.carbsG),
    fatG: get(NUTRIENT_NUMBERS.fatG),
  };
  const missing = Object.entries(core)
    .filter(([, v]) => v == null)
    .map(([k]) => k);
  if (missing.length) {
    throw new FdcError(`FDC food is missing core nutrients: ${missing.join(', ')}`);
  }

  return {
    energyKcal: core.energyKcal!,
    proteinG: core.proteinG!,
    carbsG: core.carbsG!,
    fatG: core.fatG!,
    fibreG: get(NUTRIENT_NUMBERS.fibreG),
    sugarsG: get(NUTRIENT_NUMBERS.sugarsG),
    saturatedFatG: get(NUTRIENT_NUMBERS.saturatedFatG),
    sodiumMg: get(NUTRIENT_NUMBERS.sodiumMg),
    ironMg: get(NUTRIENT_NUMBERS.ironMg),
    calciumMg: get(NUTRIENT_NUMBERS.calciumMg),
  };
}

export function parseFdcFood(raw: unknown): FdcFood {
  const r = raw as {
    fdcId?: number;
    description?: string;
    dataType?: string;
    foodNutrients?: RawNutrient[];
  };
  if (typeof r?.fdcId !== 'number' || !Array.isArray(r.foodNutrients)) {
    throw new FdcError('Unexpected FDC response shape');
  }
  return {
    fdcId: r.fdcId,
    description: r.description ?? '',
    dataType: r.dataType ?? '',
    nutrients: parseFdcNutrients(r.foodNutrients),
  };
}

export function createFdcClient({ apiKey, fetchImpl = fetch, timeoutMs = 15_000 }: FdcClientOptions) {
  if (!apiKey) throw new FdcError('USDA_FDC_API_KEY is not set');

  async function request(path: string, params: Record<string, string>) {
    const url = new URL(BASE_URL + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set('api_key', apiKey);

    const res = await fetchImpl(url.toString(), { signal: AbortSignal.timeout(timeoutMs) });
    if (res.status === 429) throw new FdcError('FDC rate limit reached; try again later', 429);
    if (!res.ok) throw new FdcError(`FDC request failed with status ${res.status}`, res.status);
    return res.json();
  }

  return {
    /** Fetches one food and returns its nutrients per 100 g, plus the raw payload. */
    async getFood(fdcId: number): Promise<{ food: FdcFood; raw: unknown }> {
      const raw = await request(`/food/${fdcId}`, {});
      return { food: parseFdcFood(raw), raw };
    },
  };
}
