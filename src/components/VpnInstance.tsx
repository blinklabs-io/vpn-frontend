import { useState } from "react";
import type { VpnProtocol, WireGuardDevice } from "../api/types";
import SpinningBorderButton from "./SpinningBorderButton";
import WireGuardDeviceList from "./WireGuardDeviceList";

interface VpnInstanceProps {
  region: string;
  status: "Active" | "Expired" | "Pending";
  expires: string;
  protocol?: VpnProtocol;
  devices?: WireGuardDevice[];
  deviceLimit?: number;
  onDelete?: () => void;
  onGetConfig?: () => void;
  onStartRenew?: () => void;
  onStartBuyTime?: () => void;
  onAddDevice?: () => void;
  onRedownloadConfig?: (device: WireGuardDevice) => void;
  onRegenerateAll?: () => void;
  isRenewExpanded?: boolean;
  renewMode?: "renew" | "buy" | null;
  renewDurationOptions?: Array<{
    label: string;
    value: number;
    price: number;
  }>;
  selectedRenewDuration?: number | null;
  onSelectRenewDuration?: (duration: number) => void;
  onConfirmRenewal?: () => void;
  onCancelRenewal?: () => void;
  shouldSpinRenew?: boolean;
}

/**
 * Protocol icon component - displays WireGuard or OpenVPN indicator
 */
