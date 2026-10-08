import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardPage } from "./DashboardPage";

// Mock all project-related hooks
const mockProjects = [
  {
    id: "healthy-project",
    name: "healthy",
    fullName: "org/healthy", 
    description: "A healthy project with good metrics",
    language: "TypeScript",
    owner: "org",
    syncStatus: "succeeded" as const,
    lastSyncedAt: "2026-10-08T10:00:00Z",
    stats: { commits: 500, pullRequests: 50, issues: 10, releases: 5, files: 1200 },
    health: { overall: 95, documentation: 90, activity: "high" as const },
    healthLabel: "95% Indexed · Healthy",
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-10-08T10:00:00Z",
  },
  {
    id: "indexing-project",
    name: "indexing",
    fullName: "org/indexing",
    description: "Currently being indexed",
    language: "Python", 
    owner: "org",
    syncStatus: "running" as const,
    lastSyncedAt: "2026-10-08T09:30:00Z",
    stats: { commits: 200, pullRequests: 15, issues: 8, releases: 2, files: 800 },
    health: { overall: 60, documentation: 45, activity: "medium" as const },
    healthLabel: "Indexing (60%)",
    createdAt: "2026-09-15T10:00:00Z", 
    updatedAt: "2026-10-08T09:30:00Z",
  },
  {
    id: "failed-project",
    name: "failed",
    fullName: "org/failed",
    description: "Failed to sync properly",
    language: "Rust",
    owner: "org", 
    syncStatus: "failed" as const,
    lastSyncedAt: "2026-10-07T15:00:00Z",
    stats: { commits: 100, pullRequests: 5, issues: 15, releases: 1, files: 400 },
    health: { overall: 30, documentation: 20, activity: "low" as const },
    healthLabel: "Sync Failed",
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: "2026-10-07T15:00:00Z", 
  },
];

vi.mock("@/lib/api/hooks", () => ({
  useCurrentUser: vi.fn(() => ({
    data: { id: "user1", name: "Test Developer", email: "dev@test.com" },
  })),
  useProjects: vi.fn(() => ({
    data: mockProjects,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useCreateProject: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>,
  };
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("Dashboard Integration", () => {
  it("displays time-appropriate greeting", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/Good \w+, Test/)).toBeInTheDocument();
  });

  it("shows correct dashboard stats derived from project data", () => {
    renderWithProviders(<DashboardPage />);
    
    // Total projects
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Connected Repos")).toBeInTheDocument();
    
    // Healthy percentage (1 of 3 projects has succeeded status = 33%)
    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getByText("Healthy Status")).toBeInTheDocument();
    
    // Total files (1200 + 800 + 400 = 2,400)
    expect(screen.getByText("2,400")).toBeInTheDocument();
    expect(screen.getByText("Total Files")).toBeInTheDocument();
    
    // Total commits (500 + 200 + 100 = 800)
    expect(screen.getByText("800")).toBeInTheDocument();
    expect(screen.getByText("Total Commits")).toBeInTheDocument();
  });

  it("displays recent projects with correct sync status indicators", () => {
    renderWithProviders(<DashboardPage />);
    
    // Should show all 3 projects
    expect(screen.getByText("org/healthy")).toBeInTheDocument();
    expect(screen.getByText("org/indexing")).toBeInTheDocument();
    expect(screen.getByText("org/failed")).toBeInTheDocument();
    
    // Check descriptions
    expect(screen.getByText("A healthy project with good metrics")).toBeInTheDocument();
    expect(screen.getByText("Currently being indexed")).toBeInTheDocument();
    expect(screen.getByText("Failed to sync properly")).toBeInTheDocument();
  });

  it("filters projects by search term", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);
    
    // Initially all projects visible
    expect(screen.getByText("org/healthy")).toBeInTheDocument();
    expect(screen.getByText("org/indexing")).toBeInTheDocument();
    expect(screen.getByText("org/failed")).toBeInTheDocument();
    
    // Search for "healthy"
    const searchInput = screen.getByPlaceholderText("Search your repositories…");
    await user.type(searchInput, "healthy");
    
    // Only healthy project should be visible
    expect(screen.getByText("org/healthy")).toBeInTheDocument();
    expect(screen.queryByText("org/indexing")).not.toBeInTheDocument();
    expect(screen.queryByText("org/failed")).not.toBeInTheDocument();
  });
});