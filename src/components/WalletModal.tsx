import { useState } from "react";
import WalletConnection from "./WalletConnection";
import ConfirmModal from "./ConfirmModal";
import { useWalletStore } from "../stores/walletStore";
import { truncateAddress } from "../utils/formatAddress";

interface WalletModalProps {
  isOpen: boolean;
  onDisconnect: () => void;
}

const WalletModal = ({ isOpen, onDisconnect }: WalletModalProps) => {
  const { enabledWallet, walletAddress, isConnected, closeWalletModal } =
    useWalletStore();
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const handleConfirmDisconnect = () => {
    setShowDisconnectConfirm(false);
    onDisconnect();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="w-full bg-transparent flex justify-center">
        <div className="min-w-full py-6 md:py-10">
          <div className="border border-white/10 rounded-md bg-white/3 backdrop-blur-md p-4 md:p-6 relative min-h-[160px]">
            {!isConnected ? (
              <div className="flex flex-col items-start gap-4">
                <WalletConnection
                  listLayout="flex"
                  onConnected={closeWalletModal}
                />
              </div>
            ) : (
              // Wallet connected - show wallet info
              <div className="flex justify-between items-start">
                {/* Left side */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="/cardano-icon.svg"
                      alt="Wallet"
                      className="w-10 h-10 brightness-0 invert"
                    />
                    <div className="flex flex-col">
                      <h3 className="text-white font-medium text-lg">
                        Your Wallet
                      </h3>
                      <p className="text-white/70 text-md max-w-[15rem] py-1 truncate">
                        {enabledWallet}: {truncateAddress(walletAddress)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDisconnectConfirm(true)}
                    className="border border-white/20 bg-white/10 backdrop-blur-md text-white px-6 py-2 rounded-lg font-medium w-fit self-start cursor-pointer hover:bg-white/20 hover:border-white/30 transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={showDisconnectConfirm}
        title="Disconnect wallet?"
        message="This will disconnect your wallet from Nabu."
        confirmLabel="Confirm"
        cancelLabel="Close"
        onCancel={() => setShowDisconnectConfirm(false)}
        onConfirm={handleConfirmDisconnect}
      />
    </>
  );
};

export default WalletModal;
