import { QueryClient } from '@tanstack/react-query';

import { ApiRequestError } from './api';
import { QUERY_CACHE_MAX_AGE } from './query-persist';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        // Unused queries stay in memory as long as they're kept on the phone for offline use.
        gcTime: QUERY_CACHE_MAX_AGE,
        retry: (failureCount, error) =>
          failureCount < 2 && (!(error instanceof ApiRequestError) || error.retryable),
      },
      // Offline, fail straight away with "Check your internet connection" instead of
      // waiting silently (a paused favourite or shopping list looks stuck).
      mutations: { networkMode: 'always' },
    },
  });
}
