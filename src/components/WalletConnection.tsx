import { useWalletStore } from '../stores/walletStore'

const WalletConnection = () => {
  const { isConnected, connect, disconnect } = useWalletStore()

  const handleConnect = async () => {
    try {
      const walletNames = ['nami', 'eternl', 'flint', 'yoroi', 'gerowallet']
      for (const walletName of walletNames) {
        try {
          await connect(walletName)
          console.log(`Connected to ${walletName}`)
          break
        } catch (error) {
          console.log(`Failed to connect to ${walletName}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

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
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="flex py-2.5 px-6 justify-center items-center gap-2.5 self-stretch rounded-md border border-white/20 backdrop-blur-sm text-white font-medium z-40 cursor-pointer"
    >
      Connect Wallet
    </button>
  )
}

export default WalletConnection