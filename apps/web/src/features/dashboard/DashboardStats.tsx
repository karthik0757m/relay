import { Link } from "react-router";
import { StatCard } from "@/components/ui/stat-card";
import { routes } from "@/lib/routes";
import { deriveDashboardStats } from "./useDashboardStats";
import type { Project } from "@/lib/api/types";

interface DashboardStatsProps {
  projects: Project[];
}

export function DashboardStats({ projects }: DashboardStatsProps) {
  const stats = deriveDashboardStats(projects);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Link to={routes.app.projects()} aria-label={`${stats.totalProjects} connected repositories`}>
        <StatCard
          label="Connected Repos"
          value={stats.totalProjects}
          className="hover:border-copper/60 transition cursor-pointer"
        />
      </Link>
      <StatCard
        label="Total Commits"
        value={stats.totalCommits.toLocaleString()}
        aria-label={`${stats.totalCommits.toLocaleString()} total commits across all repos`}
      />
      <StatCard
        label="Open Pull Requests"
        value={stats.totalPRs.toLocaleString()}
        aria-label={`${stats.totalPRs.toLocaleString()} open pull requests across all repos`}
      />
      <StatCard
        label="Active Issues"
        value={stats.totalIssues.toLocaleString()}
        aria-label={`${stats.totalIssues.toLocaleString()} open issues across all repos`}
      />
    </div>
  );
}
