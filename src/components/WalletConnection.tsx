import { ConnectWalletList } from "@cardano-foundation/cardano-connect-with-wallet";
import { NetworkType } from "@cardano-foundation/cardano-connect-with-wallet-core";
import { useWalletStore } from "../stores/walletStore";
import { useNavigate } from "react-router";
import { useState, useRef, useEffect } from "react";

interface WalletConnectionProps {
  variant?: "default" | "white";
  showTitle?: boolean;
  showDescription?: boolean;
}

const getNetworkType = (): NetworkType => {
  const network = import.meta.env.VITE_CARDANO_NETWORK || "preprod";
  return network === "mainnet" ? NetworkType.MAINNET : NetworkType.TESTNET;
};

const WalletConnection = ({
  variant = "default",
  showTitle = false,
  showDescription = false,
}: WalletConnectionProps) => {
  const { isConnected, connect, disconnect } = useWalletStore();
  const navigate = useNavigate();
  const [showWalletList, setShowWalletList] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const onConnectWallet = async (walletName: string) => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      const success = await connect(walletName);

      if (success) {
        setShowWalletList(false);
        navigate("/account");
      } else {
        console.error(
          `Failed to connect to ${walletName} - connect function returned false`,
        );
        setConnectionError(
          `Failed to connect to ${walletName}. Please try again.`,
        );
      }
    } catch (error) {
      console.error(`Error connecting to ${walletName}:`, error);
      setConnectionError(
        `Error connecting to ${walletName}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsConnecting(false);
    }
  };

  // Add error handler for ConnectWalletList
  const onConnectError = (walletName: string, error: Error) => {
    console.error(`ConnectWalletList error for ${walletName}:`, error);
    setConnectionError(`Error with ${walletName}: ${error.message}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowWalletList(false);
        setConnectionError(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <button
          onClick={disconnect}
          className="flex py-2.5 px-6 justify-center items-center gap-2.5 self-stretch rounded-md border border-white/20 backdrop-blur-sm text-white font-medium cursor-pointer"
        >
          Disconnect
        </button>
      </div>
    );
  }

  const buttonClasses =
    variant === "white"
      ? "flex py-3 px-8 justify-center items-center gap-2.5 rounded-md bg-white text-black font-medium cursor-pointer text-lg md:text-base"
      : "flex py-2.5 px-10 justify-center items-center gap-2.5 self-stretch rounded-md border border-white/20 backdrop-blur-sm text-white font-medium z-40 cursor-pointer";

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
                <h1 className="text-white text-2xl md:text-3xl font-bold font-exo-2 mb-4">
                  Connect Your Wallet to Begin
                </h1>
              )}
            </div>
          </div>

          {showDescription && (
            <p className="text-white text-base md:text-lg font-light leading-relaxed mb-8">
              Any descriptive copy that can explain how this wallet linking
              system works.
            </p>
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowWalletList(!showWalletList)}
              className="bg-white text-black font-medium py-3 px-8 rounded-lg text-lg cursor-pointer"
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </button>

            {showWalletList && (
              <div className="absolute top-full left-0 mt-2 backdrop-blur-sm p-4 z-50 min-w-[200px]">
                {connectionError && (
                  <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                    {connectionError}
                  </div>
                )}
                <ConnectWalletList
                  borderRadius={15}
                  gap={12}
                  primaryColor="#000000"
                  onConnect={onConnectWallet}
                  onConnectError={onConnectError}
                  supportedWallets={[
                    "eternl",
                    "yoroi",
                    "gerowallet",
                    "begin",
                    "nufi",
                    "lace",
                    "vespr",
                  ]}
                  showUnavailableWallets={0}
                  peerConnectEnabled={false}
                  limitNetwork={getNetworkType()}
                  customCSS={`
                    font-family: Helvetica Light, sans-serif;
                    font-size: 1rem;
                    font-weight: 700;
                    width: 100%;
                    & > span { 
                      padding: 10px 24px; 
                      color: #ffffff;
                      border: 1px solid rgba(255, 255, 255, 0.2);
                      border-radius: 6px;
                      margin-bottom: 12px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      gap: 8px;
                      background: transparent;
                      backdrop-filter: blur(10px);
                      transition: all 0.2s ease;
                      cursor: pointer;
                    }
                    & > span:hover {
                      background: rgba(255, 255, 255, 0.1);
                      border-color: rgba(255, 255, 255, 0.3);
                    }
                  `}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowWalletList(!showWalletList)}
        className={buttonClasses}
        disabled={isConnecting}
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>

      {showWalletList && (
        <div className="absolute top-full left-0 right-0 pt-3 z-50 animate-in slide-in-from-top-2 duration-300">
          <ConnectWalletList
            borderRadius={15}
            gap={12}
            primaryColor="#000000"
            onConnect={onConnectWallet}
            onConnectError={onConnectError}
            supportedWallets={[
              "eternl",
              "yoroi",
              "begin",
              "nufi",
              "lace",
              "vespr",
            ]}
            showUnavailableWallets={0}
            peerConnectEnabled={false}
            limitNetwork={getNetworkType()}
            customCSS={`
              font-family: Helvetica Light, sans-serif;
              font-size: 0.875rem;
              font-weight: 700;
              width: 100%;
              & > span { 
                padding: 10px 12px; 
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.2);
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
                opacity: 0;
                transform: translateY(-10px);
                animation: cascadeIn 0.4s ease-out forwards;
              }
              & > span:nth-child(1) { animation-delay: 0.02s; }
              & > span:nth-child(2) { animation-delay: 0.08s; }
              & > span:nth-child(3) { animation-delay: 0.12s; }
              & > span:nth-child(4) { animation-delay: 0.17s; }
              & > span:nth-child(5) { animation-delay: 0.22s; }
              & > span:nth-child(6) { animation-delay: 0.27s; }
              & > span:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
              }
              @keyframes cascadeIn {
                from {
                  opacity: 0;
                  transform: translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}
          />
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
