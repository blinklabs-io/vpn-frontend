import { useState, useEffect, useMemo, useCallback } from "react";
import { useWalletStore } from "../stores/walletStore";
import {
  useRefData,
  useSignup,
  useClientList,
  useClientProfile,
  useClientPolling,
  useRenewVpn,
} from "../api/hooks";
import VpnInstance from "../components/VpnInstance";
import PurchaseCard from "../components/PurchaseCard";
import ConfirmModal from "../components/ConfirmModal";
import type { ClientInfo } from "../api/types";
import LoadingOverlay from "../components/LoadingOverlay";
import TooltipGuide, { type TooltipStep } from "../components/TooltipGuide";
import WalletConnection from "../components/WalletConnection";
import {
  getPendingTransactions,
  addPendingTransaction,
  removePendingTransaction,
  cleanupCompletedTransactions,
} from "../utils/pendingTransactions";
import {
  sortVpnInstances,
  filterOptions,
  type SortOption,
} from "../utils/instanceSort";

const Account = () => {
  const {
    isConnected,
    walletAddress,
    signAndSubmitTransaction,
    setVpnConfigUrl,
  } = useWalletStore();
  const [isPurchaseLoading, setIsPurchaseLoading] = useState<boolean>(false);
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(false);
  const [pendingTx, setPendingTx] = useState<{
    type: "purchase" | "renew" | "buy-time";
    txCbor: string;
    clientId: string;
    durationLabel: string;
    durationMs: number;
    region: string;
    newExpiration?: string;
  } | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Get pending clients from localStorage (will be reactive to changes)
  const [pendingClientsFromStorage, setPendingClientsFromStorage] = useState(
    () => getPendingTransactions().filter((tx) => tx.status === "pending"),
  );
  // Renewal state
  const [renewingInstanceId, setRenewingInstanceId] = useState<string | null>(
    null,
  );
  const [selectedRenewDuration, setSelectedRenewDuration] = useState<
    number | null
  >(null);
  const [renewMode, setRenewMode] = useState<"renew" | "buy" | null>(null);
  const [renewingInstanceExpiration, setRenewingInstanceExpiration] =
    useState<Date | null>(null);
  const [showAdditionalPurchaseCards, setShowAdditionalPurchaseCards] =
    useState(false);
  const [selectedDurationIndex, setSelectedDurationIndex] = useState(0);

  const tooltipSteps: TooltipStep[] = [
    {
      id: "duration-tooltip",
      content:
        "Choose how long you want your VPN access to last. Longer durations offer better value!",
      placement: "top",
    },
    {
      id: "price-tooltip",
      content:
        "This shows the cost in ADA for your selected duration. Make sure you have enough balance!",
      placement: "bottom",
    },
    {
      id: "wallet-tooltip",
      content:
        "Connect your Cardano wallet here to start purchasing VPN access. We support all major Cardano wallets!",
      placement: "left",
    },
    {
      id: "purchase-tooltip",
      content:
        "Click here to purchase your VPN access! Make sure your wallet is connected and you have enough ADA balance.",
      placement: "top",
    },
    {
      id: "instances-tooltip",
      content:
        "Your active VPN instances will appear here. Click 'Get Config' to download your VPN configuration files!",
      placement: "top",
    },
  ];

  const { data: refData } = useRefData({
    queryKey: ["refdata"],
    enabled: true,
  });

  // Initialize hooks first
  const clientProfileMutation = useClientProfile();
  const { startPolling } = useClientPolling();

  const signupMutation = useSignup();

  const renewMutation = useRenewVpn();

  const { data: clientList, isLoading: isLoadingClients } = useClientList(
    { ownerAddress: walletAddress || "" },
    { enabled: !!walletAddress && isConnected },
  );

  const dedupedClientList = useMemo(() => {
    const seenIds = new Set<string>();
    return (clientList || []).filter((client) => {
      if (seenIds.has(client.id)) return false;
      seenIds.add(client.id);
      return true;
    });
  }, [clientList]);

  /**
   * Normalize duration to milliseconds.
   *
   * API Contract: The backend API (RefDataResponse.prices[].duration, ClientInfo.duration)
   * may return durations in either seconds or milliseconds depending on configuration.
   * This function uses a heuristic threshold to detect the unit.
   *
   * Threshold: 1 hour (3,600,000ms) - values below this are assumed to be in seconds.
   *
   * IMPORTANT: This heuristic assumes VPN subscription durations are >= 1 hour when
   * expressed in milliseconds. If the backend ever returns sub-1-hour durations in
   * milliseconds (e.g., 30 minutes = 1,800,000ms for testing), they would be incorrectly
   * multiplied by 1000. In that case, coordinate with the backend team to either:
   * - Ensure consistent units in API responses
   * - Add an explicit unit field to the API schema
   * - Use a configuration flag for the expected format
   *
   * @param duration - Duration value from API (seconds or milliseconds)
   * @returns Duration in milliseconds
   */
  const normalizeDurationMs = (duration?: number) => {
    if (!duration) return 0;
    return duration < 1000 * 60 * 60 ? duration * 1000 : duration;
  };

  const formatDuration = (durationMs: number) => {
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      if (days % 365 === 0) {
        const years = days / 365;
        return years === 1 ? "1 year" : `${years} years`;
      }

      return days === 1 ? "1 day" : `${days} days`;
    }

    return hours === 1 ? "1 hour" : `${hours} hours`;
  };

  const formatTimeDisplay = (durationMs: number) => {
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      if (days % 365 === 0) {
        const years = days / 365;
        return years === 1 ? "1 year" : `${years} years`;
      }

      return `${days} day${days > 1 ? "s" : ""}`;
    }

    if (hours >= 24) {
      const wholeDays = Math.floor(hours / 24);
      if (wholeDays % 365 === 0 && wholeDays > 0) {
        const years = wholeDays / 365;
        return years === 1 ? "1 year" : `${years} years`;
      }
      return `${wholeDays} day${wholeDays > 1 ? "s" : ""}`;
    }

    return hours === 1 ? "1 hour" : `${hours} hours`;
  };

  const formatPrice = (priceLovelace: number) => {
    return (priceLovelace / 1000000).toFixed(2);
  };

  const durationOptions = Array.isArray(refData?.prices)
    ? refData.prices.map((priceData: { duration: number; price: number }) => {
        const normalizedDuration = normalizeDurationMs(priceData.duration);
        return {
          label: formatDuration(normalizedDuration),
          value: normalizedDuration,
          timeDisplay: formatTimeDisplay(normalizedDuration),
          price: priceData.price,
        };
      })
    : [];
  const selectedDurationOption =
    durationOptions[selectedDurationIndex] ?? durationOptions[0];

  useEffect(() => {
    if (durationOptions.length === 0) {
      setSelectedDurationIndex(0);
      return;
    }

    setSelectedDurationIndex((prev) =>
      Math.min(prev, durationOptions.length - 1),
    );
  }, [durationOptions.length]);

  const regions = Array.isArray(refData?.regions) ? refData.regions : [];
  const payloadRegion = regions[0] ?? "";

  useEffect(() => {
    cleanupCompletedTransactions();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPendingClientsFromStorage(
        getPendingTransactions().filter((tx) => tx.status === "pending"),
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!dedupedClientList || pendingClientsFromStorage.length === 0) return;

    const availableClientIds = new Set(
      dedupedClientList.map((client) => client.id),
    );

    const hasCompleted = pendingClientsFromStorage.some((pending) =>
      availableClientIds.has(pending.id),
    );
    if (!hasCompleted) return;

    pendingClientsFromStorage.forEach((pending) => {
      if (availableClientIds.has(pending.id)) {
        console.log(
          `Removing completed transaction ${pending.id} from localStorage`,
        );
        removePendingTransaction(pending.id);
      }
    });

    const timeoutId = window.setTimeout(() => {
      setPendingClientsFromStorage((prev) =>
        prev.filter((pending) => !availableClientIds.has(pending.id)),
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [dedupedClientList, pendingClientsFromStorage]);

  const handlePurchase = async (durationOverride?: number) => {
    if (!walletAddress) {
      setErrorModal("No wallet address available");
      return;
    }

    const targetDuration =
      durationOverride ??
      selectedDurationOption?.value ??
      durationOptions[0]?.value ??
      0;
    const option =
      durationOptions.find(
        (opt: { value: number }) => opt.value === targetDuration,
      ) ?? selectedDurationOption ?? durationOptions[0];

    if (!option) {
      setErrorModal("Please select a duration");
      return;
    }

    if (!payloadRegion) {
      setErrorModal("Please select a region");
      return;
    }

    setIsPurchaseLoading(true);

    try {
      const payload = {
        paymentAddress: walletAddress,
        duration: targetDuration,
        price: option.price,
        region: payloadRegion,
      };

      const data = await signupMutation.mutateAsync(payload);
      setPendingTx({
        type: "purchase",
        txCbor: data.txCbor,
        clientId: data.clientId,
        durationMs: targetDuration,
        durationLabel: formatDuration(targetDuration),
        region: payloadRegion,
      });
    } catch (error) {
      console.error("Signup failed:", error);
      setErrorModal("Failed to build purchase transaction");
    } finally {
      setIsPurchaseLoading(false);
    }
  };

  const handleGetConfig = async (instanceId: string) => {
    try {
      setIsConfigLoading(true);
      const s3Url = await clientProfileMutation.mutateAsync(instanceId);

      setVpnConfigUrl(s3Url);

      const link = document.createElement("a");
      link.href = s3Url;
      link.download = `vpn-config-${instanceId}.conf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsConfigLoading(false);
    } catch (error) {
      console.error("Failed to get config:", error);
      setErrorModal("Failed to get VPN config. Please try again.");
      setIsConfigLoading(false);
    }
  };

  const startDurationSelection = (
    instanceId: string,
    expirationDate: Date,
    mode: "renew" | "buy",
  ) => {
    setRenewingInstanceId(instanceId);
    setRenewMode(mode);
    setRenewingInstanceExpiration(expirationDate);
    setSelectedRenewDuration(null);
  };

  const handleCancelRenewal = () => {
    setRenewingInstanceId(null);
    setSelectedRenewDuration(null);
    setRenewMode(null);
    setRenewingInstanceExpiration(null);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingTx) return;

    const txToSubmit = pendingTx;
    setPendingTx(null); // close modal immediately while continuing flow
    setIsPurchaseLoading(true);
    try {
      await signAndSubmitTransaction(txToSubmit.txCbor);
      const pendingClient = {
        id: txToSubmit.clientId,
        region: txToSubmit.region,
        duration: txToSubmit.durationMs,
        purchaseTime: new Date().toISOString(),
      };
      addPendingTransaction(pendingClient);
      setPendingClientsFromStorage(
        getPendingTransactions().filter((tx) => tx.status === "pending"),
      );
      startPolling(txToSubmit.clientId);
    } catch (error) {
      console.error("Transaction error details:", error);
      setErrorModal("Failed to sign and submit transaction");
    } finally {
      setIsPurchaseLoading(false);
    }
  };

  const handleCancelPending = useCallback(() => {
    setPendingTx(null);
    setIsPurchaseLoading(false);
  }, []);

  const closeErrorModal = useCallback(() => {
    setErrorModal(null);
  }, []);

  const handleConfirmRenewal = async () => {
    if (!walletAddress) {
      setErrorModal("No wallet address available");
      return;
    }

    if (!renewingInstanceId || !selectedRenewDuration) {
      setErrorModal("Please select a renewal duration");
      return;
    }

    if (!renewMode) {
      setErrorModal("No renewal action selected");
      return;
    }

    const renewOption = durationOptions.find(
      (opt) => opt.value === selectedRenewDuration,
    );
    if (!renewOption) {
      setErrorModal("Invalid duration selected");
      return;
    }

    if (!payloadRegion) {
      setErrorModal("Could not determine region for renewal");
      return;
    }

    setIsPurchaseLoading(true);
    try {
      const data = await renewMutation.mutateAsync({
        paymentAddress: walletAddress,
        clientId: renewingInstanceId,
        duration: selectedRenewDuration,
        price: renewOption.price,
        region: payloadRegion,
      });

      const newExpirationDate =
        renewMode === "buy" && renewingInstanceExpiration
          ? new Date(
              renewingInstanceExpiration.getTime() + selectedRenewDuration,
            )
          : null;

      setPendingTx({
        type: renewMode === "buy" ? "buy-time" : "renew",
        txCbor: data.txCbor,
        clientId: renewingInstanceId,
        durationMs: selectedRenewDuration,
        durationLabel: formatDuration(selectedRenewDuration),
        region: payloadRegion,
        newExpiration: newExpirationDate
          ? newExpirationDate.toLocaleString()
          : undefined,
      });
    } catch (error) {
      console.error("Renew failed:", error);
      setErrorModal("Failed to build renewal transaction");
    } finally {
      setIsPurchaseLoading(false);
    }

    setRenewingInstanceId(null);
    setSelectedRenewDuration(null);
    setRenewMode(null);
    setRenewingInstanceExpiration(null);
  };

  const formatTimeRemaining = (expirationDate: string) => {
    const now = new Date();
    const expiration = new Date(expirationDate);
    const diffMs = expiration.getTime() - now.getTime();

    if (diffMs <= 0) {
      return "n/a";
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  const vpnInstances = (() => {
    const now = new Date();

    const activeInstances = dedupedClientList
      ? dedupedClientList.map((client: ClientInfo) => {
          const expirationTime = new Date(client.expiration).getTime();
          const isActive = expirationTime > now.getTime();
          const normalizedDurationMs =
            normalizeDurationMs(client.duration) ||
            Math.max(expirationTime - now.getTime(), 0) as number;

          return {
            id: client.id,
            region: client.region,
            duration: formatDuration(normalizedDurationMs),
            status: isActive ? ("Active" as const) : ("Expired" as const),
            expires: formatTimeRemaining(client.expiration),
            expirationDate: new Date(client.expiration),
            originalDuration: normalizedDurationMs,
          };
        })
      : [];

    const activeClientIds = new Set(
      activeInstances.map((instance) => instance.id),
    );

    const pendingInstances = pendingClientsFromStorage
      .filter((pending) => !activeClientIds.has(pending.id))
      .map((pending) => ({
        id: pending.id,
        region: pending.region,
        duration: formatDuration(pending.duration),
        status: "Pending" as const,
        expires: "Setting up...",
        expirationDate: new Date(
          new Date(pending.purchaseTime).getTime() + 24 * 60 * 60 * 1000,
        ),
        originalDuration: pending.duration,
      }));

    const allInstances = [...pendingInstances, ...activeInstances];

    return sortVpnInstances(
      allInstances,
      filterOptions[0].value as SortOption,
    );
  })();

  const hasAnyInstances = vpnInstances.length > 0;
  const hasActiveInstance =
    vpnInstances.findIndex((instance) => instance.status === "Active") !== -1;
  const shouldShowPurchaseCards =
    !isConnected || !hasAnyInstances || showAdditionalPurchaseCards;
  const isHeroLoading = isLoadingClients;
  const isInstancesLoading = isLoadingClients;
  const areAllInstancesExpired =
    !isInstancesLoading &&
    isConnected &&
    vpnInstances.length > 0 &&
    vpnInstances.every((instance) => instance.status === "Expired");

  const shouldEnableTooltipGuide = !hasAnyInstances;

  const renderContent = (showTooltips: boolean) => (
    <div
      className="min-h-screen w-full overflow-x-hidden flex flex-col items-center pt-16 pb-16"
    >
          <LoadingOverlay
            isVisible={isPurchaseLoading || isConfigLoading}
            messageTop={
              isPurchaseLoading
                ? "Awaiting Transaction Confirmation"
                : "Preparing VPN Configuration"
            }
            messageBottom={
              isPurchaseLoading
                ? "Processing Purchase"
                : "Downloading Config File"
            }
          />

          {pendingTx && (
            <ConfirmModal
              isOpen
              title={
                pendingTx.type === "purchase"
                  ? "VPN Purchase"
                  : pendingTx.type === "buy-time"
                    ? "Buy Time"
                    : "VPN Renewal"
              }
              message={
                <div className="space-y-1 text-left">
                  <p className="text-sm text-gray-900">
                    Duration:{" "}
                    <span className="font-semibold">{pendingTx.durationLabel}</span>
                  </p>
                  <p className="text-sm text-gray-900">
                    Region: <span className="font-semibold">{pendingTx.region}</span>
                  </p>
                  {pendingTx.newExpiration && (
                    <p className="text-sm text-gray-900">
                      New expiration:{" "}
                      <span className="font-semibold">{pendingTx.newExpiration}</span>
                    </p>
                  )}
                </div>
              }
              confirmLabel="Confirm"
              cancelLabel="Close"
              onConfirm={handleConfirmSubmit}
              onCancel={handleCancelPending}
            />
          )}

          {errorModal && (
            <ConfirmModal
              isOpen
              title="Error"
              message={errorModal}
              showConfirm={false}
              cancelLabel="Close"
              onConfirm={closeErrorModal}
              onCancel={closeErrorModal}
            />
          )}

          <div className="w-full max-w-[1200px] px-4 md:px-6 text-white flex flex-col gap-8">

            {/* Hero */}
            <div className="flex flex-col items-center text-center gap-4 mt-16">
              {isHeroLoading ? (
                <>
                  <div className="h-8 w-64 rounded-lg bg-white/20 animate-pulse md:w-80" />
                  <div className="h-4 w-72 rounded-lg bg-white/10 animate-pulse md:w-96" />
                  <div className="h-6 w-56 rounded-lg bg-white/20 animate-pulse md:w-72" />
                </>
              ) : !isConnected || !hasAnyInstances ? (
                <>
                  <h1 className="font-exo-2 font-black text-[24px] leading-[110%] tracking-[0] text-center md:text-[32px] md:leading-[100%]">
                    Private, account-free VPN access
                  </h1>
                  <p className="font-ibm-plex font-normal text-[14px] leading-[120%] tracking-[0] text-center text-[#E1B8FF] md:text-[16px] md:leading-[100%]">
                    Decentralized. No tracking. No subscriptions.
                  </p>
                  <p className="text-lg font-semibold mt-2">
                    Get NABU VPN Access Now
                  </p>
                </>
              ) : hasActiveInstance ? (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className="font-exo-2 font-black text-[24px] leading-[110%] tracking-[0] text-center md:text-[32px] md:leading-[100%]">
                      VPN Active
                    </h1>
                    <img
                      src="/checks.svg"
                      alt="VPN Active"
                      className="h-8 w-8"
                    />
                  </div>
                  <p className="font-ibm-plex font-normal text-[14px] leading-[130%] tracking-[0] text-center text-[#E1B8FF] md:text-[16px] md:leading-[120%]">
                    Your VPN subscription is active. Download your profile to connect, or add more connections or renew to extend service.
                  </p>
                </>
              ) : areAllInstancesExpired ? (
                <>
                  <h1 className="font-exo-2 font-black text-[24px] leading-[110%] tracking-[0] text-center md:text-[32px] md:leading-[100%]">
                    You're no longer protected.
                  </h1>
                  <p className="font-ibm-plex font-normal text-[14px] leading-[130%] tracking-[0] text-center text-[#E1B8FF] md:text-[16px] md:leading-[120%]">
                    Restore your encrypted connection in seconds and keep your activity
                    hidden.
                  </p>
                </>
              ) : null}
            </div>

            {/* Purchase cards */}
            {shouldShowPurchaseCards && (
              <div className="flex flex-col gap-4">
                {durationOptions.length > 0 ? (
                  <>
                    {/* Mobile: single card with sliding selector */}
                    <div className="flex flex-col gap-4 md:hidden">
                      <div
                        className="relative flex items-center bg-black/50 rounded-2xl p-2 border border-white/20 overflow-hidden"
                      >
                        <div
                        className="absolute top-2 bottom-2 left-2 rounded-xl bg-white shadow-lg transition-transform duration-300 ease-out"
                          style={{
                            width: `calc((100% - 1rem) / ${durationOptions.length})`,
                            transform: `translateX(${selectedDurationIndex * 100}%)`,
                          }}
                        />
                        {durationOptions.map((option, index) => (
                          <button
                            key={option.value}
                            className={`relative z-10 flex-1 py-2 px-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                              selectedDurationIndex === index
                                ? "text-black"
                                : "text-white font-semibold"
                            }`}
                            onClick={() => setSelectedDurationIndex(index)}
                          >
                            {option.timeDisplay}
                          </button>
                        ))}
                      </div>

                      <div className="relative overflow-hidden">
                        <div
                          key={selectedDurationOption?.value ?? "vpn-card"}
                          className="transition-transform duration-300 ease-out"
                          style={{ transform: "translateX(0)" }}
                        >
                          <PurchaseCard
                            option={selectedDurationOption}
                            isConnected={isConnected}
                            isProcessing={signupMutation.isPending}
                            onPurchase={(duration) => handlePurchase(duration)}
                            showTooltips={showTooltips}
                            highlightDuration
                            highlightPrice
                            highlightPurchase
                            formatPrice={formatPrice}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Desktop: show all options */}
                    <div className="hidden md:flex flex-col gap-5">
                      <div className="flex flex-wrap justify-center gap-5">
                        {durationOptions.map((option, index) => (
                          <PurchaseCard
                            key={option.value}
                            option={option}
                            isConnected={isConnected}
                            isProcessing={signupMutation.isPending}
                            onPurchase={(duration) => handlePurchase(duration)}
                            showTooltips={showTooltips}
                            highlightDuration={index === 0}
                            highlightPrice={index === 0}
                            highlightPurchase={index === 0}
                            formatPrice={formatPrice}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Mobile loading skeleton */}
                    <div className="flex md:hidden">
                      <div className="w-full sm:w-[320px] h-[180px] bg-white/10 rounded-2xl animate-pulse" />
                    </div>
                    {/* Desktop loading skeletons */}
                    <div className="hidden md:flex flex-wrap justify-center gap-5">
                      <div className="w-[320px] h-[180px] bg-white/10 rounded-2xl animate-pulse" />
                      <div className="w-[320px] h-[180px] bg-white/10 rounded-2xl animate-pulse" />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Instances */}
            <div
              className={`rounded-2xl bg-[#00000080] border border-white/10 shadow-[0_24px_70px_-32px_rgba(0,0,0,0.8)] p-4 md:p-6 ${
                !isInstancesLoading && !isConnected && vpnInstances.length === 0
                  ? "md:bg-transparent md:border-none md:shadow-none md:p-0"
                  : ""
              }`}
            >
              <div className="flex flex-row items-center justify-between gap-3 w-full">
                {isInstancesLoading ? (
                  <div className="flex-1 h-6 rounded bg-white/10 animate-pulse" />
                ) : (
                  <p
                    className={`flex-1 flex items-center font-exo-2 font-black text-sm leading-[100%] tracking-[0] ${
                      vpnInstances.length > 0 && isConnected
                        ? "justify-start text-left"
                        : "justify-center text-center"
                    } md:justify-start md:text-left`}
                  >
                    <span className="md:hidden">
                      {(vpnInstances.length > 0 && isConnected)
                        ? "VPN Instances"
                        : "No VPN Instances or Connected Wallet Found"}
                    </span>
                    <span className="hidden md:inline">
                      {(vpnInstances.length > 0 && isConnected)
                        ? "VPN Instances"
                        : isConnected
                          ? "No VPN Instances Yet"
                          : ""}
                    </span>
                  </p>
                )}
                {!isInstancesLoading && isConnected && vpnInstances.length > 0 && (
                  <button
                    className={`flex-shrink-0 rounded-full py-2 px-5 text-black font-semibold text-sm bg-white transition-all cursor-pointer hover:scale-[1.01] ${
                      areAllInstancesExpired ? "spinning-gradient-border" : ""
                    }`}
                    onClick={() => setShowAdditionalPurchaseCards(true)}
                  >
                    + Add New
                  </button>
                )}
              </div>

              {isLoadingClients ? (
                <div className="grid grid-cols-1 gap-4 w-full">
                  {[1, 2, 3, 4].map((index) => (
                    <div
                      key={index}
                      className="flex p-4 flex-col justify-center items-start gap-3 w-full rounded-md backdrop-blur-xs bg-[rgba(255,255,255,0.20)]"
                    >
                      <div className="flex flex-col items-start gap-1 w-full">
                        <div className="flex justify-between items-start w-full gap-2">
                          <div className="h-4 bg-gray-300/20 rounded animate-pulse w-20"></div>
                          <div className="h-4 bg-gray-300/20 rounded animate-pulse w-24"></div>
                        </div>
                        <div className="flex justify-between items-start w-full">
                          <div className="flex items-center gap-2">
                            <div className="h-4 bg-gray-300/20 rounded animate-pulse w-16"></div>
                            <div className="w-2 h-2 bg-gray-300/20 rounded-full animate-pulse"></div>
                          </div>
                          <div className="h-4 bg-gray-300/20 rounded animate-pulse w-20"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center w-full">
                        <div className="w-5 h-5 bg-gray-300/20 rounded animate-pulse"></div>
                        <div className="h-8 bg-gray-300/20 rounded-md animate-pulse w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : vpnInstances.length > 0 ? (
                <div
                  className="grid grid-cols-1 gap-4 w-full mt-4"
                  {...(showTooltips && {
                    "data-tooltip-id": "instances-tooltip",
                  })}
                >
                  {vpnInstances.map((instance) => (
                    <VpnInstance
                      key={instance.id}
                      region={instance.region}
                      status={instance.status}
                      expires={instance.expires}
                      shouldSpinRenew={areAllInstancesExpired}
                      onGetConfig={() => handleGetConfig(instance.id)}
                      onStartRenew={() =>
                        startDurationSelection(
                          instance.id,
                          instance.expirationDate,
                          "renew",
                        )
                      }
                      onStartBuyTime={() =>
                        startDurationSelection(
                          instance.id,
                          instance.expirationDate,
                          "buy",
                        )
                      }
                      isRenewExpanded={renewingInstanceId === instance.id}
                      renewMode={
                        renewingInstanceId === instance.id ? renewMode : null
                      }
                      renewDurationOptions={durationOptions}
                      selectedRenewDuration={selectedRenewDuration}
                      onSelectRenewDuration={setSelectedRenewDuration}
                      onConfirmRenewal={handleConfirmRenewal}
                      onCancelRenewal={handleCancelRenewal}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-center text-white/80">
                  {!isConnected && (
                    <div
                      className="md:hidden flex flex-col items-center gap-3 px-2 py-2"
                      {...(showTooltips && {
                        "data-tooltip-id": "wallet-tooltip",
                      })}
                    >
                      <WalletConnection listLayout="dropdown" initiallyOpen={false} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
  );

  return shouldEnableTooltipGuide ? (
    <TooltipGuide
      steps={tooltipSteps}
      storageKey="vpn-account-visited"
      stepDuration={4000}
      enabled={shouldEnableTooltipGuide}
    >
      {(showTooltips) => renderContent(showTooltips)}
    </TooltipGuide>
  ) : (
    renderContent(false)
  );
};

export default Account;
