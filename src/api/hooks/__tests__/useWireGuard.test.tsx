import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useWireGuardRegister,
  useWireGuardProfile,
  useWireGuardDeletePeer,
  useWireGuardDevices,
} from "../useWireGuard";
import { createTestQueryClient } from "../../../test/utils";
import * as client from "../../client";
import type {
  WireGuardRegisterRequest,
  WireGuardRegisterResponse,
  WireGuardProfileRequest,
  WireGuardPeerRequest,
  WireGuardDeleteResponse,
  WireGuardDevicesRequest,
  WireGuardDevicesResponse,
} from "../../types";

vi.mock("../../client", () => ({
  post: vi.fn(),
  postPlainText: vi.fn(),
  del: vi.fn(),
}));

const mockedPost = vi.mocked(client.post);
const mockedPostPlainText = vi.mocked(client.postPlainText);
const mockedDel = vi.mocked(client.del);

describe("useWireGuard hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.resetAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("useWireGuardRegister", () => {
    const mockRequest: WireGuardRegisterRequest = {
      client_id: "test-client-123",
      timestamp: Date.now(),
      signature: "hex-signature",
      key: "hex-key",
      wg_pubkey: "base64-public-key",
    };

    const mockResponse: WireGuardRegisterResponse = {
      success: true,
      assigned_ip: "10.8.0.2",
      device_count: 1,
      device_limit: 3,
    };

    it("should call correct endpoint with POST method", async () => {
      mockedPost.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useWireGuardRegister(), { wrapper });

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedPost).toHaveBeenCalledWith(
        "/client/wg-register",
        mockRequest,
      );
    });

    it("should return registration response on success", async () => {
      mockedPost.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useWireGuardRegister(), { wrapper });

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.data?.assigned_ip).toBe("10.8.0.2");
      expect(result.current.data?.device_count).toBe(1);
      expect(result.current.data?.device_limit).toBe(3);
    });

    it("should handle API errors", async () => {
      const errorMessage = "Device limit exceeded";
      mockedPost.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useWireGuardRegister(), { wrapper });

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe(errorMessage);
    });

    it("should accept custom mutation options", async () => {
      mockedPost.mockResolvedValueOnce(mockResponse);
      const onSuccessMock = vi.fn();

      const { result } = renderHook(
        () => useWireGuardRegister({ onSuccess: onSuccessMock }),
        { wrapper },
      );

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccessMock).toHaveBeenCalled();
      expect(onSuccessMock.mock.calls[0][0]).toEqual(mockResponse);
      expect(onSuccessMock.mock.calls[0][1]).toEqual(mockRequest);
    });
  });

  describe("useWireGuardProfile", () => {
    const mockRequest: WireGuardProfileRequest = {
      client_id: "test-client-123",
      timestamp: Date.now(),
      signature: "hex-signature",
      key: "hex-key",
      wg_pubkey: "base64-public-key",
    };

    const mockConfigContent = `[Interface]
PrivateKey = base64-private-key
Address = 10.8.0.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = server-public-key
AllowedIPs = 0.0.0.0/0
Endpoint = vpn.example.com:51820`;

    it("should call correct endpoint with POST method", async () => {
      mockedPostPlainText.mockResolvedValueOnce(mockConfigContent);

      const { result } = renderHook(() => useWireGuardProfile(), { wrapper });

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedPostPlainText).toHaveBeenCalledWith(
        "/client/wg-profile",
        mockRequest,
      );
    });

    it("should return plain text config content", async () => {
      mockedPostPlainText.mockResolvedValueOnce(mockConfigContent);

      const { result } = renderHook(() => useWireGuardProfile(), { wrapper });

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(mockConfigContent);
      expect(result.current.data).toContain("[Interface]");
      expect(result.current.data).toContain("[Peer]");
    });

    it("should handle API errors", async () => {
      const errorMessage = "Authentication failed";
      mockedPostPlainText.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useWireGuardProfile(), { wrapper });

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe(errorMessage);
    });

    it("should accept custom mutation options", async () => {
      mockedPostPlainText.mockResolvedValueOnce(mockConfigContent);
      const onSuccessMock = vi.fn();

      const { result } = renderHook(
        () => useWireGuardProfile({ onSuccess: onSuccessMock }),
        { wrapper },
      );

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccessMock).toHaveBeenCalled();
    });
  });

  describe("useWireGuardDeletePeer", () => {
    const mockRequest: WireGuardPeerRequest = {
      client_id: "test-client-123",
      timestamp: Date.now(),
      signature: "hex-signature",
      key: "hex-key",
      wg_pubkey: "base64-public-key-to-delete",
    };

    const mockResponse: WireGuardDeleteResponse = {
      success: true,
      remaining_devices: 2,
    };

    it("should call correct endpoint with DELETE method", async () => {
      mockedDel.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useWireGuardDeletePeer(), { wrapper });

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedDel).toHaveBeenCalledWith("/client/wg-peer", mockRequest);
    });

    it("should return delete response on success", async () => {
      mockedDel.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useWireGuardDeletePeer(), { wrapper });

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.data?.success).toBe(true);
      expect(result.current.data?.remaining_devices).toBe(2);
    });

    it("should handle API errors", async () => {
      const errorMessage = "Device not found";
      mockedDel.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useWireGuardDeletePeer(), { wrapper });

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe(errorMessage);
    });

    it("should accept custom mutation options", async () => {
      mockedDel.mockResolvedValueOnce(mockResponse);
      const onSuccessMock = vi.fn();

      const { result } = renderHook(
        () => useWireGuardDeletePeer({ onSuccess: onSuccessMock }),
        { wrapper },
      );

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccessMock).toHaveBeenCalled();
    });
  });

  describe("useWireGuardDevices", () => {
    const mockRequest: WireGuardDevicesRequest = {
      client_id: "test-client-123",
      timestamp: Date.now(),
      signature: "hex-signature",
      key: "hex-key",
    };

    const mockResponse: WireGuardDevicesResponse = {
      devices: [
        {
          pubkey: "pubkey-1",
          assigned_ip: "10.8.0.2",
          created_at: 1705320000,
        },
        {
          pubkey: "pubkey-2",
          assigned_ip: "10.8.0.3",
          created_at: 1705406400,
        },
      ],
      limit: 3,
    };

    it("should call correct endpoint with POST method", async () => {
      mockedPost.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(
        () => useWireGuardDevices(mockRequest),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedPost).toHaveBeenCalledWith(
        "/client/wg-devices",
        mockRequest,
      );
    });

    it("should return devices list on success", async () => {
      mockedPost.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(
        () => useWireGuardDevices(mockRequest),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.data?.devices).toHaveLength(2);
      expect(result.current.data?.limit).toBe(3);
    });

    it("should return correct device data structure", async () => {
      mockedPost.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(
        () => useWireGuardDevices(mockRequest),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const firstDevice = result.current.data?.devices[0];
      expect(firstDevice?.pubkey).toBe("pubkey-1");
      expect(firstDevice?.assigned_ip).toBe("10.8.0.2");
      expect(firstDevice?.created_at).toBe(1705320000);
    });

    it("should handle empty devices list", async () => {
      const emptyResponse: WireGuardDevicesResponse = {
        devices: [],
        limit: 3,
      };
      mockedPost.mockResolvedValueOnce(emptyResponse);

      const { result } = renderHook(
        () => useWireGuardDevices(mockRequest),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.devices).toHaveLength(0);
    });

    it("should handle API errors", async () => {
      const errorMessage = "Unauthorized";
      mockedPost.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(
        () => useWireGuardDevices(mockRequest, { retry: false }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe(errorMessage);
    });

    it("should accept custom query options", async () => {
      mockedPost.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(
        () => useWireGuardDevices(mockRequest, { staleTime: 5000 }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });
  });

  describe("mutation state management", () => {
    it("should track loading state during request", async () => {
      let resolvePromise: (value: WireGuardRegisterResponse) => void;
      const pendingPromise = new Promise<WireGuardRegisterResponse>(
        (resolve) => {
          resolvePromise = resolve;
        },
      );
      mockedPost.mockReturnValueOnce(pendingPromise);

      const { result } = renderHook(() => useWireGuardRegister(), { wrapper });

      expect(result.current.isPending).toBe(false);

      result.current.mutate({
        client_id: "test",
        timestamp: Date.now(),
        signature: "sig",
        key: "key",
        wg_pubkey: "pubkey",
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Resolve the promise
      resolvePromise!({
        success: true,
        assigned_ip: "10.8.0.2",
        device_count: 1,
        device_limit: 3,
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should reset state between mutations", async () => {
      mockedPost
        .mockRejectedValueOnce(new Error("First error"))
        .mockResolvedValueOnce({
          success: true,
          assigned_ip: "10.8.0.2",
          device_count: 1,
          device_limit: 3,
        });

      const { result } = renderHook(() => useWireGuardRegister(), { wrapper });

      const mockRequest: WireGuardRegisterRequest = {
        client_id: "test",
        timestamp: Date.now(),
        signature: "sig",
        key: "key",
        wg_pubkey: "pubkey",
      };

      // First mutation - error
      result.current.mutate(mockRequest);
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Reset and try again
      result.current.reset();
      await waitFor(() => {
        expect(result.current.isError).toBe(false);
        expect(result.current.error).toBeNull();
      });

      // Second mutation - success
      result.current.mutate(mockRequest);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});
