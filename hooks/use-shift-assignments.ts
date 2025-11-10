"use client";
import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@/lib/api";

export interface CachedShiftAssignment {
  workshiftId: string;
  systemUserId: string;
}

// Aggregates assignments for all workshifts in the given list of ids.
// Provide the list (already filtered by center + month) to avoid the hook itself refetching workshifts.
export function useShiftAssignments(workshiftIds: string[]) {
  const api = getApiClient();
  return useQuery<CachedShiftAssignment[], Error>({
    queryKey: ["shiftAssignments", ...workshiftIds.sort()],
    // If large list, we could chunk; here we parallelize within Promise.all.
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
            // swallow errors for individual shifts (e.g., no assignments)
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
