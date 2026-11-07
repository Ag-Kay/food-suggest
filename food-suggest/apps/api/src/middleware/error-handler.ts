import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

import type { ApiError } from '@food-suggest/shared';

import { HttpError } from '../lib/http-error.js';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(HttpError.notFound('Route not found'));
};

/**
 * Single place that turns errors into the `{ error: { code, message } }` envelope.
 * Unexpected errors are logged in full but never leak internals to the client.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let status = 500;
  let body: ApiError = { error: { code: 'INTERNAL', message: 'Something went wrong' } };

  if (err instanceof HttpError) {
    status = err.status;
    body = { error: { code: err.code, message: err.message, details: err.details } };
  } else if (err instanceof ZodError) {
    status = 400;
    body = {
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    };
  } else if (isBodyParserError(err)) {
    status = err.status;
    body = { error: { code: 'BAD_REQUEST', message: 'Malformed or too large request body' } };
  }

  if (status >= 500) {
    req.log?.error({ err }, 'Unhandled error');
  }
  res.status(status).json(body);
};

function isBodyParserError(err: unknown): err is { status: number; type: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    'status' in err &&
    typeof (err as { status: unknown }).status === 'number' &&
    (err as { status: number }).status < 500
  );
}
