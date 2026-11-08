import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { rangeLabel, type DateKey } from '@/features/plan/dates';
import { entriesBetween, useMealPlan } from '@/stores/meal-plan';
import { toShoppingItems, useShoppingLists } from '@/stores/shopping-lists';

import { generateShoppingList } from './api';

/**
 * Builds (or refreshes) the shopping list for a range of plan days and opens it.
 * A list already made from the same days is updated instead of duplicated.
 */
export function useMakeShoppingList() {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ open = true, ...range }: { start: DateKey; end: DateKey; open?: boolean }) => {
      const entries = entriesBetween(useMealPlan.getState().entries, range.start, range.end);
      if (!entries.length) throw new Error('There are no meals planned for these days.');
      return { range, open, result: await generateShoppingList(entries) };
    },
    onSuccess: ({ range, open, result }) => {
      const store = useShoppingLists.getState();
      const items = toShoppingItems(result.items);
      const existing = store.lists.find((l) => l.fromPlan?.start === range.start && l.fromPlan?.end === range.end);
      const listId = existing
        ? (store.replaceGenerated(existing.id, items, range), existing.id)
        : store.create({ name: `Meals for ${rangeLabel(range.start, range.end)}`, fromPlan: range, items }).id;

      if (result.skipped.length) {
        Alert.alert(
          'Some meals were left out',
          `${result.skipped.length} planned meal${result.skipped.length === 1 ? ' is' : 's are'} no longer available, so ${result.skipped.length === 1 ? 'it is' : 'they are'} not on the list.`,
        );
      }
      if (open) router.push({ pathname: '/lists/[id]', params: { id: listId } });
    },
    onError: (error) => Alert.alert("Couldn't make the shopping list", error.message),
  });
}
