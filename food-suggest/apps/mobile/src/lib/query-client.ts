import { QueryClient } from '@tanstack/react-query';

import { ApiRequestError } from './api';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        retry: (failureCount, error) =>
          failureCount < 2 && (!(error instanceof ApiRequestError) || error.retryable),
      },
    },
  });
}
