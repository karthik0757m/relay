import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  AlertTriangle,
  BookOpen,
  ExternalLink,
  GitCommit,
  GitPullRequest,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useProject, useSyncProject } from "@/lib/api/hooks";
import { formatRelativeTime } from "@/lib/format-time";
import { routes } from "@/lib/routes";
import { useSyncPolling } from "./useSyncPolling";
import type { Project } from "@/lib/api/types";

function syncToStatus(s: Project["syncStatus"]): "healthy" | "indexing" | "error" | "idle" {
  switch (s) {
    case "succeeded": return "healthy";
    case "running":   return "indexing";
    case "failed":    return "error";
    default:          return "idle";
  }
}

function getHealthRingColor(score: number): string {
  if (score >= 80) return "stroke-chart-healthy";
  if (score >= 60) return "stroke-chart-warning";
  return "stroke-chart-critical";
}

// Mock recent activity - in real app this would come from API
const MOCK_ACTIVITY = [
  {
    id: "1",
    type: "commit" as const,
    title: "Add authentication middleware",
    author: "sarah-dev",
    timestamp: "2026-10-08T10:30:00Z",
    evidence: ["src/middleware/auth.ts", "tests/auth.test.ts"],
  },
  {
    id: "2", 
    type: "pr" as const,
    title: "Implement user dashboard layout",
    author: "mike-frontend",
    timestamp: "2026-10-08T09:15:00Z",
    evidence: ["src/components/Dashboard.tsx", "src/pages/DashboardPage.tsx"],
  },
  {
    id: "3",
    type: "issue" as const,
    title: "Fix memory leak in WebSocket connection",
    author: "alex-backend",
    timestamp: "2026-10-08T08:45:00Z", 
    evidence: ["src/services/websocket.ts", "docs/websocket-architecture.md"],
  },
];

const SUGGESTED_ACTIONS = [
  {
    icon: BookOpen,
    title: "Start onboarding",
    description: "Get familiar with this codebase",
    href: (projectId: string) => routes.project(projectId).onboarding(),
    variant: "primary" as const,
  },
  {
    icon: Sparkles,
    title: "Ask about architecture",
    description: "Understand system design patterns",
    href: (projectId: string) => routes.project(projectId).ask(),
    variant: "secondary" as const,
  },
  {
    icon: TrendingUp,
    title: "Generate handoff",
    description: "Create knowledge transfer docs",
    href: (projectId: string) => routes.project(projectId).handoff(),
    variant: "secondary" as const,
  },
];

