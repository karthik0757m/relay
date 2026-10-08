import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  FileCode2,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusPill } from "@/components/ui/status-pill";
import { useDeleteProject } from "@/lib/api/hooks";
import { routes } from "@/lib/routes";
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

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const deleteProject = useDeleteProject();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const p = routes.project(project.id);

  return (
    <>
      <Card
        onClick={() => navigate(p.root())}
        className="cursor-pointer border-border bg-surface-accent transition hover:border-copper/60 hover:shadow-lg flex flex-col justify-between group"
      >
        <CardHeader className="space-y-2 p-5 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <GitBranch className="h-4 w-4 text-copper shrink-0" aria-hidden="true" />
              <h3 className="font-mono text-sm font-semibold text-paper group-hover:text-copper-text transition truncate">
                {project.fullName}
              </h3>
            </div>
            <StatusPill status={syncToStatus(project.syncStatus)} className="shrink-0">
              {project.syncStatus}
            </StatusPill>
          </div>
          <p className="line-clamp-2 text-xs text-text-muted leading-relaxed">
            {project.description}
          </p>
        </CardHeader>

        <CardContent className="px-5 py-2 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {project.language && (
              <Badge variant="default" className="border-border text-[10px] font-mono">
                {project.language}
              </Badge>
            )}
            <span className="text-[10px] font-mono text-text-muted">
              {project.healthLabel}
            </span>
          </div>

          {/* Count grid */}
          <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-3 text-center">
            <div className="flex flex-col items-center gap-0.5">
              <span className="flex items-center gap-1 text-[10px] font-mono text-text-muted">
                <GitCommit className="h-3 w-3" aria-hidden="true" />
                Commits
              </span>
              <span className="font-mono text-xs font-semibold text-paper">
                {project.stats.commits.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="flex items-center gap-1 text-[10px] font-mono text-text-muted">
                <GitPullRequest className="h-3 w-3" aria-hidden="true" />
                PRs
              </span>
              <span className="font-mono text-xs font-semibold text-paper">
                {project.stats.pullRequests.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="flex items-center gap-1 text-[10px] font-mono text-text-muted">
                <FileCode2 className="h-3 w-3" aria-hidden="true" />
                Files
              </span>
              <span className="font-mono text-xs font-semibold text-paper">
                {project.stats.files.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Last synced */}
          {project.lastSyncedAt && (
            <p className="text-[10px] font-mono text-text-muted">
              Synced {formatRelativeTime(project.lastSyncedAt)}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border/40 px-5 py-3 bg-charcoal/40">
          <div className="flex items-center gap-3">
            <Link
              to={p.ask()}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-copper-text hover:underline text-[11px] font-mono"
              aria-label={`Ask AI about ${project.fullName}`}
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Ask AI
            </Link>
            <Link
              to={p.files()}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-text-muted hover:text-paper text-[11px] font-mono"
              aria-label={`Browse files in ${project.fullName}`}
            >
              <FileCode2 className="h-3 w-3" aria-hidden="true" />
              Files
            </Link>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
            className="text-text-muted hover:text-error transition p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
            aria-label={`Disconnect ${project.fullName}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </CardFooter>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          deleteProject.mutate(project.id, {
            onSuccess: () => setConfirmOpen(false),
          });
        }}
        title={`Disconnect ${project.name}?`}
        description="All indexed data for this repository will be permanently removed. This cannot be undone."
        confirmText={project.name}
        confirmLabel="Disconnect"
        destructive
        loading={deleteProject.isPending}
      />
    </>
  );
}
