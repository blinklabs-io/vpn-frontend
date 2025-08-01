import { useWalletStore } from '../stores/walletStore'

interface WalletModalProps {
  isOpen: boolean
  onDisconnect: () => void
}

const WalletModal = ({ isOpen, onDisconnect }: WalletModalProps) => {
  const { balance, enabledWallet, walletAddress } = useWalletStore()

  const adaBalance = balance ? (parseFloat(balance) / 1_000_000).toFixed(2) : "0.00"
  
  if (!isOpen) return null

  return (
    <div className="w-full bg-transparent flex justify-end">
      <div className="min-w-full sm:min-w-[37.8125rem] px-4 py-8">
        <div className="border-1 border-white rounded-md bg-transparent p-6">
          <div className="flex justify-between items-start">
            {/* Left side */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/wallet-icon-white.svg"
                  alt="Wallet"
                  className="w-8 h-8"
                />
                <div className="flex flex-col">
                  <h3 className="text-white font-medium text-lg">Your Wallet</h3>
                  <p className="text-white/70 text-sm max-w-[10rem] truncate">{enabledWallet}: {walletAddress}</p>
                </div>
              </div>
              <button
                onClick={onDisconnect}
                className="bg-white text-black px-6 py-2 rounded-lg font-medium w-fit self-start"
              >
                Disconnect
              </button>
            </div>

            {/* Right side */}
            <div className="text-right">
              <p className="text-white/70 text-sm mb-2 font-normal">Wallet Balance</p>
              <p className="text-white text-2xl font-bold">
                {adaBalance} <span className="text-sm font-normal">ADA</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WalletModal