import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { api } from "../client";
import { queryKeys } from "../query-keys";
import type { SyncJob } from "../types";

export function useSyncStatus(
  id?: string,
  options?: Omit<UseQueryOptions<SyncJob>, "queryKey" | "queryFn" | "enabled">
) {
  return useQuery({
    queryKey: queryKeys.projects.sync(id ?? ""),
    queryFn: () => api.get<SyncJob>(`/projects/${id}/sync`),
    enabled: Boolean(id),
    ...options,
  });
}

export function useTriggerSync(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<SyncJob>(`/projects/${id}/sync`),
    onSuccess: () => {
      if (id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.sync(id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(id),
        });
      }
    },
  });
}
