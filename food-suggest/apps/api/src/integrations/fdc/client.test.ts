import { describe, expect, it, vi } from 'vitest';

import { createFdcClient, FdcError, parseFdcFood, parseFdcNutrients } from './client.js';

// Shapes follow the FDC API; numbers are illustrative.
const full = {
  fdcId: 1,
  description: 'Test food',
  dataType: 'SR Legacy',
  foodNutrients: [
    { nutrient: { number: '208' }, amount: 200 },
    { nutrient: { number: '203' }, amount: 20 },
    { nutrient: { number: '204' }, amount: 13 },
    { nutrient: { number: '205' }, amount: 0 },
    { nutrient: { number: '307' }, amount: 59 },
  ],
};

describe('parseFdcNutrients', () => {
  it('maps the full response format', () => {
    const n = parseFdcFood(full).nutrients;
    expect(n).toMatchObject({ energyKcal: 200, proteinG: 20, fatG: 13, carbsG: 0, sodiumMg: 59 });
    expect(n.fibreG).toBeNull();
  });

  it('maps the abridged format and falls back to Atwater energy', () => {
    const n = parseFdcNutrients([
      { number: '958', amount: 150 },
      { number: '203', amount: 10 },
      { number: '204', amount: 5 },
      { number: '205', amount: 12 },
    ]);
    expect(n.energyKcal).toBe(150);
  });

  it('refuses foods without core nutrients', () => {
    expect(() => parseFdcNutrients([{ number: '203', amount: 1 }])).toThrow(FdcError);
  });
});

describe('createFdcClient', () => {
  it('requires an API key', () => {
    expect(() => createFdcClient({ apiKey: '' })).toThrow(/USDA_FDC_API_KEY/);
  });

  it('fetches a food and sends the key as a query parameter', async () => {
    const fetchImpl = vi.fn(async (_url: string) => ({ ok: true, status: 200, json: async () => full }));
    const client = createFdcClient({ apiKey: 'test-key', fetchImpl });
    const { food } = await client.getFood(1);
    expect(food.fdcId).toBe(1);
    const url = new URL(fetchImpl.mock.calls[0]![0]);
    expect(url.pathname).toBe('/fdc/v1/food/1');
    expect(url.searchParams.get('api_key')).toBe('test-key');
  });

  it('reports rate limiting clearly', async () => {
    const fetchImpl = async () => ({ ok: false, status: 429, json: async () => ({}) });
    const client = createFdcClient({ apiKey: 'k', fetchImpl });
    await expect(client.getFood(1)).rejects.toMatchObject({ status: 429 });
  });
});
