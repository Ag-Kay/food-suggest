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

describe('authenticated requests', () => {
  const base = { baseUrl: 'http://api' };

  it('sends the bearer token and the chosen method', async () => {
    const fetchImpl = jest.fn(async (_url: string, _init?: RequestInit) => ({ ok: true, status: 204, json: async () => ({}) }) as unknown as Response);
    await apiGet('/me/favorites/waakye', { ...base, fetchImpl: fetchImpl as unknown as typeof fetch, auth: true, method: 'PUT', getToken: async () => 'tok' });
    const init = fetchImpl.mock.calls[0]![1]!;
    expect(init.method).toBe('PUT');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('never sends a token unless asked', async () => {
    const fetchImpl = jest.fn(async (_url: string, _init?: RequestInit) => ok({}));
    await apiGet('/meals', { ...base, fetchImpl: fetchImpl as unknown as typeof fetch, getToken: async () => 'tok' });
    expect((fetchImpl.mock.calls[0]![1]!.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('fails fast with 401 when signed out', async () => {
    const fetchImpl = jest.fn();
    const err = await failure(apiGet('/me', { ...base, fetchImpl, auth: true, getToken: async () => null }));
    expect(err.status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

