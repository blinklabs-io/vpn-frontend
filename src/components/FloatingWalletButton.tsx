import { useWalletStore } from "../stores/walletStore";
import { useState, useEffect } from "react";
import LoadingOverlay from "./LoadingOverlay";
import { truncateAddress } from "../utils/formatAddress";

const FloatingWalletButton = () => {
  const { isConnected, stakeAddress, connect, disconnect } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    let connected = false;
    let lastError: unknown = null;

    const walletNames = ["nami", "eternl", "flint", "yoroi", "gerowallet"];

    // Detect installed wallets first to avoid misleading errors
    const installedWallets = walletNames.filter(
      (name) => window.cardano && window.cardano[name]
    );

    if (installedWallets.length === 0) {
      setError("No compatible wallet found. Please install a Cardano wallet.");
      setIsLoading(false);
      return;
    }

    // Only try to connect to installed wallets
    for (const walletName of installedWallets) {
      try {
        await connect(walletName);
        connected = true;
        break;
      } catch (err) {
        console.log(`Failed to connect to ${walletName}:`, err);
        lastError = err;
        // Stop immediately on user cancellation or network mismatch
        const errorMessage = err instanceof Error ? err.message.toLowerCase() : "";
        const errorCode = (err as { code?: number })?.code;
        if (
          errorCode === -3 ||
          errorMessage.includes("user canceled") ||
          errorMessage.includes("network mismatch") ||
          errorMessage.includes("wrong network")
        ) {
          break;
        }
      }
    }

    if (!connected) {
      // Surface a specific error message based on the last error
      const errorMessage = lastError instanceof Error ? lastError.message.toLowerCase() : "";
      const errorCode = (lastError as { code?: number })?.code;

      if (
        errorMessage.includes("network mismatch") ||
        errorMessage.includes("wrong network") ||
        errorMessage.includes("mainnet") ||
        errorMessage.includes("testnet")
      ) {
        const network = import.meta.env.VITE_CARDANO_NETWORK || "preprod";
        const expectedNetwork = network === "mainnet" ? "Mainnet" : "Testnet";
        setError(`Network mismatch: Please switch your wallet to ${expectedNetwork} and try again.`);
      } else if (errorCode === -3 || errorMessage.includes("user canceled")) {
        setError("Connection canceled. Please grant wallet access to continue.");
      } else if (lastError instanceof Error && lastError.message) {
        // Use the actual error message if available
        setError(lastError.message);
      } else {
        setError("Failed to connect wallet. Please try again.");
      }
    }

    setIsLoading(false);
  };

  if (isConnected) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white rounded-lg shadow-lg border p-4 min-w-[200px]">
          <div className="text-xs text-gray-500 mb-2">Connected Wallet</div>
          <div className="text-sm font-medium text-gray-900 mb-3">
            {stakeAddress ? truncateAddress(stakeAddress) : "Connected"}
          </div>
          <button
            onClick={disconnect}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay isVisible={isLoading} messageTop="Connecting Wallet..." />
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {error && (
          <div className="bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg shadow-lg max-w-xs">
            {error}
          </div>
        )}
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-full shadow-lg transition duration-200 hover:shadow-xl disabled:cursor-not-allowed"
        >
          Connect Wallet
        </button>
      </div>
    </>
  );
};

export default FloatingWalletButton;
