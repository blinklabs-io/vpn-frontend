import { useWalletStore } from '../stores/walletStore'

const WalletConnection = () => {
  const { isConnected, stakeAddress, connect, disconnect } = useWalletStore()

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
        <span className="text-sm text-gray-600">
          {stakeAddress ? `${stakeAddress.slice(0, 8)}...${stakeAddress.slice(-8)}` : 'Connected'}
        </span>
        <button
          onClick={disconnect}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
    >
      Connect Wallet
    </button>
  )
}

export default WalletConnection