import { ApiRequestError, apiGet, buildUrl } from './api';

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as unknown as Response;
const fail = (status: number, body: unknown) => ({ ok: false, status, json: async () => body }) as unknown as Response;

/** Resolves with the rejection, failing the test if the call succeeds. */
const failure = (p: Promise<unknown>) =>
  p.then(
    () => {
      throw new Error('expected the request to fail');
    },
    (e: ApiRequestError) => e,
  );

describe('buildUrl', () => {
  it('adds /v1 and skips empty query values', () => {
    expect(buildUrl('http://x', '/meals', { q: 'red red', slot: undefined, diet: '', limit: 5 })).toBe(
      'http://x/v1/meals?q=red%20red&limit=5',
    );
  });
});

describe('apiGet', () => {
  const base = { baseUrl: 'http://api' };

  it('returns parsed JSON on success', async () => {
    const fetchImpl = jest.fn(async () => ok({ items: [] }));
    await expect(apiGet('/meals', { ...base, fetchImpl })).resolves.toEqual({ items: [] });
  });

  it('turns network failures into a friendly, retryable error', async () => {
    const fetchImpl = jest.fn(async () => {
      throw new TypeError('Network request failed');
    });
    const err = await failure(apiGet('/meals', { ...base, fetchImpl }));
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err.code).toBe('NETWORK');
    expect(err.retryable).toBe(true);
  });

  it('uses the API error message for 4xx and a generic one for 5xx', async () => {
    const bad = await failure(apiGet('/meals', { ...base, fetchImpl: async () => fail(400, { error: { code: 'VALIDATION_FAILED', message: 'Bad filter' } }) }));
    expect(bad.message).toBe('Bad filter');
    expect(bad.retryable).toBe(false);

    const boom = await failure(apiGet('/meals', { ...base, fetchImpl: async () => fail(500, { error: { message: 'stack trace' } }) }));
    expect(boom.message).not.toContain('stack');
    expect(boom.retryable).toBe(true);
  });

  it('times out slow requests', async () => {
    const fetchImpl = jest.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const err = await failure(apiGet('/meals', { ...base, fetchImpl: fetchImpl as unknown as typeof fetch, timeoutMs: 20 }));
    expect(err.code).toBe('TIMEOUT');
  });
});
