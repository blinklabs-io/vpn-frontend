import { ConnectWalletList } from "@cardano-foundation/cardano-connect-with-wallet";
import { NetworkType } from "@cardano-foundation/cardano-connect-with-wallet-core";
import { useWalletStore } from "../stores/walletStore";
import { useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import ConfirmModal from "./ConfirmModal";

interface WalletConnectionProps {
  variant?: "default" | "white";
  showTitle?: boolean;
  showDescription?: boolean;
  listLayout?: "dropdown" | "flex";
  initiallyOpen?: boolean;
  onConnected?: () => void;
  theme?: "dark" | "light";
}

const SUPPORTED_WALLETS = [
  "eternl",
  "yoroi",
  "gerowallet",
  "begin",
  "nufi",
  "lace",
  "vespr",
];

const buildWalletListCss = (
  isDropdownLayout: boolean,
  isLightTheme: boolean,
  fullWidth = false,
) => {
  const textColor = isLightTheme ? "#0f172a" : "#ffffff";
  const borderColor = isLightTheme ? "rgba(15, 23, 42, 0.15)" : "rgba(255, 255, 255, 0.2)";
  const hoverBg = isLightTheme ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.1)";
  const hoverBorder = isLightTheme ? "rgba(15, 23, 42, 0.25)" : "rgba(255, 255, 255, 0.3)";

  if (isDropdownLayout) {
    return `
      font-family: Helvetica Light, sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      width: 100%;
      & > span {
        padding: 10px 12px;
        color: ${textColor};
        border: 1px solid ${borderColor};
        border-radius: 6px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: start;
        gap: 8px;
        background: transparent;
        backdrop-filter: blur(10px);
        transition: all 0.2s ease;
        cursor: pointer;
        opacity: 1;
        transform: translateY(0);
      }
      & > span:hover {
        background: ${hoverBg};
        border-color: ${hoverBorder};
        transform: translateY(-2px);
      }
    `;
  }

  return `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
    width: 100%;
    max-width: ${fullWidth ? "none" : "540px"};
    font-family: Helvetica Light, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    justify-items: stretch;
    align-content: start;
    & > span {
      width: 100%;
      padding: 8px 12px;
      color: ${textColor};
      border: 1px solid ${borderColor};
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: start;
      gap: 10px;
      background: transparent;
      backdrop-filter: blur(10px);
      transition: all 0.2s ease;
      cursor: pointer;
      margin: 0;
      opacity: 1;
      transform: translateY(0);
    }
    & > span:hover {
      background: ${hoverBg};
      border-color: ${hoverBorder};
    }
    @media (max-width: 1024px) {
      max-width: 480px;
    }
    @media (max-width: 640px) {
      max-width: none;
    }
  `;
};

const getNetworkType = (): NetworkType => {
  const network = import.meta.env.VITE_CARDANO_NETWORK || "preprod";
  return network === "mainnet" ? NetworkType.MAINNET : NetworkType.TESTNET;
};

