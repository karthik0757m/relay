import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, GitFork, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser, useProjects } from "@/lib/api/hooks";
import { routes } from "@/lib/routes";
import { ConnectRepoModal } from "./ConnectRepoModal";
import { DashboardStats } from "./DashboardStats";
import { ProjectCard } from "./ProjectCard";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const [search, setSearch] = useState("");
  const { data: user } = useCurrentUser();
  const { data: projects = [], isLoading, error, refetch } = useProjects();

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const filteredProjects = search
    ? recentProjects.filter(
        (p) =>
          p.fullName.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase())
      )
    : recentProjects;

  if (error) {
    return (
      <AppShell>
        <ErrorState
          title="Failed to load dashboard"
          description="Could not retrieve your projects."
          onRetry={() => refetch()}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-copper mb-1">
              Dashboard
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-paper">
              {getGreeting()},{" "}
              {user?.name?.split(" ")[0] ?? "Developer"}
            </h1>
            <p className="text-xs text-text-muted mt-1 max-w-xl">
              Your connected repositories and recent activity at a glance.
            </p>
          </div>
          <ConnectRepoModal />
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <DashboardStats projects={projects} />
        )}

        {/* Recent Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif text-paper">Recent Projects</h2>
            {projects.length > 0 && (
              <Link to={routes.app.projects()}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 text-xs border-border text-copper hover:border-copper"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>

          {/* Search */}
          {projects.length > 0 && (
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your repositories…"
                aria-label="Filter recent projects"
                className="w-full rounded border border-border bg-surface-accent pl-9 pr-3 py-2 text-xs text-paper placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-copper font-mono"
              />
            </div>
          )}

          {/* Project grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              icon={<GitFork className="h-12 w-12" />}
              title="No repositories connected"
              description="Connect your first GitHub repository to start using Relay for instant project context and AI-powered assistance."
              action={<ConnectRepoModal />}
            />
          ) : filteredProjects.length > 0 ? (
            <div
              className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              aria-live="polite" 
              aria-label="Recent projects"
            >
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="No projects match your search"
              description="Try adjusting your search terms or connect more repositories."
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
