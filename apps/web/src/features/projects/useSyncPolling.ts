import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { SyncJob } from "@/lib/api/types";

/**
 * Polls sync job status with automatic stop on terminal states
 */
export function useSyncPolling(projectId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.projects.sync(projectId),
    queryFn: () => api.get<SyncJob>(`/projects/${projectId}/sync`),
    enabled,
    refetchInterval: (data) => {
      // Stop polling on terminal states
      if (!data?.state?.data) return false;
      const status = data.state.data.status;
      return status === "running" || status === "queued" ? 2000 : false;
    },
    refetchIntervalInBackground: false,
  });
}