export function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const [syncTriggered, setSyncTriggered] = useState(false);
  
  const { data: project, isLoading, error, refetch } = useProject(id);
  const syncProject = useSyncProject();
  const { data: syncJob } = useSyncPolling(id ?? "", syncTriggered);

  if (error) {
    return (
      <AppShell>
        <ErrorState
          title="Failed to load project"
          description="Could not retrieve project details."
          onRetry={() => refetch()}
        />
      </AppShell>
    );
  }

  if (isLoading || !project) {
    return (
      <AppShell>
        <div className="space-y-8">
          <Skeleton className="h-24 w-full" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-48 lg:col-span-2" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </AppShell>
    );
  }

  const health = project.health ?? { overall: 0, documentation: 0, activity: "low" };
  const isSyncing = project.syncStatus === "running" || syncJob?.status === "running";

  const handleSync = async () => {
    setSyncTriggered(true);
    try {
      await syncProject.mutateAsync(project.id);
    } catch {
      setSyncTriggered(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Project Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-border pb-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 rounded">
              <div className="flex h-full w-full items-center justify-center bg-surface border border-border font-mono text-xs font-medium text-paper">
                {project.owner[0]?.toUpperCase()}
              </div>
            </Avatar>
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-serif font-normal text-paper break-all">
                  {project.fullName}
                </h1>
                <StatusPill status={syncToStatus(project.syncStatus)}>
                  {project.syncStatus === "succeeded" ? "healthy" : project.syncStatus}
                </StatusPill>
                {project.language && (
                  <Badge variant="default" className="border-border text-[10px] font-mono">
                    {project.language}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-text-muted max-w-2xl leading-relaxed">
                {project.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
                <span>{project.stats.files.toLocaleString()} files</span>
                <span>{project.stats.commits.toLocaleString()} commits</span>
                <span>{project.stats.pullRequests.toLocaleString()} PRs</span>
                <span>{project.stats.issues.toLocaleString()} issues</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`https://github.com/${project.fullName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-xs border border-border rounded hover:border-copper transition font-mono text-text-muted hover:text-paper"
            >
              <ExternalLink className="h-3 w-3" />
              View on GitHub
            </a>
            <Button
              onClick={handleSync}
              variant="secondary"
              size="sm"
              loading={isSyncing}
              disabled={isSyncing}
              className="gap-2"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing…' : 'Sync now'}
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Health & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Health Card */}
            <Card className="border-border bg-surface-accent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-serif">Repository Health</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted">
                      {health.overall}/100
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  {/* Health Score Ring */}
                  <div className="relative h-20 w-20 shrink-0">
                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 32 32">
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-border"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        fill="transparent"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray={`${health.overall * 0.88} 88`}
                        className={getHealthRingColor(health.overall)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-mono font-semibold text-paper">
                        {health.overall}
                      </span>
                    </div>
                  </div>

                  {/* Health Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">Documentation Coverage</span>
                      <span className="font-mono text-paper">{health.documentation}%</span>
                    </div>
                    <Progress 
                      value={health.documentation} 
                      variant="copper" 
                      className="h-1"
                      aria-label={`Documentation coverage: ${health.documentation}%`}
                    />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">Activity Level</span>
                      <Badge 
                        variant={health.activity === "high" ? "default" : "default"}
                        className="text-[10px] font-mono"
                      >
                        {health.activity}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-border bg-surface-accent">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MOCK_ACTIVITY.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 border-b border-border/40 last:border-0 pb-4 last:pb-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface border border-border shrink-0 mt-0.5">
                        {item.type === "commit" && <GitCommit className="h-3 w-3 text-text-muted" />}
                        {item.type === "pr" && <GitPullRequest className="h-3 w-3 text-text-muted" />}
                        {item.type === "issue" && <AlertTriangle className="h-3 w-3 text-text-muted" />}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <p className="text-sm text-paper font-medium line-clamp-1">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <span className="font-mono">{item.author}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(item.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {item.evidence.slice(0, 2).map((file, i) => (
                            <Link
                              key={i}
                              to={routes.project(project.id).files(file)}
                              className="text-[10px] font-mono text-copper hover:underline px-1.5 py-0.5 bg-surface-raised border border-border rounded"
                            >
                              {file.split("/").pop()}
                            </Link>
                          ))}
                          {item.evidence.length > 2 && (
                            <span className="text-[10px] text-text-muted font-mono">
                              +{item.evidence.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Highlights */}
          <div className="space-y-6">
            {/* Architecture Highlights */}
            <Card className="border-border bg-surface-accent">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Architecture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Primary Language</span>
                    <span className="font-mono text-paper">{project.language}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Framework</span>
                    <span className="font-mono text-paper">
                      {project.language === "TypeScript" ? "React" : "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Package Manager</span>
                    <span className="font-mono text-paper">npm</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suggested Actions */}
            <Card className="border-border bg-surface-accent">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Suggested Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {SUGGESTED_ACTIONS.map((action) => (
                    <Link
                      key={action.title}
                      to={action.href(project.id)}
                      className="flex items-center gap-3 p-3 rounded border border-border hover:border-copper transition group"
                    >
                      <action.icon className="h-4 w-4 text-text-muted group-hover:text-copper" />
                      <div className="flex-1 space-y-0.5">
                        <p className="text-sm font-medium text-paper group-hover:text-copper">
                          {action.title}
                        </p>
                        <p className="text-xs text-text-muted">
                          {action.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Live sync status */}
        {isSyncing && syncJob && (
          <div
            className="fixed bottom-4 right-4 bg-charcoal border border-border p-4 rounded shadow-lg"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <RefreshCw className="h-4 w-4 animate-spin text-copper" />
              <div className="space-y-1">
                <p className="text-xs font-mono text-paper">
                  Syncing repository…
                </p>
                <Progress 
                  value={syncJob.progress} 
                  variant="copper" 
                  className="w-32 h-1"
                  aria-label={`Sync progress: ${syncJob.progress}%`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}