/**
 * Stores synced meal-plan entries and shopping lists. The merge rules live in `merge.ts`;
 * this file only loads, writes and maps rows. Every query is scoped to one user id.
 */
import {
  ShoppingListItems,
  type PlanEntrySync,
  type ShoppingListSync,
  type SyncRequest,
  type SyncResponse,
} from '@food-suggest/shared';

import type { Prisma } from '../../generated/prisma/client.ts';
import type { Db } from '../../lib/db.js';
import { finalState, planSync } from './merge.js';

export interface SyncRepository {
  sync(userId: string, request: SyncRequest, now?: Date): Promise<SyncResponse>;
}

const toDate = (key: string) => new Date(`${key}T00:00:00Z`);
const toKey = (d: Date) => d.toISOString().slice(0, 10);

type PlanRow = Prisma.PlanEntryGetPayload<object>;
type ListRow = Prisma.ShoppingListGetPayload<object>;

function planFromRow(r: PlanRow): PlanEntrySync {
  const changedAt = r.changedAt.getTime();
  if (r.deleted) return { id: r.id, changedAt, deleted: true };
  return { id: r.id, changedAt, deleted: false, date: toKey(r.date), slot: r.slot, slug: r.mealSlug, name: r.mealName, servings: r.servings };
}

function listFromRow(r: ListRow): ShoppingListSync {
  const changedAt = r.changedAt.getTime();
  if (r.deleted) return { id: r.id, changedAt, deleted: true };
  // Stored JSON was validated on the way in; parse again so a bad row can't reach a client.
  const items = ShoppingListItems.safeParse(r.items);
  return {
    id: r.id,
    changedAt,
    deleted: false,
    name: r.name,
    createdAt: r.createdAt.getTime(),
    ...(r.fromPlanStart && r.fromPlanEnd && { fromPlan: { start: toKey(r.fromPlanStart), end: toKey(r.fromPlanEnd) } }),
    items: items.success ? items.data : [],
  };
}

function planToRow(userId: string, r: PlanEntrySync): Prisma.PlanEntryCreateManyInput {
  const base = { userId, id: r.id, changedAt: new Date(r.changedAt) };
  if (r.deleted) return { ...base, deleted: true, date: new Date(0), slot: 'DINNER', mealSlug: '', mealName: '', servings: 1 };
  return { ...base, deleted: false, date: toDate(r.date), slot: r.slot, mealSlug: r.slug, mealName: r.name, servings: r.servings };
}

function listToRow(userId: string, r: ShoppingListSync, createdFallback: number): Prisma.ShoppingListCreateManyInput {
  const base = { userId, id: r.id, changedAt: new Date(r.changedAt) };
  if (r.deleted) return { ...base, deleted: true, name: '', items: [], createdAt: new Date(createdFallback) };
  return {
    ...base,
    deleted: false,
    name: r.name,
    createdAt: new Date(r.createdAt),
    fromPlanStart: r.fromPlan ? toDate(r.fromPlan.start) : null,
    fromPlanEnd: r.fromPlan ? toDate(r.fromPlan.end) : null,
    items: r.items as Prisma.InputJsonValue,
  };
}

export function createSyncRepository(db: Db): SyncRepository {
  return {
    async sync(userId, request, now = new Date()) {
      const nowMs = now.getTime();
      return db.$transaction(async (tx) => {
        const [planRows, listRows] = await Promise.all([
          tx.planEntry.findMany({ where: { userId } }),
          tx.shoppingList.findMany({ where: { userId } }),
        ]);
        const plan = planSync(
          { planEntries: planRows.map(planFromRow), shoppingLists: listRows.map(listFromRow) },
          request,
          nowMs,
        );

        // Replace the winners and drop purged records. Ids are scoped to this user.
        const planIds = [...plan.planEntries.changed.map((r) => r.id), ...plan.planEntries.purge];
        const listIds = [...plan.shoppingLists.changed.map((r) => r.id), ...plan.shoppingLists.purge];
        if (planIds.length) await tx.planEntry.deleteMany({ where: { userId, id: { in: planIds } } });
        if (listIds.length) await tx.shoppingList.deleteMany({ where: { userId, id: { in: listIds } } });

        const purgedPlan = new Set(plan.planEntries.purge);
        const purgedLists = new Set(plan.shoppingLists.purge);
        const planWrites = plan.planEntries.changed.filter((r) => !purgedPlan.has(r.id)).map((r) => planToRow(userId, r));
        const listWrites = plan.shoppingLists.changed
          .filter((r) => !purgedLists.has(r.id))
          .map((r) => listToRow(userId, r, nowMs));
        if (planWrites.length) await tx.planEntry.createMany({ data: planWrites });
        if (listWrites.length) await tx.shoppingList.createMany({ data: listWrites });

        return { ...finalState(plan), serverTime: nowMs };
      });
    },
  };
}
