import { StatCard } from "@/components/ui/stat-card";
import type { Project } from "@/lib/api/types";

interface DashboardStatsProps {
  projects: Project[];
}

export function DashboardStats({ projects }: DashboardStatsProps) {
  // Derive stats from real project data
  const totalProjects = projects.length;
  const totalFiles = projects.reduce((sum, p) => sum + p.stats.files, 0);
  const totalCommits = projects.reduce((sum, p) => sum + p.stats.commits, 0);
  
  // Healthy repos (succeeded sync status)
  const healthyRepos = projects.filter(p => p.syncStatus === "succeeded").length;
  const healthyPercentage = totalProjects > 0 
    ? Math.round((healthyRepos / totalProjects) * 100) 
    : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        value={totalProjects.toLocaleString()}
        label="Connected Repos"
      />
      <StatCard
        value={`${healthyPercentage}%`}
        label="Healthy Status"
        accent={healthyPercentage >= 75 ? "✓" : healthyPercentage >= 50 ? "~" : "!"}
      />
      <StatCard
        value={totalFiles.toLocaleString()}
        label="Total Files"
      />
      <StatCard
        value={totalCommits.toLocaleString()}
        label="Total Commits"
      />
    </div>
  );
}