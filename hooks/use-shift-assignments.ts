"use client";
import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@/lib/api";

export interface CachedShiftAssignment {
  workshiftId: string;
  systemUserId: string;
}

export function useShiftAssignments(workshiftIds: string[]) {
  const api = getApiClient();
  return useQuery<CachedShiftAssignment[], Error>({
    queryKey: ["shiftAssignments", ...workshiftIds.sort()],
    queryFn: async () => {
      const results: CachedShiftAssignment[] = [];
      await Promise.all(
        workshiftIds.map(async (id) => {
          try {
            const userIds = await api.getShiftAssignmentsByShift(id);
            userIds.forEach((uid) => {
              results.push({ workshiftId: id, systemUserId: uid });
            });
          } catch (e) {
          }
        })
      );
      return results;
    },
    enabled: workshiftIds.length > 0,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
