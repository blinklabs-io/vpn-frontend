import { useWalletStore } from '../stores/walletStore'

interface WalletModalProps {
  isOpen: boolean
  onDisconnect: () => void
}

const WalletModal = ({ isOpen, onDisconnect }: WalletModalProps) => {
  const { balance, enabledWallet, walletAddress, isConnected, connect } = useWalletStore()
  
  if (!isOpen) return null

  const handleConnect = async () => {
    try {
      const walletNames = ['nami', 'eternl', 'flint', 'yoroi', 'gerowallet']
      let connected = false
      
      for (const walletName of walletNames) {
        try {
          await connect(walletName)
          connected = true
        } catch (error) {
          console.log(`Failed to connect to ${walletName}:`, error)
        }
      }
      
      if (!connected) {
        console.warn('No compatible wallets found. Please install a supported Cardano wallet.')
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  return (
    <div className="w-full bg-transparent flex justify-end">
      <div className="min-w-full sm:min-w-[37.8125rem] px-4 py-8">
        <div className="border-1 border-white rounded-md bg-transparent p-6">
          {!isConnected ? (
            // Wallet not connected - show connection prompt
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-3">
                <img
                  src="/wallet-icon-white.svg"
                  alt="Wallet"
                  className="w-8 h-8"
                />
                <div className="flex flex-col">
                  <h3 className="text-white font-medium text-lg">Connect Wallet</h3>
                  <p className="text-white/70 text-sm">Connect your wallet to purchase VPN access</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-white text-lg font-bold">0.00 <span className="text-sm font-normal">ADA</span></p>
              </div>
              <button
                onClick={handleConnect}
                className="bg-white text-black px-6 py-2 rounded-lg font-medium w-fit self-center"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            // Wallet connected - show wallet info
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
                  {balance || "0.00"} <span className="text-sm font-normal">ADA</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WalletModal