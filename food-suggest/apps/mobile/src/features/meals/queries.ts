import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { MealDetail, MealListQuery, MealListResponse } from '@food-suggest/shared';

import { apiGet } from '@/lib/api';

export type MealFilters = Partial<Omit<MealListQuery, 'limit' | 'offset'>> & { limit?: number };

export const mealKeys = {
  all: ['meals'] as const,
  list: (filters: MealFilters) => ['meals', 'list', filters] as const,
  detail: (slug: string) => ['meals', 'detail', slug] as const,
  cuisines: ['catalogue', 'cuisines'] as const,
};

export function useMealList(filters: MealFilters) {
  return useQuery({
    queryKey: mealKeys.list(filters),
    queryFn: ({ signal }) => apiGet<MealListResponse>('/meals', { query: { limit: 50, ...filters }, signal }),
    placeholderData: keepPreviousData,
  });
}

export const mealDetailQuery = (slug: string) => ({
  queryKey: mealKeys.detail(slug),
  queryFn: ({ signal }: { signal: AbortSignal }) => apiGet<MealDetail>(`/meals/${encodeURIComponent(slug)}`, { signal }),
});

export function useMeal(slug: string | undefined) {
  return useQuery({ ...mealDetailQuery(slug ?? ''), enabled: !!slug });
}

export function useCuisines() {
  return useQuery({
    queryKey: mealKeys.cuisines,
    queryFn: ({ signal }) => apiGet<{ items: { slug: string; name: string }[] }>('/cuisines', { signal }),
    staleTime: 60 * 60_000,
  });
}
