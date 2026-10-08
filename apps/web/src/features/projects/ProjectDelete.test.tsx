import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProjectsListPage } from "./ProjectsListPage";

// Mock the hooks
const mockDeleteProject = vi.fn();
const mockProjects = [
  {
    id: "test-project",
    name: "test", 
    fullName: "owner/test",
    description: "A test project",
    language: "TypeScript",
    owner: "owner",
    syncStatus: "succeeded" as const,
    lastSyncedAt: "2026-10-08T10:00:00Z",
    stats: { commits: 100, pullRequests: 10, issues: 5, releases: 2, files: 250 },
    health: { overall: 85, documentation: 70, activity: "high" as const },
    healthLabel: "Healthy",
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: "2026-10-08T10:00:00Z",
  },
];

vi.mock("@/lib/api/hooks", () => ({
  useProjects: vi.fn(() => ({
    data: mockProjects,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useDeleteProject: vi.fn(() => ({
    mutateAsync: mockDeleteProject,
    isPending: false,
  })),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: vi.fn(),
    useSearchParams: vi.fn(() => [
      new URLSearchParams(),
      vi.fn(),
    ]),
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

describe("ProjectDelete Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows delete confirm dialog when delete button clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectsListPage />);

    // Find and click delete button
    const deleteButton = screen.getByLabelText("Delete owner/test");
    await user.click(deleteButton);

    // Should show confirm dialog
    expect(screen.getByText("Delete owner/test?")).toBeInTheDocument();
    expect(screen.getByText(/This will permanently remove owner\/test from Relay/)).toBeInTheDocument();
  });

  it("requires typing project name to confirm deletion", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectsListPage />);

    // Open delete dialog
    const deleteButton = screen.getByLabelText("Delete owner/test");
    await user.click(deleteButton);

    // Confirm button should be disabled initially
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    expect(confirmButton).toBeDisabled();

    // Type the wrong name
    const input = screen.getByRole("textbox");
    await user.type(input, "wrong-name");
    expect(confirmButton).toBeDisabled();

    // Type the correct name
    await user.clear(input);
    await user.type(input, "test");
    expect(confirmButton).toBeEnabled();
  });

  it("calls delete mutation when confirmed", async () => {
    const user = userEvent.setup();
    mockDeleteProject.mockResolvedValue(undefined);
    
    renderWithProviders(<ProjectsListPage />);

    // Open delete dialog
    const deleteButton = screen.getByLabelText("Delete owner/test");
    await user.click(deleteButton);

    // Type correct project name
    const input = screen.getByRole("textbox");
    await user.type(input, "test");

    // Confirm deletion
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteProject).toHaveBeenCalledWith("test-project");
    });
  });

  it("closes dialog on cancel", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectsListPage />);

    // Open delete dialog
    const deleteButton = screen.getByLabelText("Delete owner/test");
    await user.click(deleteButton);

    // Click cancel
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText("Delete owner/test?")).not.toBeInTheDocument();
    });
  });
});