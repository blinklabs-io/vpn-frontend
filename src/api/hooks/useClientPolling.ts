import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { checkClientAvailableWithGraceful404 } from "../client";
import {
  updateTransactionStatus,
  updateTransactionAttempts,
  getActivePendingTransactions,
} from "../../utils/pendingTransactions";

interface PollingState {
  isPolling: boolean;
  clientId: string | null;
  attempts: number;
  maxAttempts: number;
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
      };
    }

    return {
      isPolling: false,
      clientId: null,
      attempts: 0,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
    };
  });

  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = useCallback(
    (clientId: string, initialAttempts: number = 0) => {
      setPollingState({
        isPolling: true,
        clientId,
        attempts: initialAttempts,
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
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
        const response = await checkClientAvailableWithGraceful404({
          id: pollingState.clientId!,
        });

        if (response !== null) {
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
