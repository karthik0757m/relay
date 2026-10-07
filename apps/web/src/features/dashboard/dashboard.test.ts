// @vitest-environment node
import { describe, it, expect } from "vitest";
import { deriveDashboardStats } from "./useDashboardStats";
import type { Project } from "@/lib/api/types";

const base: Omit<Project, "id" | "fullName" | "syncStatus" | "stats"> = {
  name: "repo",
  description: "desc",
  language: "TypeScript",
  owner: "owner",
  lastSyncedAt: "2026-01-01T00:00:00Z",
  health: { overall: 90, documentation: 80, activity: "high" },
  healthLabel: "Healthy",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

function makeProject(
  id: string,
  syncStatus: Project["syncStatus"],
  stats: Partial<Project["stats"]> = {}
): Project {
  return {
    ...base,
    id,
    fullName: `owner/${id}`,
    syncStatus,
    stats: {
      commits: 100,
      pullRequests: 10,
      issues: 5,
      releases: 2,
      files: 200,
      ...stats,
    },
  };
}

describe("deriveDashboardStats", () => {
  it("returns zeros for empty project list", () => {
    const stats = deriveDashboardStats([]);
    expect(stats.totalProjects).toBe(0);
    expect(stats.totalCommits).toBe(0);
    expect(stats.totalPRs).toBe(0);
    expect(stats.totalIssues).toBe(0);
    expect(stats.healthyProjects).toBe(0);
    expect(stats.indexingProjects).toBe(0);
    expect(stats.failedProjects).toBe(0);
  });

  it("counts projects by sync status correctly", () => {
    const projects = [
      makeProject("a", "succeeded"),
      makeProject("b", "succeeded"),
      makeProject("c", "running"),
      makeProject("d", "queued"),
      makeProject("e", "failed"),
    ];
    const stats = deriveDashboardStats(projects);
    expect(stats.totalProjects).toBe(5);
    expect(stats.healthyProjects).toBe(2);
    expect(stats.indexingProjects).toBe(2); // running + queued
    expect(stats.failedProjects).toBe(1);
  });

  it("sums numeric stats across all projects", () => {
    const projects = [
      makeProject("a", "succeeded", { commits: 1000, pullRequests: 20, issues: 10, files: 500 }),
      makeProject("b", "succeeded", { commits: 2000, pullRequests: 30, issues: 15, files: 800 }),
    ];
    const stats = deriveDashboardStats(projects);
    expect(stats.totalCommits).toBe(3000);
    expect(stats.totalPRs).toBe(50);
    expect(stats.totalIssues).toBe(25);
    expect(stats.totalFiles).toBe(1300);
  });

  it("handles single project correctly", () => {
    const project = makeProject("solo", "failed", {
      commits: 42,
      pullRequests: 3,
      issues: 1,
      files: 99,
    });
    const stats = deriveDashboardStats([project]);
    expect(stats.totalProjects).toBe(1);
    expect(stats.failedProjects).toBe(1);
    expect(stats.healthyProjects).toBe(0);
    expect(stats.totalCommits).toBe(42);
  });
});
