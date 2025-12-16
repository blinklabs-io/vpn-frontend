import SpinningBorderButton from "./SpinningBorderButton";

interface VpnInstanceProps {
  region: string;
  status: "Active" | "Expired" | "Pending";
  expires: string;
  onDelete?: () => void;
  onAction?: () => void;
  isRenewExpanded?: boolean;
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

const VpnInstance = ({
  region,
  status,
  expires,
  onAction,
  isRenewExpanded,
  renewDurationOptions,
  selectedRenewDuration,
  onSelectRenewDuration,
  onConfirmRenewal,
  onCancelRenewal,
  shouldSpinRenew = false,
}: VpnInstanceProps) => {
  const formatPrice = (priceLovelace: number) => {
    return (priceLovelace / 1000000).toFixed(2);
  };

  return (
    <div
      className={`flex p-4 flex-col justify-center items-start gap-3 w-full rounded-md backdrop-blur-xs ${
        status === "Active"
          ? "bg-[linear-gradient(180deg,rgba(148,0,255,0.60)_0%,rgba(104,0,178,0.60)_100%)]"
          : status === "Pending"
            ? "bg-[rgba(128,128,128,0.30)]"
            : "bg-[rgba(255,255,255,0.20)]"
      }`}
    >
      <div className="flex flex-col items-start gap-1 w-full">
        <div className="flex justify-between items-start w-full gap-2">
          <p className="text-xs md:text-sm">
            Region:{" "}
            <span className="font-semibold">
              {region ? region.slice(0, 2).toUpperCase() + region.slice(2) : ""}
            </span>
          </p>
          <p className="text-xs md:text-sm">
            Time Remaining: <span className="font-semibold">{expires}</span>
          </p>
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

      {/* Expanded renewal options */}
      {isRenewExpanded && renewDurationOptions && status === "Expired" && (
        <div className="flex flex-col gap-3 w-full pt-1">
          <p className="text-xs md:text-sm font-medium">Select renewal duration:</p>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 w-full">
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
        {status !== "Pending" && !isRenewExpanded && (
          <SpinningBorderButton
            spin={shouldSpinRenew && status === "Expired"}
            useBorder={shouldSpinRenew && status === "Expired"}
            onClick={onAction}
            className="flex items-center justify-center gap-3 py-1.5 px-3.5 backdrop-blur-xs box-shadow-sm bg-white text-black hover:bg-white/90 transition-all"
            radius="8px"
          >
            <p className="text-black font-semibold text-xs md:text-sm">
              {status === "Active" ? "Get Config" : "Renew Access"}
            </p>
          </SpinningBorderButton>
        )}

        {isRenewExpanded && status === "Expired" && (
          <div className="flex gap-2 w-1/2 ml-auto">
            <button
              className="flex items-center justify-center gap-3 rounded-md py-1.5 px-3.5 backdrop-blur-xs box-shadow-sm cursor-pointer bg-white/50 text-white hover:bg-white/70 transition-all flex-1"
              onClick={onCancelRenewal}
            >
              <p className="font-light text-xs md:text-sm">Cancel</p>
            </button>
            <button
              className={`flex items-center justify-center gap-3 rounded-md py-1.5 px-3.5 backdrop-blur-xs box-shadow-sm transition-all flex-1 ${
                selectedRenewDuration
                  ? "cursor-pointer bg-[#9400FF] text-white hover:bg-[#7A00CC]"
                  : "cursor-not-allowed bg-gray-400 text-gray-600 opacity-50"
              }`}
              onClick={onConfirmRenewal}
              disabled={!selectedRenewDuration}
            >
              <p className="font-light text-xs md:text-sm">Renew</p>
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
