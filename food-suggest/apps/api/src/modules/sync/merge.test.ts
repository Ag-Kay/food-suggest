import type { PlanEntrySync, ShoppingListSync } from '@food-suggest/shared';
import { describe, expect, it } from 'vitest';

import { finalState, MAX_CLOCK_SKEW_MS, mergeRecords, planSync, TOMBSTONE_TTL_MS } from './merge.js';

const NOW = Date.UTC(2026, 10, 8, 12);
const entry = (id: string, changedAt: number, extra: Partial<Extract<PlanEntrySync, { deleted: false }>> = {}): PlanEntrySync => ({
  id,
  changedAt,
  deleted: false,
  date: '2026-11-09',
  slot: 'LUNCH',
  slug: 'waakye',
  name: 'Waakye',
  servings: 2,
  ...extra,
});
const tomb = (id: string, changedAt: number): PlanEntrySync => ({ id, changedAt, deleted: true });

describe('mergeRecords', () => {
  it('keeps the newest change per record', () => {
    const { final, changed } = mergeRecords(
      [entry('a', 100, { servings: 1 }), entry('b', 300)],
      [entry('a', 200, { servings: 4 }), entry('b', 250, { servings: 9 }), entry('c', 50)],
      NOW,
    );
    expect(final.get('a')).toMatchObject({ servings: 4 });
    expect(final.get('b')).toMatchObject({ servings: 2 }); // older incoming change loses
    expect(changed.map((r) => r.id).sort()).toEqual(['a', 'c']);
  });

  it('keeps the stored copy on a tie, so retries are stable', () => {
    const { changed } = mergeRecords([entry('a', 100)], [entry('a', 100, { servings: 5 })], NOW);
    expect(changed).toEqual([]);
  });

  it('lets a deletion win over an older edit, and a newer edit win over a deletion', () => {
    expect(mergeRecords([entry('a', 100)], [tomb('a', 200)], NOW).final.get('a')).toEqual(tomb('a', 200));
    expect(mergeRecords([tomb('a', 200)], [entry('a', 300)], NOW).final.get('a')).toMatchObject({ deleted: false });
  });

  it('caps device clocks that run ahead', () => {
    const { final } = mergeRecords([], [entry('a', NOW + 365 * 86_400_000)], NOW);
    expect(final.get('a')!.changedAt).toBe(NOW + MAX_CLOCK_SKEW_MS);
  });
});

describe('planSync', () => {
  it('purges old tombstones and long-past plan days', () => {
    const plan = planSync(
      {
        planEntries: [tomb('old', NOW - TOMBSTONE_TTL_MS - 1), tomb('recent', NOW - 1000), entry('past', 1, { date: '2026-09-01' })],
        shoppingLists: [],
      },
      { planEntries: [entry('new', NOW)], shoppingLists: [] },
      NOW,
    );
    expect(plan.planEntries.purge.sort()).toEqual(['old', 'past']);
    expect(finalState(plan).planEntries.map((r) => r.id).sort()).toEqual(['new', 'recent']);
  });

  it('refuses to grow an account past its caps', () => {
    const many = Array.from({ length: 101 }, (_, i): ShoppingListSync => ({
      id: `l${i}`,
      changedAt: NOW,
      deleted: false,
      name: 'List',
      createdAt: NOW,
      items: [],
    }));
    expect(() => planSync({ planEntries: [], shoppingLists: [] }, { planEntries: [], shoppingLists: many }, NOW)).toThrow(
      /too large/,
    );
  });
});