const ProtocolIcon = ({ protocol }: { protocol: VpnProtocol }) => {
  if (protocol === "wireguard") {
    return (
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-500/80 text-[10px] font-bold text-white"
        title="WireGuard"
      >
        WG
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-600/80 text-[10px] font-bold text-white"
      title="OpenVPN"
    >
      OV
    </span>
  );
};

const VpnInstance = ({
  region,
  status,
  expires,
  protocol = "openvpn",
  devices = [],
  deviceLimit = 3,
  onGetConfig,
  onStartRenew,
  onStartBuyTime,
  onAddDevice,
  onRedownloadConfig,
  onRegenerateAll,
  isRenewExpanded,
  renewMode = null,
  renewDurationOptions,
  selectedRenewDuration,
  onSelectRenewDuration,
  onConfirmRenewal,
  onCancelRenewal,
  shouldSpinRenew = false,
}: VpnInstanceProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isWireGuard = protocol === "wireguard";

  const formatPrice = (priceLovelace: number) => {
    return (priceLovelace / 1000000).toFixed(2);
  };

  const toggleExpand = () => {
    if (isWireGuard) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className={`flex p-4 flex-col justify-center items-start gap-3 w-full rounded-md backdrop-blur-sm ${
        status === "Active"
          ? "bg-[linear-gradient(180deg,rgba(148,0,255,0.60)_0%,rgba(104,0,178,0.60)_100%)]"
          : status === "Pending"
            ? "bg-[rgba(128,128,128,0.30)]"
            : "bg-[rgba(255,255,255,0.20)]"
      }`}
    >
      {/* Header section */}
      <div className="flex flex-col items-start gap-1 w-full">
        <div className="flex justify-between items-start w-full gap-2">
          <div className="flex items-center gap-2">
            <ProtocolIcon protocol={protocol} />
            <p className="text-xs md:text-sm">
              Region:{" "}
              <span className="font-semibold">
                {region ? region.slice(0, 2).toUpperCase() + region.slice(2) : ""}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs md:text-sm">
              Time Remaining: <span className="font-semibold">{expires}</span>
            </p>
            {/* Expand/Collapse button for WireGuard instances */}
            {isWireGuard && status === "Active" && (
              <button
                onClick={toggleExpand}
                className="text-xs px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 transition-colors cursor-pointer flex items-center gap-1"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Collapse devices" : "Expand devices"}
              >
                {isExpanded ? "Collapse" : "Expand"}
                <span className="text-[10px]">{isExpanded ? "\u25B2" : "\u25BC"}</span>
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-2">
            <p className="text-xs md:text-sm">Status: <span className="font-semibold">{status}</span></p>
            <span
              className={`w-2 h-2 rounded-full ${
                status === "Active"
                  ? "bg-[#86EA64]"
                  : status === "Pending"
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-red-500"
              }`}
            ></span>
          </div>
        </div>
      </div>

      {/* Expanded WireGuard device list */}
      {isWireGuard && isExpanded && status === "Active" && (
        <>
          <div className="w-full border-t border-white/20 my-1" />
          <WireGuardDeviceList
            devices={devices}
            deviceLimit={deviceLimit}
            onAddDevice={onAddDevice ?? (() => {})}
            onRedownloadConfig={onRedownloadConfig ?? (() => {})}
            onRegenerateAll={onRegenerateAll ?? (() => {})}
          />
          <div className="w-full border-t border-white/20 my-1" />
        </>
      )}

      {/* Expanded renewal / buy-time options */}
      {isRenewExpanded &&
        renewDurationOptions &&
        (status === "Expired" || status === "Active") && (
        <div className="flex flex-col gap-3 w-full pt-1">
          <p className="text-xs md:text-sm font-medium">Select duration:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 w-full">
            {renewDurationOptions.map((option) => (
              <button
                key={option.value}
                className={`flex items-center justify-center gap-2 rounded-md py-2 px-3 cursor-pointer transition-all ${
                  selectedRenewDuration === option.value
                    ? "bg-[#9400FF] text-white"
                    : "bg-white/80 text-black hover:bg-white"
                }`}
                onClick={() => onSelectRenewDuration?.(option.value)}
              >
                <p className="text-xs font-medium whitespace-nowrap">
                  {option.label} - {formatPrice(option.price)} ADA
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end items-center gap-2 w-full">
        {status === "Active" && !isRenewExpanded && (
          <>
            <SpinningBorderButton
              onClick={onStartBuyTime}
              className="flex items-center justify-center gap-3 py-1.5 px-3.5 backdrop-blur-xs shadow-sm bg-white text-black hover:bg-white/90 transition-all"
              radius="8px"
            >
              <p className="text-black font-semibold text-xs md:text-sm">Buy Time</p>
            </SpinningBorderButton>
            <SpinningBorderButton
              onClick={onGetConfig}
              className="flex items-center justify-center gap-3 py-1.5 px-3.5 backdrop-blur-xs shadow-sm bg-white text-black hover:bg-white/90 transition-all"
              radius="8px"
            >
              <p className="text-black font-semibold text-xs md:text-sm">Get Config</p>
            </SpinningBorderButton>
          </>
        )}

        {status === "Expired" && !isRenewExpanded && (
          <SpinningBorderButton
            spin={shouldSpinRenew}
            useBorder={shouldSpinRenew}
            onClick={onStartRenew}
            className="flex items-center justify-center gap-3 py-1.5 px-3.5 backdrop-blur-xs shadow-sm bg-white text-black hover:bg-white/90 transition-all"
            radius="8px"
          >
            <p className="text-black font-semibold text-xs md:text-sm">Renew Access</p>
          </SpinningBorderButton>
        )}

        {isRenewExpanded && (status === "Expired" || status === "Active") && (
          <div className="flex gap-2 w-1/2 ml-auto">
            <button
              className="flex items-center justify-center gap-3 rounded-md py-1.5 px-3.5 backdrop-blur-xs shadow-sm cursor-pointer bg-white/50 text-white hover:bg-white/70 transition-all flex-1"
              onClick={onCancelRenewal}
            >
              <p className="font-light text-xs md:text-sm">Cancel</p>
            </button>
            <button
              className={`flex items-center justify-center gap-3 rounded-md py-1.5 px-3.5 backdrop-blur-xs shadow-sm transition-all flex-1 ${
                selectedRenewDuration
                  ? "cursor-pointer bg-[#9400FF] text-white hover:bg-[#7A00CC]"
                  : "cursor-not-allowed bg-gray-400 text-gray-600 opacity-50"
              }`}
              onClick={onConfirmRenewal}
              disabled={!selectedRenewDuration}
            >
              <p className="font-light text-xs md:text-sm">
                {renewMode === "buy" ? "Buy Time" : "Renew"}
              </p>
            </button>
          </div>
        )}

        {status === "Pending" && (
          <div className="flex items-center justify-center gap-2 rounded-md py-1.5 px-3.5 backdrop-blur-xs bg-gray-400 text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-light text-xs md:text-sm">Setting up...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VpnInstance;
