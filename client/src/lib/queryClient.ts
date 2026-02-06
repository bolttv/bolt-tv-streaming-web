/**
 * React Query Client — simplified
 *
 * The old client had a default queryFn that auto-fetched from Express routes
 * using queryKey as the URL (e.g., queryKey: ["/api/content/rows"]).
 *
 * Now all queries use explicit queryFn in their hooks (useContent, useSportContent, etc.)
 * so no default queryFn is needed. This simplifies the client significantly.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes default
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});

