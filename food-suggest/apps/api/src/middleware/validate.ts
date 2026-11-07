import type { RequestHandler } from 'express';
import type { z } from 'zod';

/**
 * Validates `req.body` against a Zod schema and replaces it with the parsed
 * (typed, stripped) value. Validation errors flow to the error handler.
 */
export function validateBody<S extends z.ZodType>(schema: S): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}
