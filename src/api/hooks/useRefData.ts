import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { get } from "../client";
import type { RefDataResponse } from "../types";

export function useRefData(options?: UseQueryOptions<RefDataResponse>) {
  return useQuery({
    queryKey: ["refdata"],
    queryFn: () => get<RefDataResponse>("/refdata"),
    ...options,
  });
}
