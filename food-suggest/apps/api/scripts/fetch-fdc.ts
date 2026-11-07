/**
 * Downloads the USDA FoodData Central foods referenced in prisma/seed/ingredients.ts
 * and saves them under prisma/seed/data/fdc/<fdcId>.json.
 *
 * FDC data is public domain (CC0), so these snapshots are committed: the seed then
 * runs without an API key and gives the same result every time.
 *
 * Usage: USDA_FDC_API_KEY=... pnpm fdc:fetch [--force]
 * (Falls back to USDA's public DEMO_KEY, limited to a few requests per hour.)
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createFdcClient } from '../src/integrations/fdc/client.js';
import { INGREDIENTS } from '../prisma/seed/ingredients.js';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'prisma', 'seed', 'data', 'fdc');
const force = process.argv.includes('--force');

try {
  process.loadEnvFile();
} catch {
  // no .env
}

const apiKey = process.env.USDA_FDC_API_KEY || 'DEMO_KEY';
if (apiKey === 'DEMO_KEY') console.warn('USDA_FDC_API_KEY not set: using DEMO_KEY (low rate limit).');

const client = createFdcClient({ apiKey });
mkdirSync(dataDir, { recursive: true });

for (const ing of INGREDIENTS) {
  if (ing.nutrients?.source !== 'usda-fdc') continue;
  const file = join(dataDir, `${ing.nutrients.fdcId}.json`);
  if (existsSync(file) && !force) {
    console.log(`✓ ${ing.slug}: already saved`);
    continue;
  }
  const { food, raw } = await client.getFood(ing.nutrients.fdcId);
  writeFileSync(file, JSON.stringify(raw, null, 1));
  console.log(`↓ ${ing.slug}: ${food.description} (${food.nutrients.energyKcal} kcal/100 g)`);
}
