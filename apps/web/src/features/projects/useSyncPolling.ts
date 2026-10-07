import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { useSyncStatus } from "@/lib/api/hooks";
import type { SyncJob } from "@/lib/api/types";

/** Terminal states — polling stops when job reaches one of these. */
const TERMINAL: ReadonlySet<SyncJob["status"]> = new Set(["succeeded", "failed"]);

/**
 * useSyncPolling — polls GET /projects/:id/sync while the job is active.
 *
 * Uses TanStack Query's `refetchInterval` (no manual setInterval).
 * When sync succeeds, invalidates the project detail so health / status
 * stay fresh without a page reload.
 */
export function useSyncPolling(projectId?: string) {
  const queryClient = useQueryClient();

  const query = useSyncStatus(projectId, {
    refetchInterval: (q) => {
      const data = q.state.data as SyncJob | undefined;
      if (!data || TERMINAL.has(data.status)) return false;
      return 1500;
    },
  });

  // Invalidate project detail when sync reaches "succeeded"
  useEffect(() => {
    if (query.data?.status === "succeeded" && projectId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    }
  }, [query.data?.status, projectId, queryClient]);

  return query;
}
