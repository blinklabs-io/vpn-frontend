import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  checkClientAvailableWithGraceful404,
  getClientListWithGraceful404,
} from "../client";
import {
  updateTransactionStatus,
  updateTransactionAttempts,
  getActivePendingTransactions,
} from "../../utils/pendingTransactions";
import { useWalletStore } from "../../stores/walletStore";
import type { VpnProtocol } from "../types";

interface PollingState {
  isPolling: boolean;
  clientId: string | null;
  attempts: number;
  maxAttempts: number;
  protocol: VpnProtocol;
  // Set for renewals: the pre-renewal expiration (ms). When present, the tx is
  // "ready" once the client's indexed expiration exceeds it, rather than merely
  // existing (which is always true for a renewed, pre-existing client).
  expectedExpirationAfter: number | null;
}

const DEFAULT_MAX_ATTEMPTS = 20;

export function useClientPolling() {
  const [pollingState, setPollingState] = useState<PollingState>(() => {
    const pendingTransactions = getActivePendingTransactions();
    const firstPending = pendingTransactions[0];

    if (firstPending) {
      return {
        isPolling: true,
        clientId: firstPending.id,
        attempts: firstPending.attempts,
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
        protocol: firstPending.protocol,
        expectedExpirationAfter: firstPending.expectedExpirationAfter ?? null,
      };
    }

    return {
      isPolling: false,
      clientId: null,
      attempts: 0,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
      protocol: "openvpn",
      expectedExpirationAfter: null,
    };
  });

  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = useCallback(
    (
      clientId: string,
      protocol: VpnProtocol,
      initialAttempts: number = 0,
      expectedExpirationAfter: number | null = null,
    ) => {
      setPollingState({
        isPolling: true,
        clientId,
        attempts: initialAttempts,
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
        protocol,
        expectedExpirationAfter,
      });
    },
    [],
  );

  const stopPolling = useCallback((markComplete: boolean = false) => {
    setPollingState((prev) => {
      const currentClientId = prev.clientId;

      if (markComplete && currentClientId) {
        updateTransactionStatus(currentClientId, "complete");
      }

      return {
        ...prev,
        isPolling: false,
        clientId: null,
        attempts: 0,
      };
    });

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!pollingState.isPolling || !pollingState.clientId) {
      return;
    }

    const pollClient = async () => {
      try {
        let isReady = false;

        if (pollingState.expectedExpirationAfter !== null) {
          // Renewal: the client already exists, so "exists" tells us nothing.
          // Wait until the indexed expiration advances past its pre-renewal
          // value. /client/list carries expiration for both protocols. If the
          // wallet isn't connected we treat this as "not ready" and keep
          // counting toward maxAttempts so the poll eventually gives up.
          const ownerAddress = useWalletStore.getState().walletAddress;
          const list = ownerAddress
            ? await getClientListWithGraceful404({ ownerAddress })
            : [];
          const client = list.find((c) => c.id === pollingState.clientId);
          isReady =
            !!client &&
            new Date(client.expiration).getTime() >
              pollingState.expectedExpirationAfter;
        } else if (pollingState.protocol === "wireguard") {
          // New signup (WireGuard): subscriptions don't expose
          // /client/available — they're ready as soon as the on-chain
          // transaction confirms and the new clientId surfaces in
          // /client/list. If the wallet isn't connected we treat this attempt
          // as "not ready" and keep counting toward maxAttempts so the poll
          // eventually gives up instead of stalling.
          const ownerAddress = useWalletStore.getState().walletAddress;
          const list = ownerAddress
            ? await getClientListWithGraceful404({ ownerAddress })
            : [];
          isReady = list.some(
            (client) => client.id === pollingState.clientId,
          );
        } else {
          const response = await checkClientAvailableWithGraceful404({
            id: pollingState.clientId!,
          });
          isReady = response !== null;
        }

        if (isReady) {
          stopPolling(true);

          await queryClient.invalidateQueries({ queryKey: ["clientList"] });

          await queryClient.refetchQueries({ queryKey: ["clientList"] });

          return;
        }

        let shouldStop = false;
        setPollingState((prev) => {
          const newAttempts = prev.attempts + 1;

          if (prev.clientId) {
            updateTransactionAttempts(prev.clientId, newAttempts);
          }

          shouldStop = newAttempts >= prev.maxAttempts;

          return {
            ...prev,
            attempts: newAttempts,
          };
        });

        if (shouldStop) {
          stopPolling(false);
        }
      } catch (error) {
        console.error("Error polling client availability:", error);

        let shouldStop = false;
        setPollingState((prev) => {
          const newAttempts = prev.attempts + 1;

          if (prev.clientId) {
            updateTransactionAttempts(prev.clientId, newAttempts);
          }

          shouldStop = newAttempts >= prev.maxAttempts;

          return {
            ...prev,
            attempts: newAttempts,
          };
        });

        if (shouldStop) {
          stopPolling(false);
        }
      }
    };

    const initialTimeout = setTimeout(() => {
      pollClient();
      intervalRef.current = setInterval(pollClient, 40000);
    }, 20000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    pollingState.isPolling,
    pollingState.clientId,
    pollingState.attempts,
    pollingState.maxAttempts,
    pollingState.protocol,
    pollingState.expectedExpirationAfter,
    queryClient,
    stopPolling,
  ]);

  return {
    isPolling: pollingState.isPolling,
    clientId: pollingState.clientId,
    attempts: pollingState.attempts,
    maxAttempts: pollingState.maxAttempts,
    startPolling,
    stopPolling,
  };
}
