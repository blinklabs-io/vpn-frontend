import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useClientPolling } from "../useClientPolling";
import type { PendingTransaction } from "../../../utils/pendingTransactions";
import * as client from "../../client";

vi.mock("../../client", () => ({
  checkClientAvailableWithGraceful404: vi.fn(),
  getClientListWithGraceful404: vi.fn(),
}));

const STORAGE_KEY = "vpn_pending_transactions";
const mockedCheckClientAvailable = vi.mocked(
  client.checkClientAvailableWithGraceful404,
);

const pendingTransaction = (
  overrides: Partial<PendingTransaction> = {},
): PendingTransaction => ({
  id: "client-123",
  region: "us-east",
  duration: 86_400_000,
  purchaseTime: "2026-11-21T12:00:00.000Z",
  status: "pending",
  attempts: 0,
  maxAttempts: 20,
  protocol: "openvpn",
  ...overrides,
});

const storedTransactions = (): PendingTransaction[] =>
  JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as PendingTransaction[];

describe("useClientPolling", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.useRealTimers();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it.each([
    ["unavailable credentials", null],
    ["an availability request error", new Error("request failed")],
  ])(
    "persists a terminal state after exhausting %s",
    async (_name, outcome) => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([pendingTransaction({ attempts: 19 })]),
      );
      if (outcome instanceof Error) {
        mockedCheckClientAvailable.mockRejectedValueOnce(outcome);
      } else {
        mockedCheckClientAvailable.mockResolvedValueOnce(outcome);
      }

      const firstMount = renderHook(() => useClientPolling(), { wrapper });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(20_000);
      });

      expect(mockedCheckClientAvailable).toHaveBeenCalledTimes(1);
      expect(firstMount.result.current.isPolling).toBe(false);
      expect(storedTransactions()).toEqual([
        expect.objectContaining({
          id: "client-123",
          status: "failed",
          attempts: 20,
        }),
      ]);

      firstMount.unmount();
      const refreshed = renderHook(() => useClientPolling(), { wrapper });
      expect(refreshed.result.current.isPolling).toBe(false);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(120_000);
      });

      expect(mockedCheckClientAvailable).toHaveBeenCalledTimes(1);
    },
  );

  it("persists successful recovery as complete", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([pendingTransaction()]),
    );
    mockedCheckClientAvailable.mockResolvedValueOnce({ msg: "available" });

    const { result } = renderHook(() => useClientPolling(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });

    expect(result.current.isPolling).toBe(false);
    expect(storedTransactions()).toEqual([
      expect.objectContaining({
        id: "client-123",
        status: "complete",
        attempts: 0,
      }),
    ]);
  });
});
