import { Router } from 'express';

import type { HealthResponse } from '@food-suggest/shared';

export const API_VERSION = '0.0.0';

export function healthRouter(): Router {
  const router = Router();
  router.get('/', (_req, res) => {
    const body: HealthResponse = {
      status: 'ok',
      version: API_VERSION,
      time: new Date().toISOString(),
    };
    res.json(body);
  });
  return router;
}
