import { z } from 'zod';

import { ProfileInput } from './profile';

/** Bump when the wording users agree to changes; users are asked again. */
export const HEALTH_DATA_CONSENT_VERSION = '2026-11-07';

export const ConsentType = z.enum(['HEALTH_DATA']);
export type ConsentType = z.infer<typeof ConsentType>;

export const ConsentRequest = z
  .object({
    type: ConsentType,
    version: z.string().min(1).max(40),
    granted: z.boolean(),
  })
  .strict();
export type ConsentRequest = z.infer<typeof ConsentRequest>;

export const ClaimRequest = z.object({ profile: ProfileInput }).strict();
export type ClaimRequest = z.infer<typeof ClaimRequest>;

export interface MeResponse {
  user: { id: string; email: string | null };
  profile: ProfileInput | null;
  consents: { healthData: { granted: boolean; version: string | null } };
}

export interface ClaimResponse {
  /** False when the account already had a profile; the account's profile wins. */
  applied: boolean;
  profile: ProfileInput;
}

export interface FavoritesResponse {
  items: import('./meals').MealCard[];
}
