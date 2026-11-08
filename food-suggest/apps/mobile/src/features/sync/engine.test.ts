import { onlineManager } from '@tanstack/react-query';

import type { SyncRequest, SyncResponse } from '@food-suggest/shared';

import { apiPost } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { useMealPlan } from '@/stores/meal-plan';
import { useShoppingLists } from '@/stores/shopping-lists';

import { OFFLINE_MESSAGE, syncNow, useSyncStatus } from './engine';

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, apiPost: jest.fn() };
});
jest.mock('@/lib/supabase', () => ({ supabase: null, isAuthConfigured: false, getAccessToken: async () => null }));

const post = apiPost as jest.MockedFunction<typeof apiPost>;
const signIn = (id: string) => useAuth.setState({ session: { user: { id } } as never, ready: true });
const future = '2099-01-05';

/** A tiny in-memory account using newest-wins, like the API. */
function fakeServer() {
  const store = new Map<string, SyncResponse['planEntries'][number]>();
  post.mockImplementation(async (_path, body) => {
    for (const r of (body as SyncRequest).planEntries) {
      const existing = store.get(r.id);
      if (!existing || r.changedAt > existing.changedAt) store.set(r.id, r);
    }
    return { planEntries: [...store.values()], shoppingLists: [], serverTime: Date.now() } as never;
  });
  return store;
}

beforeEach(() => {
  post.mockReset();
  useMealPlan.getState().clear();
  useShoppingLists.getState().clear();
  useSyncStatus.setState({ lastSyncedAt: null, error: null });
  useAuth.setState({ session: null, ready: true });
});

describe('syncNow', () => {
  it('does nothing when signed out', async () => {
    await syncNow();
    expect(post).not.toHaveBeenCalled();
  });

  it('uploads what was planned before signing in, and a second phone receives it', async () => {
    const server = fakeServer();
    useMealPlan.getState().add({ date: future, slot: 'DINNER', slug: 'waakye', name: 'Waakye', servings: 2 });
    signIn('user-1');
    await syncNow();
    expect(server.size).toBe(1);
    expect(useSyncStatus.getState().lastSyncedAt).not.toBeNull();

    // "Second phone": empty plan, same account.
    useMealPlan.getState().clear();
    await syncNow();
    expect(useMealPlan.getState().entries).toEqual([expect.objectContaining({ slug: 'waakye', servings: 2 })]);
  });

  it('sends deletions and forgets the tombstone once the account has it', async () => {
    const server = fakeServer();
    signIn('user-1');
    const e = useMealPlan.getState().add({ date: future, slot: 'LUNCH', slug: 'red-red', name: 'Red red', servings: 1 });
    await syncNow();
    useMealPlan.getState().remove(e.id);
    await syncNow();
    expect(server.get(e.id)).toMatchObject({ deleted: true });
    expect(useMealPlan.getState().tombstones).toEqual({});
    expect(useMealPlan.getState().entries).toEqual([]);
  });

  it('keeps local data and reports an error when the request fails', async () => {
    post.mockRejectedValueOnce(new Error('offline'));
    signIn('user-1');
    useMealPlan.getState().add({ date: future, slot: 'LUNCH', slug: 'red-red', name: 'Red red', servings: 1 });
    await syncNow();
    expect(useMealPlan.getState().entries).toHaveLength(1);
    expect(useSyncStatus.getState().error).toMatch(/try again/);
  });

  it('ignores a response that arrives after signing out', async () => {
    signIn('user-1');
    post.mockImplementationOnce(async () => {
      useAuth.setState({ session: null });
      return { planEntries: [{ id: 'x', changedAt: 1, deleted: false, date: future, slot: 'LUNCH', slug: 'a', name: 'A', servings: 1 }], shoppingLists: [], serverTime: 1 } as never;
    });
    await syncNow();
    expect(useMealPlan.getState().entries).toEqual([]);
  });

  it('waits while offline and says so, without calling the API', async () => {
    signIn('user-1');
    onlineManager.setOnline(false);
    try {
      await syncNow();
      expect(post).not.toHaveBeenCalled();
      expect(useSyncStatus.getState().error).toBe(OFFLINE_MESSAGE);
    } finally {
      onlineManager.setOnline(true);
    }
  });
});
