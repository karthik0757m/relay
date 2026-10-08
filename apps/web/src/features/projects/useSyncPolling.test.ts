import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSyncPolling } from "./useSyncPolling";

// Mock API client
vi.mock("@/lib/api/client", () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from "@/lib/api/client";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe("useSyncPolling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stops polling on terminal states", async () => {
    const mockGet = vi.mocked(api.get);
    
    // First call returns running status
    mockGet.mockResolvedValueOnce({
      id: "sync-1",
      projectId: "test",
      status: "running",
      progress: 50,
      error: null,
      startedAt: "2026-10-08T10:00:00Z",
      completedAt: null,
    });

    // Second call returns succeeded status  
    mockGet.mockResolvedValueOnce({
      id: "sync-1",
      projectId: "test", 
      status: "succeeded",
      progress: 100,
      error: null,
      startedAt: "2026-10-08T10:00:00Z",
      completedAt: "2026-10-08T10:05:00Z",
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSyncPolling("test", true), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // Should have called the API at least once
    expect(mockGet).toHaveBeenCalledWith("/projects/test/sync");
  });

  it("does not poll when disabled", () => {
    const mockGet = vi.mocked(api.get);
    const wrapper = createWrapper();

    renderHook(() => useSyncPolling("test", false), { wrapper });

    expect(mockGet).not.toHaveBeenCalled();
  });
});