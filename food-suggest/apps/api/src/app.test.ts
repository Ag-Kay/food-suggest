import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ApiError, HealthResponse } from '@food-suggest/shared';

import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createLogger } from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { validateBody } from './middleware/validate.js';

const logger = createLogger({ LOG_LEVEL: 'silent', NODE_ENV: 'test' });

describe('GET /v1/health', () => {
  it('returns ok with a version and timestamp', async () => {
    const res = await request(createApp({ logger })).get('/v1/health');
    expect(res.status).toBe(200);
    expect(HealthResponse.parse(res.body).status).toBe('ok');
  });

  it('sets security headers and hides the framework', async () => {
    const res = await request(createApp({ logger })).get('/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('error handling', () => {
  it('returns the error envelope for unknown routes', async () => {
    const res = await request(createApp({ logger })).get('/v1/nope');
    expect(res.status).toBe(404);
    expect(ApiError.parse(res.body).error.code).toBe('NOT_FOUND');
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(createApp({ logger }))
      .post('/v1/health')
      .set('content-type', 'application/json')
      .send('{"broken":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('turns validation failures into 400 VALIDATION_FAILED', async () => {
    const app = express();
    app.use(express.json());
    app.post('/t', validateBody(z.object({ n: z.number() })), (_req, res) => {
      res.json({ ok: true });
    });
    app.use(errorHandler);
    const res = await request(app).post('/t').send({ n: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('hides internal error details', async () => {
    const app = express();
    app.get('/boom', () => {
      throw new Error('db password is hunter2');
    });
    app.use(errorHandler);
    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
  });
});

describe('rate limiting', () => {
  it('returns 429 after the limit', async () => {
    const app = createApp({ logger, rateLimitPerMinute: 2 });
    await request(app).get('/v1/health');
    await request(app).get('/v1/health');
    const res = await request(app).get('/v1/health');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});

describe('CORS', () => {
  it('is off by default', async () => {
    const res = await request(createApp({ logger })).get('/v1/health').set('Origin', 'http://localhost:8081');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows only listed origins', async () => {
    const app = createApp({ logger, corsOrigins: ['http://localhost:8081'] });
    const ok = await request(app).get('/v1/health').set('Origin', 'http://localhost:8081');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:8081');
    const other = await request(app).get('/v1/health').set('Origin', 'https://evil.example');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('loadEnv', () => {
  it('applies defaults', () => {
    expect(loadEnv({}).PORT).toBe(4000);
  });

  it('fails without echoing secret values', () => {
    expect(() => loadEnv({ DATABASE_URL: 'not-a-url-secret123' })).toThrow(/DATABASE_URL/);
    expect(() => loadEnv({ DATABASE_URL: 'not-a-url-secret123' })).not.toThrow(/secret123/);
  });
});
