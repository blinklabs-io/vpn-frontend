import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { post, postPlainText, del } from "../client";
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
      post<WireGuardRegisterResponse>("/client/wg-register", data),
    ...options,
  });
}

// Get WireGuard config (auto-registers if not found)
export function useWireGuardProfile(
  options?: UseMutationOptions<string, Error, WireGuardProfileRequest>,
) {
  return useMutation({
    mutationFn: (data: WireGuardProfileRequest) =>
      postPlainText("/client/wg-profile", data), // Returns text/plain
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
      del<WireGuardDeleteResponse>("/client/wg-peer", data),
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
    queryFn: () => post<WireGuardDevicesResponse>("/client/wg-devices", request),
    ...options,
  });
}
