import { useMutation } from "@tanstack/react-query";
import { authedGetClientProfile } from "../session";

export function useClientProfile() {
  return useMutation({
    // Authenticates with a session token (signs once, then reuses it).
    mutationFn: (clientId: string) => authedGetClientProfile(clientId),
    mutationKey: ["clientProfile"],
  });
}
