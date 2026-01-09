import { useCallback, useEffect, useState } from "react";
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const frame = requestAnimationFrame(() => setIsVisible(true));
    const previousOverflow = document.body.style.overflow || "";
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(frame);
      setIsVisible(false);
      setShowDisconnectConfirm(false);
      document.body.style.overflow = previousOverflow || "";
    };
  }, [isOpen]);

  const closeDisconnectConfirm = useCallback(() => {
    setShowDisconnectConfirm(false);
  }, []);

  const handleConfirmDisconnect = useCallback(() => {
    setShowDisconnectConfirm(false);
    onDisconnect();
  }, [onDisconnect]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm px-0 md:px-4"
        role="dialog"
        aria-modal="true"
        aria-label="Wallet modal"
      >
        <div
          className="absolute inset-0"
          onClick={closeWalletModal}
          aria-hidden="true"
        />
        <div
          className={`${
            isVisible ? "translate-y-0" : "translate-y-full"
          } md:translate-y-0 absolute bottom-0 left-0 right-0 md:relative md:bottom-auto w-full md:max-w-2xl bg-white text-slate-900 rounded-t-3xl md:rounded-2xl shadow-2xl transition-transform duration-300 ease-out transform max-h-[85vh] min-h-[60vh] md:min-h-0 overflow-y-auto pb-[env(safe-area-inset-bottom)] flex flex-col`}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 h-1.5 w-16 rounded-full bg-gray-300 md:hidden" />
          <button
            type="button"
            onClick={closeWalletModal}
            className="hidden md:flex absolute top-4 right-4 text-sm text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
            aria-label="Close wallet modal"
          >
            Close
          </button>

          <div className="p-6 md:p-8 pt-12 md:pt-12 flex flex-col flex-1 gap-6">
            {!isConnected ? (
              <div className="flex flex-col items-start gap-4 h-full">
                <WalletConnection
                  listLayout="flex"
                  onConnected={closeWalletModal}
                  theme="light"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-5 h-full">
                <div className="flex items-center gap-3">
                  <img
                    src="/cardano-icon.svg"
                    alt="Wallet"
                    className="w-10 h-10"
                  />
                  <div className="flex flex-col">
                    <h3 className="text-slate-900 font-semibold text-lg">
                      Your Wallet
                    </h3>
                    <p className="text-slate-600 text-md max-w-[15rem] py-1 truncate">
                      {enabledWallet}: {truncateAddress(walletAddress)}
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex">
                  <button
                    onClick={() => setShowDisconnectConfirm(true)}
                    className="border border-gray-200 bg-white text-slate-900 px-6 py-2 rounded-lg font-medium w-full md:w-auto cursor-pointer hover:bg-gray-50 transition-all shadow-sm"
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
        onCancel={closeDisconnectConfirm}
        onConfirm={handleConfirmDisconnect}
      />
    </>
  );
};

export default WalletModal;
