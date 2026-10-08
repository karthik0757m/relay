import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProjectOverviewPage } from "./ProjectOverviewPage";

// Mock the hooks
vi.mock("@/lib/api/hooks", () => ({
  useProject: vi.fn(() => ({
    data: {
      id: "test-project",
      name: "test",
      fullName: "owner/test",
      description: "A test project",
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
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useSyncProject: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock("./useSyncPolling", () => ({
  useSyncPolling: vi.fn(() => ({
    data: null,
  })),
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/app/projects/test-project"]}>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("ProjectOverviewPage", () => {
  it("displays project information", () => {
    renderWithProviders(<ProjectOverviewPage />);
    
    expect(screen.getByText("owner/test")).toBeInTheDocument();
    expect(screen.getByText("A test project")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("healthy")).toBeInTheDocument();
  });

  it("shows health metrics", () => {
    renderWithProviders(<ProjectOverviewPage />);
    
    expect(screen.getByText("Repository Health")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument(); // health score
    expect(screen.getByText("70%")).toBeInTheDocument(); // documentation coverage
  });

  it("displays project stats", () => {
    renderWithProviders(<ProjectOverviewPage />);
    
    expect(screen.getByText("250 files")).toBeInTheDocument();
    expect(screen.getByText("100 commits")).toBeInTheDocument();
    expect(screen.getByText("10 PRs")).toBeInTheDocument();
    expect(screen.getByText("5 issues")).toBeInTheDocument();
  });

  it("shows suggested actions", () => {
    renderWithProviders(<ProjectOverviewPage />);
    
    expect(screen.getByText("Suggested Actions")).toBeInTheDocument();
    expect(screen.getByText("Start onboarding")).toBeInTheDocument();
    expect(screen.getByText("Ask about architecture")).toBeInTheDocument();
    expect(screen.getByText("Generate handoff")).toBeInTheDocument();
  });
});