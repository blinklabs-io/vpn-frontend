import { useWalletStore } from '../stores/walletStore'

interface WalletModalProps {
  isOpen: boolean
  onDisconnect: () => void
}

const WalletModal = ({ isOpen, onDisconnect }: WalletModalProps) => {
  const { enabledWallet, walletAddress, isConnected, connect } = useWalletStore()
  
  if (!isOpen) return null

  const handleConnect = async () => {
    try {
      const walletNames = ['nami', 'eternl', 'flint', 'yoroi', 'gerowallet']
      let connected = false
      
      for (const walletName of walletNames) {
        const success = await connect(walletName)
        if (success) {
          connected = true
          break
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
    <div className="w-full bg-transparent flex justify-center">
      <div className="min-w-full py-10">
        <div className="border-1 border-white rounded-md bg-transparent p-6">
          {!isConnected ? (
            // Wallet not connected - show connection prompt
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-3">
                <img
                  src="/cardano-icon.svg"
                  alt="cardano-icon"
                  className="w-10 h-10 brightness-0 invert"
                />
                <div className="flex flex-col">
                  <h3 className="text-white font-medium text-lg">Connect Wallet</h3>
                  <p className="text-white/70 text-md py-2">Connect your wallet to purchase VPN access</p>
                </div>
              </div>
              <button
                onClick={handleConnect}
                className="bg-white text-black px-6 py-2 rounded-lg font-medium w-fit cursor-pointer hover:bg-[#f5f5f5] hover:scale-102"
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
                    src="/cardano-icon.svg"
                    alt="Wallet"
                    className="w-10 h-10 brightness-0 invert"
                  />
                  <div className="flex flex-col">
                    <h3 className="text-white font-medium text-lg">Your Wallet</h3>
                    <p className="text-white/70 text-md max-w-[15rem] py-1 truncate">{enabledWallet}: {walletAddress}</p>
                  </div>
                </div>
                <button
                  onClick={onDisconnect}
                  className="bg-white text-black px-6 py-2 rounded-lg font-medium w-fit self-start cursor-pointer hover:bg-[#f5f5f5] hover:scale-102"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WalletModal