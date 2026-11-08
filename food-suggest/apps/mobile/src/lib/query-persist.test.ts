import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';

import { isOnlineState } from './network';
import {
  QUERY_CACHE_KEY,
  QUERY_CACHE_MAX_AGE,
  QUERY_CACHE_MAX_QUERIES,
  QUERY_CACHE_VERSION,
  persistQueryCache,
  restoreQueryCache,
  snapshot,
} from './query-persist';

const client = () => new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });

beforeEach(() => AsyncStorage.clear());

describe('snapshot', () => {
  it('keeps catalogue queries and leaves out account data and failures', () => {
    const qc = client();
    qc.setQueryData(['meals', 'detail', 'waakye'], { slug: 'waakye' });
    qc.setQueryData(['catalogue', 'ingredients'], { items: [] });
    qc.setQueryData(['recommendations', {}, null, 10], { items: [] });
    qc.setQueryData(['me', 'user-1'], { email: 'a@b.c' });
    qc.setQueryData(['favorites', 'user-1'], { items: [] });
    const keys = snapshot(qc).state.queries.map((q) => q.queryKey[0]);
    expect(keys.sort()).toEqual(['catalogue', 'meals', 'recommendations']);
  });

  it('keeps only the most recently updated queries', () => {
    const qc = client();
    for (let i = 0; i < QUERY_CACHE_MAX_QUERIES + 5; i++) {
      qc.setQueryData(['meals', 'detail', `m${i}`], { i }, { updatedAt: 1000 + i });
    }
    const saved = snapshot(qc).state.queries;
    expect(saved).toHaveLength(QUERY_CACHE_MAX_QUERIES);
    expect(saved.some((q) => q.queryKey[2] === 'm0')).toBe(false);
    expect(saved.some((q) => q.queryKey[2] === `m${QUERY_CACHE_MAX_QUERIES + 4}`)).toBe(true);
  });
});

describe('restoreQueryCache', () => {
  it('round-trips saved meals into a new client', async () => {
    const qc = client();
    qc.setQueryData(['meals', 'detail', 'waakye'], { slug: 'waakye' });
    await AsyncStorage.setItem(QUERY_CACHE_KEY, JSON.stringify(snapshot(qc)));

    const next = client();
    await restoreQueryCache(next);
    expect(next.getQueryData(['meals', 'detail', 'waakye'])).toEqual({ slug: 'waakye' });
  });

  it('drops a cache from another version, an old cache and old queries', async () => {
    const now = Date.now();
    const qc = client();
    qc.setQueryData(['meals', 'detail', 'old'], 1, { updatedAt: now - QUERY_CACHE_MAX_AGE - 1 });
    qc.setQueryData(['meals', 'detail', 'new'], 2, { updatedAt: now });

    await AsyncStorage.setItem(QUERY_CACHE_KEY, JSON.stringify({ ...snapshot(qc, now), version: QUERY_CACHE_VERSION + 1 }));
    const a = client();
    await restoreQueryCache(a, now);
    expect(a.getQueryData(['meals', 'detail', 'new'])).toBeUndefined();
    expect(await AsyncStorage.getItem(QUERY_CACHE_KEY)).toBeNull();

    await AsyncStorage.setItem(QUERY_CACHE_KEY, JSON.stringify(snapshot(qc, now)));
    const b = client();
    await restoreQueryCache(b, now);
    expect(b.getQueryData(['meals', 'detail', 'new'])).toBe(2);
    expect(b.getQueryData(['meals', 'detail', 'old'])).toBeUndefined();

    await AsyncStorage.setItem(QUERY_CACHE_KEY, JSON.stringify(snapshot(qc, now - QUERY_CACHE_MAX_AGE - 1)));
    const c = client();
    await restoreQueryCache(c, now);
    expect(c.getQueryData(['meals', 'detail', 'new'])).toBeUndefined();
  });

  it('ignores a corrupt cache', async () => {
    await AsyncStorage.setItem(QUERY_CACHE_KEY, '{not json');
    await expect(restoreQueryCache(client())).resolves.toBeUndefined();
    expect(await AsyncStorage.getItem(QUERY_CACHE_KEY)).toBeNull();
  });
});

describe('persistQueryCache', () => {
  it('saves after changes and when stopped', async () => {
    const qc = client();
    const stop = persistQueryCache(qc, 60_000);
    qc.setQueryData(['meals', 'detail', 'waakye'], { slug: 'waakye' });
    stop(); // flushes the pending save
    await new Promise((r) => setTimeout(r, 0));
    const saved = JSON.parse((await AsyncStorage.getItem(QUERY_CACHE_KEY))!);
    expect(saved.state.queries[0].queryKey).toEqual(['meals', 'detail', 'waakye']);
  });
});

describe('isOnlineState', () => {
  it('treats unknown as online and only a definite no as offline', () => {
    expect(isOnlineState({ isConnected: true, isInternetReachable: null })).toBe(true);
    expect(isOnlineState({ isConnected: null, isInternetReachable: null })).toBe(true);
    expect(isOnlineState({ isConnected: false, isInternetReachable: null })).toBe(false);
    expect(isOnlineState({ isConnected: true, isInternetReachable: false })).toBe(false);
  });
});
