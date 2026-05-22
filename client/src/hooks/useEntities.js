import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

// Generic list hook. Pass the path (with query string already encoded).
// Extend / wrap as needed for entity-specific behavior.
export function useEntities(path, options = {}) {
  return useQuery({
    queryKey: ['list', path],
    queryFn: () => api.get(path),
    staleTime: 30_000,
    ...options,
  });
}

export function useEntity(path, options = {}) {
  return useQuery({
    queryKey: ['detail', path],
    queryFn: () => api.get(path),
    enabled: Boolean(path),
    staleTime: 30_000,
    ...options,
  });
}
