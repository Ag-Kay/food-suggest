import { z } from 'zod';

/** Standard error envelope returned by every API error response. */
export const ApiError = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiError>;

export const HealthResponse = z.object({
  status: z.literal('ok'),
  version: z.string(),
  time: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponse>;
