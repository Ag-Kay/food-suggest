import { useMemo } from 'react';

import { useMealList } from './queries';

/**
 * slug → photo URL for every published meal, for places that only store a slug
 * (plan entries, recently viewed). Shares the cached catalogue list.
 */
export function useMealImages(): Map<string, string | null> {
  const list = useMealList({ limit: 50 });
  return useMemo(() => new Map((list.data?.items ?? []).map((m) => [m.slug, m.imageUrl])), [list.data]);
}
