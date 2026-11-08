import type { RequestHandler } from 'express';

import { HttpError } from '../lib/http-error.js';
import { InvalidTokenError, type AuthContext, type TokenVerifier } from '../modules/auth/verify-token.js';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext;
  }
}

/** Requires a valid Supabase access token: `Authorization: Bearer <token>`. */
export function requireAuth(verify: TokenVerifier): RequestHandler {
  return async (req, _res, next) => {
    const header = req.headers.authorization;
    const match = header?.match(/^Bearer ([A-Za-z0-9._-]+)$/);
    if (!match) return next(HttpError.unauthorized());
    try {
      req.auth = await verify(match[1]!);
      next();
    } catch (err) {
      next(err instanceof InvalidTokenError ? HttpError.unauthorized('Your session has expired. Please sign in again.') : err);
    }
  };
}

/** The authenticated user's context; only call after requireAuth. */
export function authOf(req: { auth?: AuthContext }): AuthContext {
  if (!req.auth) throw HttpError.unauthorized();
  return req.auth;
}
