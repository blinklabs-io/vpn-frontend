import { useState, useEffect, useMemo } from "react";
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
import { showSuccess, showError, showCopyableUrl } from "../utils/toast";
import type { ClientInfo } from "../api/types";
import LoadingOverlay from "../components/LoadingOverlay";
import TooltipGuide, { type TooltipStep } from "../components/TooltipGuide";
import {
  getPendingTransactions,
  addPendingTransaction,
  removePendingTransaction,
  cleanupCompletedTransactions,
} from "../utils/pendingTransactions";
import InstanceFilter from "../components/InstanceFilter";
import RegionSelect from "../components/RegionSelect";
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
    enabledWallet,
    setVpnConfigUrl,
  } = useWalletStore();
  const [selectedRegionOverride, setSelectedRegionOverride] =
    useState<string | null>(null);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState<boolean>(false);
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(false);

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
  const [filterOption, setFilterOption] = useState<{
    value: string;
    label: string;
  }>(filterOptions[0]);

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
      id: "region-tooltip",
      content:
        "Select the server region closest to you for the best performance, or choose a different region for location privacy.",
      placement: "top",
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

  const signupMutation = useSignup({
    onSuccess: async (data) => {
      try {
        await signAndSubmitTransaction(data.txCbor);
        showSuccess(`VPN purchase successful! Setting up your instance...`);

        // Add pending client to localStorage
        const pendingClient = {
          id: data.clientId,
          region: resolvedSelectedRegion,
          duration: selectedOption
            ? formatDuration(selectedOption.value)
            : "Unknown",
          purchaseTime: new Date().toISOString(),
        };
        addPendingTransaction(pendingClient);

        setPendingClientsFromStorage(
          getPendingTransactions().filter((tx) => tx.status === "pending"),
        );

        startPolling(data.clientId);

        setIsPurchaseLoading(false);
      } catch (error) {
        console.error("Transaction error details:", error);
        showError("Failed to sign and submit transaction");
        setIsPurchaseLoading(false);
      }
    },
    onError: (error) => {
      console.error("Signup failed:", error);
      showError("Failed to sign and submit transaction");
      setIsPurchaseLoading(false);
    },
  });

  const renewMutation = useRenewVpn({
    onSuccess: async (data, variables) => {
      try {
        await signAndSubmitTransaction(data.txCbor);
        showSuccess("VPN renewal successful! Activating your instance...");
        const pendingClient = {
          id: variables.clientId,
          region: variables.region,
          duration: formatDuration(variables.duration),
          purchaseTime: new Date().toISOString(),
        };
        addPendingTransaction(pendingClient);
        setPendingClientsFromStorage(
          getPendingTransactions().filter((tx) => tx.status === "pending"),
        );
        startPolling(variables.clientId);
        setIsPurchaseLoading(false);
      } catch (error) {
        console.error("Transaction error details:", error);
        showError("Failed to sign and submit transaction");
        setIsPurchaseLoading(false);
      }
    },
    onError: (error) => {
      console.error("Renew failed:", error);
      showError("Failed to build renewal transaction");
      setIsPurchaseLoading(false);
    },
  });

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

    return `${hours.toString().padStart(2, "0")}:00:00`;
  };

  const formatPrice = (priceLovelace: number) => {
    return (priceLovelace / 1000000).toFixed(2);
  };

  const durationOptions = Array.isArray(refData?.prices)
    ? refData.prices.map((priceData: { duration: number; price: number }) => ({
        label: formatDuration(priceData.duration),
        value: priceData.duration,
        timeDisplay: formatTimeDisplay(priceData.duration),
        price: priceData.price,
      }))
    : [];

  const regions = Array.isArray(refData?.regions) ? refData.regions : [];
  const resolvedSelectedRegion =
    selectedRegionOverride && regions.includes(selectedRegionOverride)
      ? selectedRegionOverride
      : regions[0] ?? "";

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

  const selectedOption = durationOptions[0];

  const handlePurchase = (durationOverride?: number) => {
    if (!walletAddress) {
      showError("No wallet address available");
      return;
    }

    const targetDuration =
      durationOverride ?? selectedOption?.value ?? durationOptions[0]?.value ?? 0;
    const option = durationOptions.find(
      (opt: { value: number }) => opt.value === targetDuration,
    );

    if (!option) {
      showError("Please select a duration");
      return;
    }

    if (!resolvedSelectedRegion) {
      showError("Please select a region");
      return;
    }

    // Start loading state for entire purchase process
    setIsPurchaseLoading(true);

    const payload = {
      paymentAddress: walletAddress,
      duration: targetDuration,
      price: option.price,
      region: resolvedSelectedRegion,
    };

    signupMutation.mutate(payload);
  };

  const handleAction = async (instanceId: string, action: string) => {
    if (action === "Get Config") {
      try {
        setIsConfigLoading(true);
        const s3Url = await clientProfileMutation.mutateAsync(instanceId);

        setVpnConfigUrl(s3Url);

        const isMobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          );
        const isVespr = enabledWallet?.toLowerCase() === "vespr";

        const link = document.createElement("a");
        link.href = s3Url;
        link.download = `vpn-config-${instanceId}.conf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show appropriate message based on device/wallet
        if (isMobile || isVespr) {
          showCopyableUrl(
            s3Url,
            isMobile && isVespr
              ? "If download didn't start, copy this URL and paste it into your mobile browser:"
              : isMobile
                ? "If download didn't start on mobile, copy this URL and paste it into your browser:"
                : "If download didn't start in Vespr, copy this URL and paste it into your browser:",
          );
        } else {
          showSuccess("VPN config downloaded successfully!");
          // Still show the copyable URL toast after a brief delay as a fallback
          setTimeout(() => {
            showCopyableUrl(s3Url, "Need the download link again? Copy it here:");
          }, 2000);
        }

        setIsConfigLoading(false);
      } catch (error) {
        console.error("Failed to get config:", error);
        showError("Failed to get VPN config. Please try again.");
        setIsConfigLoading(false);
      }
    } else if (action === "Renew Access") {
      // Toggle renewal expansion for this instance
      setRenewingInstanceId(instanceId);
      setSelectedRenewDuration(null);
    }
  };

  const handleCancelRenewal = () => {
    setRenewingInstanceId(null);
    setSelectedRenewDuration(null);
  };

  const handleConfirmRenewal = () => {
    if (!walletAddress) {
      showError("No wallet address available");
      return;
    }

    if (!renewingInstanceId || !selectedRenewDuration) {
      showError("Please select a renewal duration");
      return;
    }

    const renewOption = durationOptions.find(
      (opt) => opt.value === selectedRenewDuration,
    );
    if (!renewOption) {
      showError("Invalid duration selected");
      return;
    }

    const instanceRegion =
      dedupedClientList?.find((c) => c.id === renewingInstanceId)?.region ||
      resolvedSelectedRegion;
    if (!instanceRegion) {
      showError("Could not determine region for renewal");
      return;
    }

    setIsPurchaseLoading(true);
    renewMutation.mutate({
      paymentAddress: walletAddress,
      clientId: renewingInstanceId,
      duration: selectedRenewDuration,
      price: renewOption.price,
      region: instanceRegion,
    });

    // Reset renewal state
    setRenewingInstanceId(null);
    setSelectedRenewDuration(null);
  };

  const formatTimeRemaining = (expirationDate: string) => {
    const now = new Date();
    const expiration = new Date(expirationDate);
    const diffMs = expiration.getTime() - now.getTime();

    if (diffMs <= 0) {
      return "Expired";
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
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
        duration: pending.duration,
        status: "Pending" as const,
        expires: "Setting up...",
        expirationDate: new Date(
          new Date(pending.purchaseTime).getTime() + 24 * 60 * 60 * 1000,
        ),
        originalDuration: 0,
      }));

    const allInstances = [...pendingInstances, ...activeInstances];

    return sortVpnInstances(allInstances, filterOption.value as SortOption);
  })();

  const hasActiveInstance =
    vpnInstances.findIndex((instance) => instance.status === "Active") !== -1;

  return (
    <TooltipGuide
      steps={tooltipSteps}
      storageKey="vpn-account-visited"
      stepDuration={4000}
    >
      {(showTooltips) => (
        <div className="min-h-screen min-w-screen flex flex-col items-center bg-[linear-gradient(180deg,rgba(28,36,110,0.6)_0%,rgba(4,6,23,0.6)_25%,rgba(4,6,23,0.85)_100%),url('/hero-backdrop.png')] bg-cover bg-top bg-no-repeat pt-16 pb-16">
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

          <div className="w-full max-w-[1200px] px-4 md:px-6 text-white flex flex-col gap-8">

            {/* Hero */}
            <div className="flex flex-col items-center text-center gap-4 mt-16">
              {isConnected && hasActiveInstance ? (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className="font-exo-2 font-black text-[32px] leading-[100%] tracking-[0] text-center">
                      Connected &amp; Secure
                    </h1>
                    <img
                      src="/checks.svg"
                      alt="Connected and secure"
                      className="h-8 w-8"
                    />
                  </div>
                  <p className="font-ibm-plex font-normal text-[16px] leading-[120%] tracking-[0] text-center text-[#E1B8FF]">
                    You're currently protected. Add more connections or renew to
                    extend service.
                  </p>
                </>
              ) : isConnected ? (
                <>
                  <h1 className="font-exo-2 font-black text-[32px] leading-[100%] tracking-[0] text-center">
                    You’re no longer protected.
                  </h1>
                  <p className="font-ibm-plex font-normal text-[16px] leading-[120%] tracking-[0] text-center text-[#E1B8FF]">
                    Restore your encrypted connection in seconds and keep your activity
                    hidden.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="font-exo-2 font-black text-[32px] leading-[100%] tracking-[0] text-center">
                    Private, account-free VPN access
                  </h1>
                  <p className="font-ibm-plex font-normal text-[16px] leading-[100%] tracking-[0] text-center text-[#E1B8FF]">
                    Decentralized. No tracking. No subscriptions.
                  </p>
                  <p className="text-lg font-semibold mt-2">
                    Get NABU VPN Access Now
                  </p>
                </>
              )}
            </div>

            {/* Purchase cards */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap justify-center gap-4">
                {Array.isArray(refData?.prices) && refData.prices.length > 0 ? (
                  durationOptions.map(
                    (option: {
                      value: number;
                      label: string;
                      timeDisplay: string;
                      price: number;
                    }) => (
                      <div
                        key={option.value}
                        className="w-full sm:w-[320px] rounded-2xl p-[1px] bg-[linear-gradient(180deg,#9400FF_0%,rgba(0,0,0,0.5)_70%,rgba(0,0,0,1)_100%)] overflow-hidden"
                        {...(showTooltips && {
                          "data-tooltip-id": "duration-tooltip",
                        })}
                      >
                        <div className="h-full w-full rounded-2xl bg-[linear-gradient(180deg,#9400FF_0%,rgba(0,0,0,0.5)_70%,rgba(0,0,0,1)_100%)] bg-clip-padding border border-[#FFFFFF40] shadow-[0_24px_70px_-32px_rgba(0,0,0,0.8)] p-6 flex flex-col gap-3">
                          <div className="text-center">
                            <p className="text-sm font-semibold opacity-90">
                              {option.label}
                            </p>
                            <p className="text-3xl font-extrabold mt-1">
                              {formatPrice(option.price)}{" "}
                              <span className="text-base font-semibold">ADA</span>
                            </p>
                            <p className="text-xs text-white/80 mt-1">
                              + 1.7 ADA setup fee
                            </p>
                          </div>
                          <button
                            className={`mt-2 w-full rounded-full py-2 text-black font-semibold bg-white transition-all cursor-pointer ${
                              signupMutation.isPending || !isConnected
                                ? "opacity-60 cursor-not-allowed"
                                : "hover:scale-[1.01]"
                            }`}
                            onClick={() => handlePurchase(option.value)}
                            disabled={signupMutation.isPending || !isConnected}
                            {...(showTooltips && {
                              "data-tooltip-id": "purchase-tooltip",
                            })}
                          >
                            {signupMutation.isPending
                              ? "Processing..."
                              : !isConnected
                                ? "Connect Wallet"
                                : "Buy Now"}
                          </button>
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <div className="w-full sm:w-[320px] h-[180px] bg-white/10 rounded-2xl animate-pulse" />
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white text-base">Region:</p>
                  {Array.isArray(refData?.regions) &&
                  refData.regions.length > 0 ? (
                    <RegionSelect
                      value={resolvedSelectedRegion}
                      onChange={setSelectedRegionOverride}
                      regions={refData.regions}
                      showTooltips={showTooltips}
                    />
                  ) : (
                    <div className="h-7 w-24 bg-gray-300/20 rounded animate-pulse"></div>
                  )}
                </div>
                {selectedOption && (
                  <div
                    className="text-sm text-white/80 px-3 py-2 rounded-full bg-white/10"
                    {...(showTooltips && { "data-tooltip-id": "price-tooltip" })}
                  >
                    {formatPrice(selectedOption.price)} ADA + 1.7 ADA setup fee
                  </div>
                )}
              </div>
            </div>

            {/* Instances */}
            <div className="bg-white/5 rounded-2xl border border-white/10 shadow-[0_24px_70px_-32px_rgba(0,0,0,0.8)] p-5 md:p-6">
              <div className="flex justify-between items-center">
                <p className="font-exo-2 font-black text-sm leading-[100%] tracking-[0] text-center">No VPN Instances Yet</p>
                {isConnected && vpnInstances.length > 0 && (
                  <InstanceFilter
                    value={filterOption}
                    onChange={(option) =>
                      setFilterOption(option || filterOptions[0])
                    }
                  />
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
                      duration={instance.duration}
                      status={instance.status}
                      expires={instance.expires}
                      onAction={() =>
                        handleAction(
                          instance.id,
                          instance.status === "Active"
                            ? "Get Config"
                            : "Renew Access",
                        )
                      }
                      isRenewExpanded={renewingInstanceId === instance.id}
                      renewDurationOptions={durationOptions}
                      selectedRenewDuration={selectedRenewDuration}
                      onSelectRenewDuration={setSelectedRenewDuration}
                      onConfirmRenewal={handleConfirmRenewal}
                      onCancelRenewal={handleCancelRenewal}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </TooltipGuide>
  );
};

export default Account;
