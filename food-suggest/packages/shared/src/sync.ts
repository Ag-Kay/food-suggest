import { z } from 'zod';

import { MealSlot } from './enums';
import { MAX_PLAN_SERVINGS } from './shopping';

// Account sync for meal plans and shopping lists (M5b).
//
// Every record has an id created on the phone and `changedAt` (ms since epoch, device clock).
// The newest change wins, per record. Deletions travel as tombstones ({ id, changedAt, deleted: true }).
// The phone sends its records; the server stores the winners and returns the account's full state.

export const RecordId = z.string().regex(/^[a-z0-9-]{1,64}$/);
export const DateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
  }, 'Not a calendar date');
const ChangedAt = z.number().int().positive();
const Text = (max: number) => z.string().trim().min(1).max(max);

const Tombstone = z.object({ id: RecordId, changedAt: ChangedAt, deleted: z.literal(true) }).strict();

export const PlanEntryRecord = z
  .object({
    id: RecordId,
    changedAt: ChangedAt,
    deleted: z.literal(false),
    date: DateKeySchema,
    slot: MealSlot,
    slug: z.string().regex(/^[a-z0-9-]{1,80}$/),
    name: Text(120),
    servings: z.number().int().min(1).max(MAX_PLAN_SERVINGS),
  })
  .strict();
export type PlanEntryRecord = z.infer<typeof PlanEntryRecord>;

export const PlanEntrySync = z.discriminatedUnion('deleted', [PlanEntryRecord, Tombstone]);
export type PlanEntrySync = z.infer<typeof PlanEntrySync>;

export const ShoppingItemRecord = z
  .object({
    id: RecordId,
    name: Text(80),
    amountText: z.string().max(80),
    category: Text(60),
    checked: z.boolean(),
    source: z.enum(['GENERATED', 'MANUAL']),
    key: z.string().max(140).optional(),
    optional: z.boolean().optional(),
    meals: z.array(z.string().max(120)).max(150).optional(),
  })
  .strict();
export type ShoppingItemRecord = z.infer<typeof ShoppingItemRecord>;

export const ShoppingListItems = z.array(ShoppingItemRecord).max(300);

export const ShoppingListRecord = z
  .object({
    id: RecordId,
    changedAt: ChangedAt,
    deleted: z.literal(false),
    name: Text(80),
    createdAt: ChangedAt,
    fromPlan: z.object({ start: DateKeySchema, end: DateKeySchema }).strict().optional(),
    items: ShoppingListItems,
  })
  .strict();
export type ShoppingListRecord = z.infer<typeof ShoppingListRecord>;

export const ShoppingListSync = z.discriminatedUnion('deleted', [ShoppingListRecord, Tombstone]);
export type ShoppingListSync = z.infer<typeof ShoppingListSync>;

/** Per-account caps: generous for a person, small enough to sync whole. */
export const SYNC_LIMITS = { planEntries: 1000, shoppingLists: 100 } as const;

export const SyncRequest = z
  .object({
    planEntries: z.array(PlanEntrySync).max(SYNC_LIMITS.planEntries),
    shoppingLists: z.array(ShoppingListSync).max(SYNC_LIMITS.shoppingLists),
  })
  .strict();
export type SyncRequest = z.infer<typeof SyncRequest>;

export interface SyncResponse {
  /** Every record in the account, including recent tombstones. */
  planEntries: PlanEntrySync[];
  shoppingLists: ShoppingListSync[];
  serverTime: number;
}

/**
 * Newest change wins. On a tie the existing (server) copy is kept, so retrying a sync
 * never flips a record back and forth.
 */
export function incomingWins(existing: { changedAt: number } | undefined, incoming: { changedAt: number }): boolean {
  return !existing || incoming.changedAt > existing.changedAt;
}
