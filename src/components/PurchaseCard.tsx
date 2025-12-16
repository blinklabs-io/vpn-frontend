import { useWalletStore } from "../stores/walletStore";

type PurchaseOption = {
  value: number;
  label: string;
  timeDisplay: string;
  price: number;
};

type PurchaseCardProps = {
  option: PurchaseOption;
  isConnected: boolean;
  isProcessing: boolean;
  showTooltips?: boolean;
  formatPrice: (price: number) => string;
  onPurchase: (duration: number) => void;
};

const PurchaseCard = ({
  option,
  isConnected,
  isProcessing,
  showTooltips,
  formatPrice,
  onPurchase,
}: PurchaseCardProps) => {
  const { openWalletModal } = useWalletStore();
  const disabled = isProcessing;

  return (
    <div
      key={option.value}
      className="w-full sm:w-[320px] rounded-2xl p-[1px] bg-[linear-gradient(180deg,#9400FF_0%,rgba(0,0,0,0.5)_100%)] overflow-hidden"
      {...(showTooltips && { "data-tooltip-id": "duration-tooltip" })}
    >
      <div className="h-full w-full rounded-2xl bg-[linear-gradient(180deg,#9400FF_0%,rgba(0,0,0,0.5)_100%)] bg-clip-padding border border-[#FFFFFF40] shadow-[0_24px_70px_-32px_rgba(0,0,0,0.8)] p-6 flex flex-col gap-3">
        <div className="text-center flex flex-col items-center gap-1">
          <p className="font-exo-2 text-2xl font-semibold">{option.label}</p>
          <p className="text-3xl font-ibm-plex font-semibold mt-1">
            {formatPrice(option.price)}{" "}
            <span className="text-base font-semibold">ADA</span>
          </p>
          <p className="text-xs font-ibm-plex font-normal text-white/80 mt-1">
            + 1.7 ADA setup fee
          </p>
        </div>
        <button
          className={`mt-2 w-full rounded-full py-2 text-black font-semibold bg-white transition-all cursor-pointer ${
            disabled ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.01]"
          }`}
          onClick={() => {
            if (isProcessing) return;
            if (!isConnected) {
              openWalletModal();
              return;
            }
            onPurchase(option.value);
          }}
          disabled={disabled}
          {...(showTooltips && { "data-tooltip-id": "purchase-tooltip" })}
        >
          {isProcessing ? "Processing..." : "Buy Now"}
        </button>
      </div>
    </div>
  );
};

export default PurchaseCard;
