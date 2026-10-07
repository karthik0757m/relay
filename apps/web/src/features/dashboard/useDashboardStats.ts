import type { Project } from "@/lib/api/types";

export interface DashboardStats {
  totalProjects: number;
  healthyProjects: number;
  indexingProjects: number;
  failedProjects: number;
  totalCommits: number;
  totalFiles: number;
  totalPRs: number;
  totalIssues: number;
}

/**
 * Derives dashboard summary statistics from the projects array.
 * Pure function — easily unit-testable.
 */
export function deriveDashboardStats(projects: Project[]): DashboardStats {
  let totalCommits = 0;
  let totalFiles = 0;
  let totalPRs = 0;
  let totalIssues = 0;
  let healthyProjects = 0;
  let indexingProjects = 0;
  let failedProjects = 0;

  for (const p of projects) {
    totalCommits += p.stats.commits;
    totalFiles += p.stats.files;
    totalPRs += p.stats.pullRequests;
    totalIssues += p.stats.issues;

    if (p.syncStatus === "succeeded") healthyProjects++;
    else if (p.syncStatus === "running" || p.syncStatus === "queued") indexingProjects++;
    else if (p.syncStatus === "failed") failedProjects++;
  }

  return {
    totalProjects: projects.length,
    healthyProjects,
    indexingProjects,
    failedProjects,
    totalCommits,
    totalFiles,
    totalPRs,
    totalIssues,
  };
}
