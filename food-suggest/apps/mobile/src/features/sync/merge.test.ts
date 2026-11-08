import { SyncRequest } from '@food-suggest/shared';

import type { PlanEntry } from '@/stores/meal-plan';
import type { ShoppingList } from '@/stores/shopping-lists';

import { buildSyncRequest, listFromSync, listsToSync, mergeLocal, planFromSync, planToSync, type Remote } from './merge';

const entry = (id: string, changedAt: number, extra: Partial<PlanEntry> = {}): PlanEntry => ({
  id,
  date: '2026-11-09',
  slot: 'LUNCH',
  slug: 'waakye',
  name: 'Waakye',
  servings: 2,
  changedAt,
  ...extra,
});
const remote = (e: PlanEntry): Remote<PlanEntry> => ({ id: e.id, changedAt: e.changedAt, record: e });
const gone = (id: string, changedAt: number): Remote<PlanEntry> => ({ id, changedAt, record: null });
const at = (e: PlanEntry) => e.changedAt;

describe('mergeLocal', () => {
  it('adds records from other devices and keeps newer local edits', () => {
    const { records } = mergeLocal(
      [entry('mine', 300, { servings: 5 }), entry('only-local', 100)],
      {},
      [remote(entry('mine', 200, { servings: 1 })), remote(entry('from-other-phone', 50))],
      at,
    );
    const byId = Object.fromEntries(records.map((r) => [r.id, r]));
    expect(byId.mine!.servings).toBe(5);
    expect(byId['only-local']).toBeDefined(); // made during the request: uploads next time
    expect(byId['from-other-phone']).toBeDefined();
  });

  it('applies deletions from other devices', () => {
    const { records } = mergeLocal([entry('a', 100)], {}, [gone('a', 200)], at);
    expect(records).toEqual([]);
  });

  it('keeps a local edit made after a remote deletion', () => {
    const { records } = mergeLocal([entry('a', 300)], {}, [gone('a', 200)], at);
    expect(records.map((r) => r.id)).toEqual(['a']);
  });

  it('drops a local tombstone once the account has it, keeps it until then', () => {
    const acknowledged = mergeLocal([], { a: 200 }, [gone('a', 200)], at);
    expect(acknowledged.tombstones).toEqual({});
    const pending = mergeLocal([], { b: 500 }, [remote(entry('b', 100))], at);
    expect(pending.records).toEqual([]); // our deletion is newer: the entry stays gone
    expect(pending.tombstones).toEqual({ b: 500 });
  });

  it('lets a newer edit from another device win over a local deletion', () => {
    const { records, tombstones } = mergeLocal([], { a: 100 }, [remote(entry('a', 300))], at);
    expect(records.map((r) => r.id)).toEqual(['a']);
    expect(tombstones).toEqual({});
  });
});

describe('sync format', () => {
  const list: ShoppingList = {
    id: 'l1',
    name: 'Week',
    createdAt: 10,
    updatedAt: 20,
    fromPlan: { start: '2026-11-09', end: '2026-11-15' },
    items: [{ id: 'i1', name: 'Onion', amountText: '150 g', category: 'Vegetables', checked: false, source: 'GENERATED', key: 'onion:mass', meals: ['Waakye'] }],
  };

  it('builds requests the API accepts, including tombstones', () => {
    const req = buildSyncRequest({ entries: [entry('a', 100)], tombstones: { b: 200 } }, { lists: [list], tombstones: { l9: 300 } });
    expect(SyncRequest.safeParse(req).success).toBe(true);
    expect(req.planEntries).toContainEqual({ id: 'b', changedAt: 200, deleted: true });
    expect(req.shoppingLists).toContainEqual({ id: 'l9', changedAt: 300, deleted: true });
  });

  it('round-trips records through the sync format', () => {
    const [sent] = planToSync([entry('a', 100)], {});
    expect(planFromSync(sent!).record).toEqual(entry('a', 100));
    const [sentList] = listsToSync([list], {});
    expect(listFromSync(sentList!).record).toEqual(list);
  });
});
