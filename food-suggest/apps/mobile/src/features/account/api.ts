import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  HEALTH_DATA_CONSENT_VERSION,
  type ClaimResponse,
  type FavoritesResponse,
  type MeResponse,
  type ProfileInput,
} from '@food-suggest/shared';

import { apiGet } from '@/lib/api';
import { useAuth } from '@/stores/auth';

export const accountKeys = {
  me: (userId: string | undefined) => ['me', userId] as const,
  favorites: (userId: string | undefined) => ['me', userId, 'favorites'] as const,
};

const useUserId = () => useAuth((s) => s.session?.user.id);

export function useMe() {
  const userId = useUserId();
  return useQuery({
    queryKey: accountKeys.me(userId),
    queryFn: ({ signal }) => apiGet<MeResponse>('/me', { auth: true, signal }),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function fetchMe() {
  return apiGet<MeResponse>('/me', { auth: true });
}

export function giveHealthConsent(granted: boolean) {
  return apiGet<void>('/me/consents', {
    auth: true,
    method: 'POST',
    body: { type: 'HEALTH_DATA', version: HEALTH_DATA_CONSENT_VERSION, granted },
  });
}

export function claimProfile(profile: ProfileInput) {
  return apiGet<ClaimResponse>('/me/claim', { auth: true, method: 'POST', body: { profile } });
}

export function saveProfile(profile: ProfileInput) {
  return apiGet<{ profile: ProfileInput }>('/me/profile', { auth: true, method: 'PUT', body: profile });
}

export function deleteAccount() {
  return apiGet<void>('/me', { auth: true, method: 'DELETE' });
}

export function useFavorites() {
  const userId = useUserId();
  return useQuery({
    queryKey: accountKeys.favorites(userId),
    queryFn: ({ signal }) => apiGet<FavoritesResponse>('/me/favorites', { auth: true, signal }),
    enabled: !!userId,
  });
}

/** Saves or removes a favourite, updating the list immediately and rolling back on failure. */
export function useToggleFavorite() {
  const qc = useQueryClient();
  const userId = useUserId();
  const key = accountKeys.favorites(userId);

  return useMutation({
    mutationFn: ({ slug, save }: { slug: string; save: boolean }) =>
      apiGet<void>(`/me/favorites/${encodeURIComponent(slug)}`, { auth: true, method: save ? 'PUT' : 'DELETE' }),
    onMutate: async ({ slug, save }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<FavoritesResponse>(key);
      if (previous && !save) qc.setQueryData<FavoritesResponse>(key, { items: previous.items.filter((m) => m.slug !== slug) });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useIsFavorite(slug: string | undefined) {
  const favorites = useFavorites();
  return !!slug && !!favorites.data?.items.some((m) => m.slug === slug);
}
