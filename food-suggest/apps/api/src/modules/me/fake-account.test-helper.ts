import { HEALTH_DATA_CONSENT_VERSION, type ProfileInput } from '@food-suggest/shared';

import type { AccountRepository } from './account.repository.js';

/** In-memory AccountRepository with the same per-user semantics as the real one. */
export function fakeAccounts(knownMeals = ['waakye', 'red-red']) {
  const users = new Set<string>();
  const profiles = new Map<string, ProfileInput>();
  const consents = new Map<string, { granted: boolean; version: string }[]>();
  const favorites = new Map<string, string[]>();

  const repo: AccountRepository = {
    async ensureUser({ userId }) {
      users.add(userId);
    },
    async getProfile(userId) {
      return profiles.get(userId) ?? null;
    },
    async saveProfile(userId, p) {
      profiles.set(userId, p);
    },
    async deleteProfile(userId) {
      profiles.delete(userId);
    },
    async recordConsent(userId, _type, version, granted) {
      consents.set(userId, [...(consents.get(userId) ?? []), { granted, version }]);
    },
    async healthConsent(userId) {
      const latest = consents.get(userId)?.at(-1);
      return { granted: !!latest?.granted && latest.version === HEALTH_DATA_CONSENT_VERSION, version: latest?.version ?? null };
    },
    async listFavoriteSlugs(userId) {
      return favorites.get(userId) ?? [];
    },
    async addFavorite(userId, slug) {
      if (!knownMeals.includes(slug)) {
        const { HttpError } = await import('../../lib/http-error.js');
        throw HttpError.notFound('Meal not found');
      }
      const list = favorites.get(userId) ?? [];
      if (!list.includes(slug)) favorites.set(userId, [slug, ...list]);
    },
    async removeFavorite(userId, slug) {
      favorites.set(userId, (favorites.get(userId) ?? []).filter((s) => s !== slug));
    },
    async deleteUserData(userId) {
      users.delete(userId);
      profiles.delete(userId);
      consents.delete(userId);
      favorites.delete(userId);
    },
  };
  return { repo, users, profiles, favorites };
}
