import { Link, useParams } from "react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProjectGuard } from "@/components/layout/ProjectGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { useProject } from "@/lib/api/hooks";
import { routes } from "@/lib/routes";
import { ProjectActivityTimeline } from "./ProjectActivityTimeline";
import { ProjectArchitectureCard } from "./ProjectArchitectureCard";
import { ProjectHealthCard } from "./ProjectHealthCard";
import { ProjectHero } from "./ProjectHero";
import { SuggestedActionsCard } from "./SuggestedActionsCard";

export function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useProject(id);
  const p = id ? routes.project(id) : null;

  const promptSuggestions = [
    "How does the caching algorithm compute hash keys?",
    "Where is the background daemon client initialized?",
    "Explain package DAG resolution during build.",
  ];

  return (
    <ProjectGuard>
      {project && p && (
        <div className="space-y-8">
          {/* Hero / sync status */}
          <ProjectHero project={project} />

          {/* Key metrics — counts link to relevant list pages */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to={p.commits()} aria-label={`${project.stats.commits.toLocaleString()} commits`}>
              <StatCard
                label="Total Commits"
                value={project.stats.commits.toLocaleString()}
                className="hover:border-copper/60 transition cursor-pointer"
              />
            </Link>
            <Link to={p.pulls()} aria-label={`${project.stats.pullRequests.toLocaleString()} pull requests`}>
              <StatCard
                label="Pull Requests"
                value={project.stats.pullRequests.toLocaleString()}
                className="hover:border-copper/60 transition cursor-pointer"
              />
            </Link>
            <Link to={p.issues()} aria-label={`${project.stats.issues.toLocaleString()} issues`}>
              <StatCard
                label="Active Issues"
                value={project.stats.issues.toLocaleString()}
                className="hover:border-copper/60 transition cursor-pointer"
              />
            </Link>
            <Link to={p.releases()} aria-label={`${project.stats.releases.toLocaleString()} releases`}>
              <StatCard
                label="Releases"
                value={project.stats.releases.toLocaleString()}
                className="hover:border-copper/60 transition cursor-pointer"
              />
            </Link>
          </div>

          {/* Ask AI card */}
          <Card className="border-border bg-gradient-to-r from-surface-accent via-surface-accent to-surface p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-copper" aria-hidden="true" />
                  <h3 className="font-serif text-lg font-normal text-paper">
                    Ask Relay about {project.name}
                  </h3>
                </div>
                <p className="text-xs text-text-muted">
                  Every answer cites its sources — source files, commits, and
                  PRs with line references.
                </p>
              </div>
              <Link to={p.ask()}>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-copper hover:bg-copper-dark text-paper text-xs gap-2 font-mono"
                >
                  Start Conversation
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </Link>
            </div>

            {/* Sample prompts */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/40 pt-4">
              <span className="text-[10px] font-mono uppercase text-text-muted">
                Sample:
              </span>
              {promptSuggestions.map((prompt) => (
                <Link
                  key={prompt}
                  to={`${p.ask()}?q=${encodeURIComponent(prompt)}`}
                  className="text-xs font-mono text-copper hover:underline bg-surface px-2.5 py-1 rounded border border-border/60"
                >
                  &ldquo;{prompt}&rdquo;
                </Link>
              ))}
            </div>
          </Card>

          {/* Two-column layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <ProjectArchitectureCard projectId={project.id} />
              <ProjectActivityTimeline projectId={project.id} />
            </div>
            <div className="space-y-6">
              <ProjectHealthCard project={project} />
              <SuggestedActionsCard projectId={project.id} />
            </div>
          </div>
        </div>
      )}
    </ProjectGuard>
  );
}
