import { getApiBaseUrl } from './config';
import { getAccessToken } from './supabase';

/** An API failure with a user-presentable message. */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }

  /** True for errors where retrying could help (network, timeouts, 5xx, 429). */
  get retryable(): boolean {
    return this.status === null || this.status >= 500 || this.status === 429;
  }
}

type Query = Record<string, string | number | undefined | null>;

export interface ApiGetOptions {
  query?: Query;
  /** JSON body; switches the request to POST unless `method` is given. */
  body?: unknown;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Send the signed-in user's access token. Fails with 401 if signed out. */
  auth?: boolean;
  /** Override token lookup (tests). */
  getToken?: () => Promise<string | null>;
  signal?: AbortSignal;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
}

export function buildUrl(baseUrl: string, path: string, query: Query = {}): string {
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${baseUrl}/v1${path}${params ? `?${params}` : ''}`;
}

/** GET by default; POST when `body` is given. */
export async function apiGet<T>(path: string, options: ApiGetOptions = {}): Promise<T> {
  const {
    query,
    body,
    signal,
    method = body === undefined ? 'GET' : 'POST',
    auth = false,
    getToken = getAccessToken,
    timeoutMs = 15_000,
    fetchImpl = fetch,
    baseUrl = getApiBaseUrl(),
  } = options;

  const token = auth ? await getToken() : null;
  if (auth && !token) throw new ApiRequestError('Please sign in to continue.', 401, 'UNAUTHORIZED');

  // Built by hand: React Native's AbortSignal may lack timeout()/any().
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);

  let res: Response;
  try {
    res = await fetchImpl(buildUrl(baseUrl, path, query), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err; // cancelled by the caller (e.g. query cancelled)
    throw new ApiRequestError(
      timedOut
        ? 'The server took too long to respond. Please try again.'
        : "Couldn't reach Food Suggest. Check your internet connection and try again.",
      null,
      timedOut ? 'TIMEOUT' : 'NETWORK',
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }

  if (!res.ok) {
    let code = 'HTTP_ERROR';
    let message = 'Something went wrong. Please try again.';
    try {
      const body = (await res.json()) as { error?: { code?: string; message?: string } };
      code = body.error?.code ?? code;
      if (res.status < 500 && body.error?.message) message = body.error.message;
    } catch {
      // Non-JSON error body: keep the generic message.
    }
    if (res.status === 404) message = "We couldn't find that.";
    if (res.status === 401) message = 'Your session has expired. Please sign in again.';
    if (res.status === 429) message = 'Too many requests. Please wait a moment and try again.';
    throw new ApiRequestError(message, res.status, code);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function apiPost<T>(path: string, body: unknown, options: Omit<ApiGetOptions, 'body'> = {}): Promise<T> {
  return apiGet<T>(path, { ...options, body });
}
