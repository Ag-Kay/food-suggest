/**
 * Verifies Supabase access tokens (asymmetric signing keys, JWKS).
 * Docs: https://supabase.com/docs/guides/auth/jwts
 */
import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from 'jose';

export interface AuthContext {
  userId: string;
  email: string | null;
}

export type TokenVerifier = (token: string) => Promise<AuthContext>;

export class InvalidTokenError extends Error {
  constructor(message = 'Invalid or expired session') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createTokenVerifier({ issuer, keys }: { issuer: string; keys: JWTVerifyGetKey }): TokenVerifier {
  return async (token) => {
    try {
      const { payload } = await jwtVerify(token, keys, {
        issuer,
        audience: 'authenticated',
        algorithms: ['ES256', 'RS256'],
        requiredClaims: ['sub', 'exp'],
        clockTolerance: 5,
      });
      if (payload.role !== 'authenticated') throw new InvalidTokenError();
      // We don't use Supabase anonymous users: anonymous visitors use the app without tokens.
      if (payload.is_anonymous === true) throw new InvalidTokenError();
      if (typeof payload.sub !== 'string' || !UUID.test(payload.sub)) throw new InvalidTokenError();
      return { userId: payload.sub, email: typeof payload.email === 'string' ? payload.email : null };
    } catch (err) {
      if (err instanceof InvalidTokenError || err instanceof errors.JOSEError) throw new InvalidTokenError();
      throw err; // network problems fetching keys etc. → 500
    }
  };
}

/** Production verifier: Supabase project's JWKS endpoint (cached by jose, ≤10 min). */
export function createSupabaseVerifier(supabaseUrl: string): TokenVerifier {
  const base = supabaseUrl.replace(/\/+$/, '');
  return createTokenVerifier({
    issuer: `${base}/auth/v1`,
    keys: createRemoteJWKSet(new URL(`${base}/auth/v1/.well-known/jwks.json`), { cacheMaxAge: 10 * 60_000 }),
  });
}
