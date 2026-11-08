import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';

import {
  ClaimRequest,
  ConsentRequest,
  HEALTH_DATA_CONSENT_VERSION,
  ProfileInput,
  type ClaimResponse,
  type FavoritesResponse,
  type MeResponse,
} from '@food-suggest/shared';

import { HttpError } from '../../lib/http-error.js';
import { authOf, requireAuth } from '../../middleware/require-auth.js';
import type { AuthAdmin } from '../auth/auth-admin.js';
import type { TokenVerifier } from '../auth/verify-token.js';
import type { MealsRepository } from '../meals/meals.repository.js';
import type { AccountRepository } from './account.repository.js';

const MealSlug = z.string().regex(/^[a-z0-9-]{1,80}$/);

export interface MeRouterDeps {
  verify: TokenVerifier;
  accounts: AccountRepository;
  meals: MealsRepository;
  authAdmin: AuthAdmin;
  perMinute?: number;
}

/**
 * The signed-in user's own data. Every handler reads the user id from the
 * verified token (never from the URL or body), so users can only reach their own data.
 */
export function meRouter({ verify, accounts, meals, authAdmin, perMinute = 60 }: MeRouterDeps): Router {
  const router = Router();
  router.use(
    rateLimit({
      windowMs: 60_000,
      limit: perMinute,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } });
      },
    }),
  );
  router.use(requireAuth(verify));
  router.use(async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    try {
      await accounts.ensureUser(authOf(req));
      next();
    } catch (err) {
      next(err);
    }
  });

  async function requireHealthConsent(userId: string) {
    const consent = await accounts.healthConsent(userId);
    if (!consent.granted) {
      throw new HttpError(403, 'CONSENT_REQUIRED', 'Please agree to storing your food and health preferences first.');
    }
  }

  router.get('/', async (req, res) => {
    const { userId, email } = authOf(req);
    const [profile, healthData] = await Promise.all([accounts.getProfile(userId), accounts.healthConsent(userId)]);
    const body: MeResponse = { user: { id: userId, email }, profile, consents: { healthData } };
    res.json(body);
  });

  router.post('/consents', async (req, res) => {
    const { userId } = authOf(req);
    const consent = ConsentRequest.parse(req.body);
    if (consent.granted && consent.version !== HEALTH_DATA_CONSENT_VERSION) {
      throw HttpError.badRequest('Please review the latest privacy terms and try again.');
    }
    await accounts.recordConsent(userId, consent.type, consent.version, consent.granted);
    // Withdrawing consent removes the health-related data it covered.
    if (!consent.granted) await accounts.deleteProfile(userId);
    res.status(204).end();
  });

  router.put('/profile', async (req, res) => {
    const { userId } = authOf(req);
    const profile = ProfileInput.parse(req.body);
    await requireHealthConsent(userId);
    await accounts.saveProfile(userId, profile);
    res.json({ profile: await accounts.getProfile(userId) });
  });

  router.delete('/profile', async (req, res) => {
    await accounts.deleteProfile(authOf(req).userId);
    res.status(204).end();
  });

  /** Moves the on-device (anonymous) profile into the account after sign-up. */
  router.post('/claim', async (req, res) => {
    const { userId } = authOf(req);
    const { profile } = ClaimRequest.parse(req.body);
    await requireHealthConsent(userId);
    const existing = await accounts.getProfile(userId);
    if (existing) {
      const body: ClaimResponse = { applied: false, profile: existing };
      return void res.json(body);
    }
    await accounts.saveProfile(userId, profile);
    const body: ClaimResponse = { applied: true, profile: (await accounts.getProfile(userId))! };
    res.json(body);
  });

  router.get('/favorites', async (req, res) => {
    const slugs = await accounts.listFavoriteSlugs(authOf(req).userId);
    const body: FavoritesResponse = { items: await meals.cardsBySlugs(slugs) };
    res.json(body);
  });

  router.put('/favorites/:slug', async (req, res) => {
    const slug = MealSlug.safeParse(req.params.slug);
    if (!slug.success) throw HttpError.notFound('Meal not found');
    await accounts.addFavorite(authOf(req).userId, slug.data);
    res.status(204).end();
  });

  router.delete('/favorites/:slug', async (req, res) => {
    const slug = MealSlug.safeParse(req.params.slug);
    if (!slug.success) throw HttpError.notFound('Meal not found');
    await accounts.removeFavorite(authOf(req).userId, slug.data);
    res.status(204).end();
  });

  /** Permanently deletes the account and all its data (App Store guideline 5.1.1(v)). */
  router.delete('/', async (req, res) => {
    const { userId } = authOf(req);
    await accounts.deleteUserData(userId);
    await authAdmin.deleteUser(userId);
    req.log?.info({ event: 'account_deleted' }, 'Account deleted');
    res.status(204).end();
  });

  return router;
}
