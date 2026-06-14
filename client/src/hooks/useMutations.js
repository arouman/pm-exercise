import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

// The starter only ships read hooks (useEntities/useEntity). Rentals is the first domain that
// writes — assignments, field events, status changes — so this is the one new pattern the plan
// allows: a thin useMutation wrapper that invalidates the cached lists/details on success so the
// UI reflects the write without a manual refetch.
//
// Usage:
//   const assign = useApiMutation('post', '/api/equipment-assignments');
//   assign.mutate(body, { onSuccess: ({ assignment, conflicts }) => ... });
//
// `path` may be a string or a function of the mutation payload (e.g. (d) => `/api/equipment/${d.id}`)
// so PATCH-by-id callers can build the URL from the body. `invalidate` defaults to every cached
// list+detail (the safe, simple choice at prototype scale); pass a narrower array of queryKey
// prefixes to scope it.
export function useApiMutation(method, path, { invalidate = [['list'], ['detail']] } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      const url = typeof path === 'function' ? path(data) : path;
      return method === 'del' ? api.del(url) : api[method](url, data);
    },
    onSuccess: () => {
      for (const key of invalidate) queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
