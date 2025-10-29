import { useQueries } from "@tanstack/react-query";
import { checkClientAvailable } from "../client";
import type { ClientAvailableResponse } from "../types";

export function useMultipleClientAvailable(clientIds: string[]) {
  return useQueries({
    queries: clientIds.map((id) => ({
      queryKey: ["clientAvailable", id],
      queryFn: async (): Promise<ClientAvailableResponse> => {
        if (!id) return { msg: undefined };
        return await checkClientAvailable({ id });
      },
      enabled: !!id,
      staleTime: 30 * 1000,
    })),
  });
}