const WalletConnection = ({
  variant = "default",
  showTitle = false,
  showDescription = false,
  listLayout = "dropdown",
  initiallyOpen = false,
  onConnected,
  theme = "dark",
}: WalletConnectionProps) => {
  const {
    isConnected,
    connect,
    disconnect,
  } = useWalletStore();
  const navigate = useNavigate();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingWallet, setPendingWallet] = useState<string | null>(null);
  const [localModalOpen, setLocalModalOpen] = useState(initiallyOpen);
  const lastErrorRef = useRef<{ message: string; timestamp: number } | null>(null);
  const isDropdownLayout = listLayout === "dropdown";
  const flexContainerBaseClasses =
    "relative mx-auto flex w-full max-w-[600px] flex-col min-h-[150px]";
  const buttonClasses =
    variant === "white"
      ? "flex py-3 px-8 min-w-[150px] justify-center items-center gap-2.5 rounded-md bg-white text-black font-semibold cursor-pointer text-sm hover:bg-gray-100 transition-all"
      : "flex py-1.5 px-5 min-w-[150px] justify-center items-center gap-2.5 rounded-full border-2 border-white bg-white/80 text-black font-semibold text-sm z-40 cursor-pointer hover:bg-white/90 transition-all";
  const isLightTheme = theme === "light";
  const headingTextClass = isLightTheme ? "text-gray-900" : "text-white";
  const subTextClass = isLightTheme ? "text-gray-600" : "text-white/70";
  const statusTextClass = isLightTheme
    ? "mb-2 text-sm text-gray-700"
    : "mb-2 text-sm text-white/80";

  // Helper function to surface connection errors with deduplication
  const showErrorOnce = (message: string) => {
    const now = Date.now();
    const lastError = lastErrorRef.current;
    
    // Only show if it's a different message or more than 1 second has passed
    if (!lastError || lastError.message !== message || now - lastError.timestamp > 1000) {
      console.error(message);
      setConnectionError(message);
      lastErrorRef.current = { message, timestamp: now };
    }
  };

  useEffect(() => {
    setLocalModalOpen(initiallyOpen);
  }, [initiallyOpen]);

  const openWalletList = () => {
    setConnectionError(null);
    setPendingWallet(null);
    setLocalModalOpen(true);
  };

  const closeWalletList = () => {
    if (isConnecting) {
      return;
    }

    setLocalModalOpen(false);
    setConnectionError(null);
    setPendingWallet(null);
  };

  const handleSuccessfulConnect = () => {
    setConnectionError(null);
    setLocalModalOpen(false);

    if (onConnected) {
      onConnected();
    } else {
      navigate("/account");
    }
  };

  const onConnectWallet = async (walletName: string) => {
    setIsConnecting(true);
    setConnectionError(null);
    setPendingWallet(walletName);

    try {
      const success = await connect(walletName);

      if (success) {
        handleSuccessfulConnect();
      } else {
        console.error(
          `Failed to connect to ${walletName} - connect function returned false`,
        );
        // Check if wallet is not installed
        if (!window.cardano || !window.cardano[walletName]) {
          showErrorOnce(`${walletName} wallet is not installed. Please install it from the official website.`);
        } else {
          setConnectionError(
            `Failed to connect to ${walletName}. Please try again.`,
          );
        }
      }
    } catch (error) {
      console.error(`Error connecting to ${walletName}:`, error);
      setConnectionError(
        `Error connecting to ${walletName}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsConnecting(false);
      setPendingWallet(null);
    }
  };

  const onConnectError = (walletName: string, error: Error) => {
    console.error(`ConnectWalletList error for ${walletName}:`, error);
    
    // Check if the error is about wallet not being installed
    const errorMessage = error.message.toLowerCase();
    if (
      errorMessage.includes("not installed") ||
      errorMessage.includes("not found") ||
      errorMessage.includes("not available") ||
      errorMessage.includes("no wallet")
    ) {
      showErrorOnce(`${walletName} wallet is not installed. Please install it from the official website.`);
    } else if (
      errorMessage.includes("too many requests") ||
      errorMessage.includes("429") ||
      errorMessage.includes("rate limit")
    ) {
      const message = `${walletName} is temporarily rate limiting requests. Please wait 30-60 seconds, close other dApp tabs, and retry. Restarting the wallet extension can also help.`;
      showErrorOnce(message);
      setConnectionError(message);
    } else if (
      errorMessage.includes("wrong network") ||
      errorMessage.includes("network type") ||
      errorMessage.includes("mainnet") ||
      errorMessage.includes("testnet")
    ) {
      const network = import.meta.env.VITE_CARDANO_NETWORK || "preprod";
      const expectedNetwork = network === "mainnet" ? "Mainnet" : "Testnet";
      const message = `Network mismatch: This app requires ${expectedNetwork}. Please switch your wallet to ${expectedNetwork} and try again.`;
      showErrorOnce(message);
      setConnectionError(message);
    } else {
      showErrorOnce(`Error connecting to ${walletName}: ${error.message}`);
      setConnectionError(`Error with ${walletName}: ${error.message}`);
    }
    
    setIsConnecting(false);
    setPendingWallet(null);
  };

  const renderConnectionFeedback = (
    errorClasses = isLightTheme
      ? "mb-3 rounded-md border border-red-500/30 bg-red-50 px-4 py-2 text-sm text-red-700"
      : "mb-3 rounded-md border border-red-400 bg-red-500/10 px-4 py-2 text-sm text-red-200",
    statusClasses = statusTextClass,
  ) => (
    <>
      {connectionError && (
        <div className={errorClasses}>{connectionError}</div>
      )}
      {isConnecting && pendingWallet && (
        <div className={statusClasses}></div>
      )}
    </>
  );

  const renderWalletList = (isLight = isLightTheme, fullWidth = false) => (
    <ConnectWalletList
      borderRadius={15}
      gap={12}
      primaryColor="#000000"
      onConnect={onConnectWallet}
      onConnectError={onConnectError}
      supportedWallets={SUPPORTED_WALLETS}
      showUnavailableWallets={0}
      peerConnectEnabled={false}
      limitNetwork={getNetworkType()}
      customCSS={buildWalletListCss(isDropdownLayout, isLight, fullWidth)}
    />
  );

  const renderWalletModal = () => (
    <ConfirmModal
      isOpen={localModalOpen}
      title="Choose a wallet"
      message={
        <div className="space-y-4">
          <p className="text-slate-800 text-sm md:text-base">
            Select a Cardano wallet to continue.
          </p>
          {renderConnectionFeedback(
            "rounded-md border border-red-500/30 bg-red-50 px-4 py-2 text-sm text-red-700",
            "mb-2 text-sm text-gray-700",
          )}
          <div className="pt-1 w-full">{renderWalletList(true, true)}</div>
        </div>
      }
      showConfirm={false}
      cancelLabel="Close"
      onConfirm={closeWalletList}
      onCancel={closeWalletList}
    />
  );

  const connectButton = (
    <button
      onClick={openWalletList}
      className={`${buttonClasses} ${isConnecting ? "animate-pulse" : ""}`}
      disabled={isConnecting}
    >
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );

  if (isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <button
          onClick={disconnect}
          className={buttonClasses}
        >
          Disconnect
        </button>
        {renderWalletModal()}
      </div>
    );
  }

  if (showTitle || showDescription) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
        <div className="border-2 border-white rounded-3xl p-8 md:p-12 w-full">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0">
              <img
                src="/wallet-icon-white.svg"
                alt="Wallet"
                className="w-12 h-12 md:w-15 md:h-15"
              />
            </div>

            <div className="flex-1">
              {showTitle && (
                <h1 className={`${headingTextClass} text-2xl md:text-3xl font-bold font-exo-2 mb-4`}>
                  Connect Your Wallet to Begin
                </h1>
              )}
            </div>
          </div>

          {showDescription && (
            <p className={`${headingTextClass} text-base md:text-lg font-light leading-relaxed mb-8`}>
              Any descriptive copy that can explain how this wallet linking
              system works.
            </p>
          )}

          <div className="relative flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/cardano-icon.svg"
                alt="Cardano"
                className="h-10 w-10 brightness-0 invert"
              />
              <div className="flex flex-col">
                <h3 className={`${headingTextClass} text-lg font-medium`}>
                  Connect Wallet
                </h3>
                <p className={`${subTextClass} text-sm md:text-base`}>
                  Connect your wallet to purchase VPN access
                </p>
              </div>
            </div>
            <button
              onClick={openWalletList}
              className={`bg-white text-black font-medium py-3 px-8 rounded-lg text-lg cursor-pointer hover:bg-gray-100 transition-all ${isConnecting ? "animate-pulse" : ""}`}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </button>
          </div>
        </div>
        {renderWalletModal()}
      </div>
    );
  }

  if (isDropdownLayout) {
    return (
      <>
        <div className="relative">
          {connectButton}
        </div>
        {renderWalletModal()}
      </>
    );
  }

  return (
    <>
      <div
        className={`${flexContainerBaseClasses} items-start justify-between`}
      >
        <div className="flex items-center gap-3">
          <img
            src="/cardano-icon.svg"
            alt="Cardano"
            className="h-10 w-10 brightness-0 invert"
          />
          <div className="flex flex-col">
            <h3 className={`${headingTextClass} text-lg font-medium`}>Connect Wallet</h3>
            <p className={`${subTextClass} text-sm md:text-base`}>
              Connect your wallet to purchase VPN access
            </p>
          </div>
        </div>
        {connectButton}
      </div>
      {renderWalletModal()}
    </>
  );
};

export default WalletConnection;
