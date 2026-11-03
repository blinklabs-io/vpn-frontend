import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { authedPost, authedPostPlainText, authedDel } from "../session";
import type {
  WireGuardRegisterRequest,
  WireGuardRegisterResponse,
  WireGuardProfileRequest,
  WireGuardPeerRequest,
  WireGuardDeleteResponse,
  WireGuardDevicesRequest,
  WireGuardDevicesResponse,
} from "../types";

// Register a new device
export function useWireGuardRegister(
  options?: UseMutationOptions<
    WireGuardRegisterResponse,
    Error,
    WireGuardRegisterRequest
  >,
) {
  return useMutation({
    mutationFn: (data: WireGuardRegisterRequest) =>
      authedPost<WireGuardRegisterResponse>("/client/wg-register", data),
    ...options,
  });
}

// Get WireGuard config (auto-registers if not found)
export function useWireGuardProfile(
  options?: UseMutationOptions<string, Error, WireGuardProfileRequest>,
) {
  return useMutation({
    mutationFn: (data: WireGuardProfileRequest) =>
      authedPostPlainText("/client/wg-profile", data), // Returns text/plain
    ...options,
  });
}

// Delete a device
export function useWireGuardDeletePeer(
  options?: UseMutationOptions<
    WireGuardDeleteResponse,
    Error,
    WireGuardPeerRequest
  >,
) {
  return useMutation({
    mutationFn: (data: WireGuardPeerRequest) =>
      authedDel<WireGuardDeleteResponse>("/client/wg-peer", data),
    ...options,
  });
}

// List all devices for a client
export function useWireGuardDevices(
  request: WireGuardDevicesRequest,
  options?: Omit<
    UseQueryOptions<WireGuardDevicesResponse, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: ["wireGuardDevices", request.client_id],
    queryFn: () =>
      authedPost<WireGuardDevicesResponse>("/client/wg-devices", request),
    ...options,
  });
}
