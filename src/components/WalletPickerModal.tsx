import { ConnectWalletList } from "@cardano-foundation/cardano-connect-with-wallet";
import { NetworkType } from "@cardano-foundation/cardano-connect-with-wallet-core";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useWalletStore } from "../stores/walletStore";
import ConfirmModal from "./ConfirmModal";

const SUPPORTED_WALLETS = [
  "eternl",
  "yoroi",
  "gerowallet",
  "begin",
  "nufi",
  "lace",
  "vespr",
];

const buildWalletListCss = (isDropdownLayout: boolean) => {
  const textColor = "#0f172a";
  const borderColor = "rgba(15, 23, 42, 0.15)";
  const hoverBg = "rgba(15, 23, 42, 0.06)";
  const hoverBorder = "rgba(15, 23, 42, 0.25)";

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

  // Match WalletConnection modal list styling (grid, two columns even on mobile)
  return `
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    width: 100%;
    max-width: none;
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
  `;
};

const getNetworkType = (): NetworkType => {
  const network = import.meta.env.VITE_CARDANO_NETWORK || "preprod";
  return network === "mainnet" ? NetworkType.MAINNET : NetworkType.TESTNET;
};

/**
 * Global wallet-picker modal that matches the WalletConnection "Choose a wallet" flow.
 * Trigger it via walletStore.openWalletModal().
 */
const WalletPickerModal = () => {
  const navigate = useNavigate();
  const { isWalletModalOpen, closeWalletModal, connect } = useWalletStore();

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingWallet, setPendingWallet] = useState<string | null>(null);
  const lastErrorRef = useRef<{ message: string; timestamp: number } | null>(
    null,
  );

  useEffect(() => {
    if (!isWalletModalOpen) {
      setConnectionError(null);
      setIsConnecting(false);
      setPendingWallet(null);
      lastErrorRef.current = null;
    }
  }, [isWalletModalOpen]);

  const showErrorOnce = (message: string) => {
    const now = Date.now();
    const lastError = lastErrorRef.current;

    if (
      !lastError ||
      lastError.message !== message ||
      now - lastError.timestamp > 1000
    ) {
      console.error(message);
      setConnectionError(message);
      lastErrorRef.current = { message, timestamp: now };
    }
  };

  const closeIfAllowed = () => {
    if (isConnecting) return;
    closeWalletModal();
  };

  const handleSuccessfulConnect = () => {
    setConnectionError(null);
    document.body.style.overflow = "";
    closeWalletModal();
    navigate("/account");
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
        if (!window.cardano || !window.cardano[walletName]) {
          showErrorOnce(
            `${walletName} wallet is not installed. Please install it from the official website.`,
          );
        } else {
          setConnectionError(
            `Failed to connect to ${walletName}. Please try again.`,
          );
        }
      }
    } catch (error) {
      console.error(`Error connecting to ${walletName}:`, error);
      setConnectionError(
        `Error connecting to ${walletName}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setIsConnecting(false);
      setPendingWallet(null);
    }
  };

  const onConnectError = (walletName: string, error: Error) => {
    console.error(`ConnectWalletList error for ${walletName}:`, error);

    const errorMessage = error.message.toLowerCase();
    if (
      errorMessage.includes("not installed") ||
      errorMessage.includes("not found") ||
      errorMessage.includes("not available") ||
      errorMessage.includes("no wallet")
    ) {
      showErrorOnce(
        `${walletName} wallet is not installed. Please install it from the official website.`,
      );
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

  const renderConnectionFeedback = () => (
    <>
      {connectionError && (
        <div className="rounded-md border border-red-500/30 bg-red-50 px-4 py-2 text-sm text-red-700">
          {connectionError}
        </div>
      )}
      {isConnecting && pendingWallet && (
        <div className="mb-2 text-sm text-gray-700"></div>
      )}
    </>
  );

  return (
    <ConfirmModal
      isOpen={isWalletModalOpen}
      title="Choose a wallet"
      message={
        <div className="space-y-4">
          <p className="text-slate-800 text-sm md:text-base">
            Select a Cardano wallet to continue.
          </p>
          {renderConnectionFeedback()}
          <div className="pt-1 w-full">
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
              customCSS={buildWalletListCss(false)}
            />
          </div>
        </div>
      }
      showConfirm={false}
      cancelLabel="Close"
      onConfirm={closeIfAllowed}
      onCancel={closeIfAllowed}
    />
  );
};

export default WalletPickerModal;


