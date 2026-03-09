/**
 * React Query hooks tied to the API client.
 * Add your query keys and hooks here for a single source of truth.
 */

import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Query keys (use for invalidations and consistency)
export const queryKeys = {
  all: ['api'] as const,
  // Example: users: () => [...queryKeys.all, 'users'] as const,
};

// ─── Example query hook (replace with your real endpoints)
export function useExampleQuery() {
  return useQuery({
    queryKey: [...queryKeys.all, 'example'],
    queryFn: () => apiClient.get<{ message: string }>('/example'),
    // enabled: false, // set to true when you have a real endpoint
  });
}

// ─── Example mutation hook
export function useExampleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => apiClient.post('/example', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}
