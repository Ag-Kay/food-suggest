import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { GeneratedShoppingItem } from '@food-suggest/shared';

import type { DateKey } from '@/features/plan/dates';
import { localId } from '@/lib/local-id';

import { deviceStorage } from './persist-storage';

export interface ShoppingItem {
  id: string;
  name: string;
  /** Free text, e.g. "440 g", "2 bunches", "" when not given. */
  amountText: string;
  category: string;
  checked: boolean;
  source: 'GENERATED' | 'MANUAL';
  /** Generated items only: identifies the ingredient + unit line, so regenerating keeps ticks. */
  key?: string;
  optional?: boolean;
  meals?: string[];
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** The plan days this list was made from, so it can be updated when the plan changes. */
  fromPlan?: { start: DateKey; end: DateKey };
  items: ShoppingItem[];
}

export const MANUAL_CATEGORY = 'Added by you';
export const MAX_ITEM_TEXT = 80;

const clean = (text: string) => text.trim().replace(/\s+/g, ' ').slice(0, MAX_ITEM_TEXT);

export function toShoppingItems(generated: GeneratedShoppingItem[]): ShoppingItem[] {
  return generated.map((g) => ({
    id: localId(),
    key: g.key,
    name: g.name,
    amountText: g.amountText,
    category: g.category,
    checked: false,
    source: 'GENERATED',
    optional: g.optional,
    meals: g.meals,
  }));
}

interface ShoppingListsState {
  lists: ShoppingList[];
  create: (input: { name: string; fromPlan?: ShoppingList['fromPlan']; items?: ShoppingItem[] }) => ShoppingList;
  rename: (listId: string, name: string) => void;
  remove: (listId: string) => void;
  /**
   * Replaces the generated items with a fresh set (after the plan changed). Manual items stay;
   * ticks survive for lines that are still needed.
   */
  replaceGenerated: (listId: string, items: ShoppingItem[], fromPlan?: ShoppingList['fromPlan']) => void;
  addItem: (listId: string, input: { name: string; amountText?: string }) => void;
  updateItem: (listId: string, itemId: string, input: { name: string; amountText: string }) => void;
  toggleItem: (listId: string, itemId: string) => void;
  removeItem: (listId: string, itemId: string) => void;
  clearChecked: (listId: string) => void;
  clear: () => void;
}

/** Shopping lists. Stored on this device only (account sync arrives in M5b). */
export const useShoppingLists = create<ShoppingListsState>()(
  persist(
    (set) => {
      const edit = (listId: string, change: (list: ShoppingList) => Partial<ShoppingList>) =>
        set((s) => ({
          lists: s.lists.map((l) => (l.id === listId ? { ...l, ...change(l), updatedAt: Date.now() } : l)),
        }));
      const editItems = (listId: string, change: (items: ShoppingItem[]) => ShoppingItem[]) =>
        edit(listId, (l) => ({ items: change(l.items) }));

      return {
        lists: [],
        create: ({ name, fromPlan, items = [] }) => {
          const now = Date.now();
          const list: ShoppingList = { id: localId(), name: clean(name) || 'Shopping list', createdAt: now, updatedAt: now, fromPlan, items };
          set((s) => ({ lists: [list, ...s.lists] }));
          return list;
        },
        rename: (listId, name) => {
          const value = clean(name);
          if (value) edit(listId, () => ({ name: value }));
        },
        remove: (listId) => set((s) => ({ lists: s.lists.filter((l) => l.id !== listId) })),
        replaceGenerated: (listId, items, fromPlan) =>
          edit(listId, (l) => {
            const ticked = new Set(l.items.filter((i) => i.source === 'GENERATED' && i.checked).map((i) => i.key));
            const manual = l.items.filter((i) => i.source === 'MANUAL');
            return {
              items: [...items.map((i) => ({ ...i, checked: ticked.has(i.key) })), ...manual],
              ...(fromPlan && { fromPlan }),
            };
          }),
        addItem: (listId, { name, amountText = '' }) => {
          const value = clean(name);
          if (!value) return;
          editItems(listId, (items) => [
            ...items,
            { id: localId(), name: value, amountText: clean(amountText), category: MANUAL_CATEGORY, checked: false, source: 'MANUAL' },
          ]);
        },
        updateItem: (listId, itemId, { name, amountText }) => {
          const value = clean(name);
          if (!value) return;
          editItems(listId, (items) => items.map((i) => (i.id === itemId ? { ...i, name: value, amountText: clean(amountText) } : i)));
        },
        toggleItem: (listId, itemId) =>
          editItems(listId, (items) => items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i))),
        removeItem: (listId, itemId) => editItems(listId, (items) => items.filter((i) => i.id !== itemId)),
        clearChecked: (listId) => editItems(listId, (items) => items.filter((i) => !i.checked)),
        clear: () => set({ lists: [] }),
      };
    },
    { name: 'fs.shopping-lists', storage: deviceStorage, version: 1, partialize: (s) => ({ lists: s.lists }) },
  ),
);
