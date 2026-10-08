import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import { queryKeys } from "../query-keys";
import type { Project, SyncJob } from "../types";

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: () => api.get<Project[]>("/projects"),
  });
}

export function useProject(id?: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id ?? ""),
    queryFn: () => api.get<Project>(`/projects/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      fullName: string;
      description?: string;
      language?: string;
    }) => api.post<Project>("/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<undefined>(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useSyncProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<SyncJob>(`/projects/${id}/sync`),
    onSuccess: (_, projectId) => {
      // Invalidate project details and sync status
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.sync(projectId) });
    },
  });
}
