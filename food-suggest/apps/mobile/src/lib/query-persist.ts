import AsyncStorage from '@react-native-async-storage/async-storage';
import { dehydrate, hydrate, type DehydratedState, type Query, type QueryClient } from '@tanstack/react-query';

/**
 * Keeps the meals you've seen readable offline: successful catalogue queries (meal lists, meal
 * pages, ingredients and your picks) are saved on the phone and restored at start-up. Account
 * data ("me", saved meals) is never written here.
 */
export const QUERY_CACHE_KEY = 'food-suggest.query-cache';
/** Bump when an API response shape changes, so old saved data is dropped. */
export const QUERY_CACHE_VERSION = 1;
/** Saved data older than this is ignored (and queries keep it in memory as long). */
export const QUERY_CACHE_MAX_AGE = 7 * 24 * 60 * 60_000;
/** Most recently updated queries kept; the rest are dropped to bound storage. */
export const QUERY_CACHE_MAX_QUERIES = 80;

const PERSISTED_ROOTS = new Set(['meals', 'catalogue', 'recommendations']);

interface SavedCache {
  version: number;
  savedAt: number;
  state: DehydratedState;
}

export function shouldPersist(query: Query): boolean {
  const root = query.queryKey[0];
  return typeof root === 'string' && PERSISTED_ROOTS.has(root) && query.state.status === 'success' && query.state.data !== undefined;
}

export function snapshot(queryClient: QueryClient, now = Date.now()): SavedCache {
  const keep = new Set(
    queryClient
      .getQueryCache()
      .getAll()
      .filter(shouldPersist)
      .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)
      .slice(0, QUERY_CACHE_MAX_QUERIES),
  );
  return {
    version: QUERY_CACHE_VERSION,
    savedAt: now,
    state: dehydrate(queryClient, { shouldDehydrateQuery: (q) => keep.has(q), shouldDehydrateMutation: () => false }),
  };
}

/** Restores saved queries into the client. Never throws: a bad cache is simply discarded. */
export async function restoreQueryCache(queryClient: QueryClient, now = Date.now()): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUERY_CACHE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as SavedCache;
    if (saved?.version !== QUERY_CACHE_VERSION || now - saved.savedAt > QUERY_CACHE_MAX_AGE) {
      await AsyncStorage.removeItem(QUERY_CACHE_KEY);
      return;
    }
    const fresh = saved.state.queries.filter((q) => now - q.state.dataUpdatedAt <= QUERY_CACHE_MAX_AGE);
    hydrate(queryClient, { ...saved.state, queries: fresh });
  } catch {
    await AsyncStorage.removeItem(QUERY_CACHE_KEY).catch(() => {});
  }
}

/** Saves the cache shortly after it changes. Returns an unsubscribe function. */
export function persistQueryCache(queryClient: QueryClient, delayMs = 1000): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const save = () => {
    timer = undefined;
    AsyncStorage.setItem(QUERY_CACHE_KEY, JSON.stringify(snapshot(queryClient))).catch(() => {});
  };
  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' && event.type !== 'removed') return;
    if (!timer) timer = setTimeout(save, delayMs);
  });
  return () => {
    unsubscribe();
    if (timer) {
      clearTimeout(timer);
      save();
    }
  };
}
