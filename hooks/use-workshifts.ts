"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient, type WorkshiftRecord, type CreateWorkshiftRequest } from "@/lib/api";

// Fetch all workshifts and cache for 5 minutes
export function useWorkShifts(centerId?: string | undefined) {
  const api = getApiClient();
  const query = useQuery<WorkshiftRecord[], Error>({
    queryKey: ["workshifts", centerId ?? "all"],
    queryFn: async () => {
      return await api.getWorkshifts({ center_id: centerId || undefined });
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// Create a workshift then invalidate only the workshifts list
export function useCreateWorkShift() {
  const api = getApiClient();
  const queryClient = useQueryClient();

  return useMutation<WorkshiftRecord, Error, CreateWorkshiftRequest>({
    mutationFn: async (payload) => {
      return await api.createWorkshift(payload);
    },
    onSuccess: async () => {
      // refresh workshifts cache only
      await queryClient.invalidateQueries({ queryKey: ["workshifts"] });
    },
  });
}
