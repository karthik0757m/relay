import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardStats } from "./DashboardStats";
import type { Project } from "@/lib/api/types";

const mockProjects: Project[] = [
  {
    id: "proj1",
    name: "repo1",
    fullName: "owner/repo1",
    description: "Test repo 1",
    language: "TypeScript",
    owner: "owner",
    syncStatus: "succeeded",
    lastSyncedAt: "2026-10-08T10:00:00Z",
    stats: { commits: 100, pullRequests: 10, issues: 5, releases: 2, files: 250 },
    health: { overall: 85, documentation: 70, activity: "high" },
    healthLabel: "Healthy",
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: "2026-10-08T10:00:00Z",
  },
  {
    id: "proj2", 
    name: "repo2",
    fullName: "owner/repo2",
    description: "Test repo 2",
    language: "JavaScript",
    owner: "owner",
    syncStatus: "running",
    lastSyncedAt: "2026-10-08T09:00:00Z",
    stats: { commits: 200, pullRequests: 20, issues: 8, releases: 3, files: 400 },
    health: { overall: 60, documentation: 50, activity: "medium" },
    healthLabel: "Indexing",
    createdAt: "2026-09-15T10:00:00Z",
    updatedAt: "2026-10-08T09:00:00Z",
  },
];

describe("DashboardStats", () => {
  it("calculates total projects correctly", () => {
    render(<DashboardStats projects={mockProjects} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Connected Repos")).toBeInTheDocument();
  });

  it("calculates healthy percentage correctly", () => {
    render(<DashboardStats projects={mockProjects} />);
    expect(screen.getByText("50%")).toBeInTheDocument(); // 1 of 2 projects is healthy
    expect(screen.getByText("Healthy Status")).toBeInTheDocument();
  });

  it("calculates total files correctly", () => {
    render(<DashboardStats projects={mockProjects} />);
    expect(screen.getByText("650")).toBeInTheDocument(); // 250 + 400
    expect(screen.getByText("Total Files")).toBeInTheDocument();
  });

  it("calculates total commits correctly", () => {
    render(<DashboardStats projects={mockProjects} />);
    expect(screen.getByText("300")).toBeInTheDocument(); // 100 + 200
    expect(screen.getByText("Total Commits")).toBeInTheDocument();
  });

  it("handles empty projects array", () => {
    render(<DashboardStats projects={[]} />);
    expect(screen.getAllByText("0")).toHaveLength(3); // Connected Repos, Total Files, Total Commits
    expect(screen.getByText("0%")).toBeInTheDocument(); // Healthy Status
  });
});