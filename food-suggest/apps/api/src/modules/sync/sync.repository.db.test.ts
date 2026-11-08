/**
 * Runs the real sync repository against the development database.
 * Enabled with RUN_DB_TESTS=1 (needs `pnpm db:dev` and `pnpm db:setup`).
 */
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PlanEntrySync, ShoppingListSync } from '@food-suggest/shared';

import { createDb, type Db } from '../../lib/db.js';
import { createAccountRepository } from '../me/account.repository.js';
import { createSyncRepository, type SyncRepository } from './sync.repository.js';

const enabled = process.env.RUN_DB_TESTS === '1';

describe.skipIf(!enabled)('sync repository (database)', () => {
  let db: Db;
  let repo: SyncRepository;
  const a = randomUUID();
  const b = randomUUID();
  const now = new Date();
  const t = now.getTime();

  const entry: PlanEntrySync = { id: 'e1', changedAt: t - 1000, deleted: false, date: '2026-11-09', slot: 'DINNER', slug: 'jollof-rice-chicken', name: 'Jollof rice with chicken', servings: 4 };
  const list: ShoppingListSync = {
    id: 'l1',
    changedAt: t - 1000,
    deleted: false,
    name: 'Week',
    createdAt: t - 5000,
    fromPlan: { start: '2026-11-09', end: '2026-11-15' },
    items: [{ id: 'i1', name: 'Onion', amountText: '150 g', category: 'Vegetables', checked: true, source: 'GENERATED', key: 'onion:mass', optional: false, meals: ['Jollof'] }],
  };

  beforeAll(async () => {
    try {
      process.loadEnvFile();
    } catch {
      /* env already set */
    }
    db = createDb(process.env.DATABASE_URL!);
    repo = createSyncRepository(db);
    const accounts = createAccountRepository(db);
    await accounts.ensureUser({ userId: a, email: null });
    await accounts.ensureUser({ userId: b, email: null });
  });

  afterAll(async () => {
    await db.user.deleteMany({ where: { id: { in: [a, b] } } });
    await db.$disconnect();
  });

  it('round-trips plan entries and lists exactly', async () => {
    const res = await repo.sync(a, { planEntries: [entry], shoppingLists: [list] }, now);
    expect(res.planEntries).toEqual([entry]);
    expect(res.shoppingLists).toEqual([list]);
    const again = await repo.sync(a, { planEntries: [], shoppingLists: [] }, now);
    expect(again.planEntries).toEqual([entry]);
    expect(again.shoppingLists).toEqual([list]);
  });

  it('applies newest-wins and tombstones', async () => {
    await repo.sync(a, { planEntries: [{ ...entry, servings: 1, changedAt: t - 5000 }], shoppingLists: [] }, now);
    expect((await repo.sync(a, { planEntries: [], shoppingLists: [] }, now)).planEntries[0]).toMatchObject({ servings: 4 });
    const res = await repo.sync(a, { planEntries: [], shoppingLists: [{ id: 'l1', changedAt: t, deleted: true }] }, now);
    expect(res.shoppingLists).toEqual([{ id: 'l1', changedAt: t, deleted: true }]);
  });

  it('keeps users apart with identical record ids', async () => {
    await repo.sync(b, { planEntries: [{ ...entry, slug: 'red-red', name: 'Red red' }], shoppingLists: [] }, now);
    expect((await repo.sync(a, { planEntries: [], shoppingLists: [] }, now)).planEntries[0]).toMatchObject({ slug: 'jollof-rice-chicken' });
    expect((await repo.sync(b, { planEntries: [], shoppingLists: [] }, now)).planEntries[0]).toMatchObject({ slug: 'red-red' });
  });

  it('is removed with the account', async () => {
    await createAccountRepository(db).deleteUserData(b);
    expect(await db.planEntry.count({ where: { userId: b } })).toBe(0);
  });
});
