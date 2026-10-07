import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusPill } from "@/components/ui/status-pill";
import { useTriggerSync } from "@/lib/api/hooks";
import { useSyncPolling } from "./useSyncPolling";
import { formatRelativeTime } from "@/lib/format-time";
import type { Project } from "@/lib/api/types";

function syncToStatus(s: Project["syncStatus"]): "healthy" | "indexing" | "error" | "idle" {
  switch (s) {
    case "succeeded": return "healthy";
    case "running":   return "indexing";
    case "failed":    return "error";
    default:          return "idle";
  }
}

interface ProjectHeroProps {
  project: Project;
}

export function ProjectHero({ project }: ProjectHeroProps) {
  const triggerSync = useTriggerSync(project.id);
  const { data: syncJob } = useSyncPolling(project.id);

  const isActive =
    project.syncStatus === "running" ||
    project.syncStatus === "queued" ||
    syncJob?.status === "running" ||
    syncJob?.status === "queued";

  const isFailed = project.syncStatus === "failed" || syncJob?.status === "failed";
  const progress = syncJob?.progress ?? 0;

  return (
    <div className="border border-border bg-surface-accent p-6 rounded space-y-4">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          {/* Status row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider text-copper">
              Repository Context
            </span>
            <span className="text-text-muted" aria-hidden="true">·</span>
            <StatusPill
              status={syncToStatus(project.syncStatus)}
              aria-live="polite"
              aria-atomic="true"
            >
              {project.syncStatus}
            </StatusPill>
            {project.lastSyncedAt && (
              <span className="font-mono text-[10px] text-text-muted">
                Last indexed: {formatRelativeTime(project.lastSyncedAt)}
              </span>
            )}
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-paper tracking-tight">
              {project.fullName}
            </h1>
            <a
              href={`https://github.com/${project.fullName}`}
              target="_blank"
              rel="noreferrer"
              className="text-text-muted hover:text-copper transition shrink-0"
              aria-label={`View ${project.fullName} on GitHub`}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <p className="text-xs text-text-muted max-w-2xl leading-relaxed">
            {project.description}
          </p>

          {/* Sync progress */}
          {isActive && (
            <div
              className="space-y-1.5 pt-1"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Indexing ${progress}% complete`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-muted">Indexing progress…</span>
                <span className="text-copper font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} variant="copper" className="h-1.5" />
            </div>
          )}

          {/* Failed state */}
          {isFailed && syncJob?.error && (
            <p
              role="alert"
              className="text-xs text-error font-mono bg-error/10 border border-error/30 rounded px-3 py-2"
            >
              Sync failed: {syncJob.error}
            </p>
          )}
        </div>

        {/* Sync button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => triggerSync.mutate()}
          disabled={triggerSync.isPending || isActive}
          className="gap-2 border-border text-xs text-paper bg-surface hover:bg-surface-accent font-mono shrink-0"
          aria-label={isActive ? "Sync in progress" : "Re-index repository"}
        >
          {triggerSync.isPending || isActive ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-copper" aria-hidden="true" />
              Syncing…
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 text-copper" aria-hidden="true" />
              Sync now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
