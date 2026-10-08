import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Archive, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FilterChip } from "@/components/ui/filter-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { ConnectRepoModal } from "@/features/dashboard/ConnectRepoModal";
import { useDeleteProject, useProjects } from "@/lib/api/hooks";
import { formatRelativeTime } from "@/lib/format-time";
import { routes } from "@/lib/routes";
import type { Project } from "@/lib/api/types";

type StatusFilter = "all" | Project["syncStatus"];

function syncToStatus(s: Project["syncStatus"]): "healthy" | "indexing" | "error" | "idle" {
  switch (s) {
    case "succeeded": return "healthy";
    case "running":   return "indexing";
    case "failed":    return "error";
    default:          return "idle";
  }
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all",       label: "All"      },
  { value: "succeeded", label: "Healthy"  },
  { value: "running",   label: "Indexing" },
  { value: "queued",    label: "Queued"   },
  { value: "failed",    label: "Failed"   },
];

export function ProjectsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const statusFilter = (searchParams.get("status") ?? "all") as StatusFilter;

  const [toDelete, setToDelete] = useState<Project | null>(null);

  const { data: projects = [], isLoading, error, refetch } = useProjects();
  const deleteProject = useDeleteProject();

  const setSearch = (v: string) => {
    const p = new URLSearchParams(searchParams);
    if (v) { p.set("q", v); } else { p.delete("q"); }
    setSearchParams(p, { replace: true });
  };

  const setStatus = (v: StatusFilter) => {
    const p = new URLSearchParams(searchParams);
    if (v === "all") { p.delete("status"); } else { p.set("status", v); }
    setSearchParams(p, { replace: true });
  };

  const filtered = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .filter((p) => {
      const matchSearch =
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.syncStatus === statusFilter;
      return matchSearch && matchStatus;
    });

  if (error) {
    return (
      <AppShell>
        <ErrorState
          title="Failed to load projects"
          description="Could not retrieve the project list."
          onRetry={() => refetch()}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-copper mb-1">
              All Repositories
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-paper">
              Connected Projects
            </h1>
            <p className="text-xs text-text-muted mt-1 max-w-xl">
              Manage and monitor all GitHub repositories connected to Relay.
            </p>
          </div>
          <ConnectRepoModal />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              aria-label="Search projects"
              className="w-full rounded border border-border bg-surface-accent pl-9 pr-3 py-1.5 text-xs text-paper placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-copper font-mono"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map(({ value, label }) => (
              <FilterChip
                key={value}
                active={statusFilter === value}
                onClick={() => setStatus(value)}
              >
                {label}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4" aria-live="polite" aria-label="Project list">
            {filtered.map((project) => (
              <Card
                key={project.id}
                onClick={() => navigate(routes.project(project.id).root())}
                className="cursor-pointer border-border bg-surface-accent transition hover:border-copper/60 hover:shadow-lg group"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-mono text-sm font-semibold text-paper group-hover:text-copper transition">
                          {project.fullName}
                        </h3>
                        <StatusPill status={syncToStatus(project.syncStatus)}>
                          {project.syncStatus === "succeeded" ? "healthy" : project.syncStatus}
                        </StatusPill>
                        {project.language && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-muted">
                            {project.language}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-1">
                        {project.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-5 py-3">
                  <div className="flex items-center gap-6 text-xs flex-wrap">
                    {[
                      { label: "Commits", value: project.stats.commits },
                      { label: "PRs",     value: project.stats.pullRequests },
                      { label: "Issues",  value: project.stats.issues },
                      { label: "Files",   value: project.stats.files },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className="font-mono text-text-muted">{label}:</span>
                        <span className="font-semibold text-paper">
                          {value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-border/40 px-5 py-3 bg-charcoal/40">
                  <span className="text-[10px] font-mono text-text-muted">
                    {project.lastSyncedAt
                      ? `Synced ${formatRelativeTime(project.lastSyncedAt)}`
                      : "Never synced"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="text-text-muted hover:text-paper transition p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
                      title="Archive (coming soon)"
                      aria-label="Archive project (coming soon)"
                      disabled
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setToDelete(project);
                      }}
                      className="text-text-muted hover:text-error transition p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                      aria-label={`Delete ${project.fullName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No projects found"
            description={
              search || statusFilter !== "all"
                ? "Try adjusting your search or filter."
                : "Connect a GitHub repository to get started."
            }
            action={<ConnectRepoModal />}
          />
        )}
      </div>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={`Delete ${toDelete?.fullName}?`}
        description={`This will permanently remove ${toDelete?.fullName} from Relay. This action cannot be undone. Type "${toDelete?.name}" to confirm.`}
        confirmText={toDelete?.name ?? ""}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteProject.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
        loading={deleteProject.isPending}
        destructive
      />
    </AppShell>
  );
}