import { useWalletStore } from '../stores/walletStore'
import { useState } from 'react'
import LoadingOverlay from './LoadingOverlay'

const FloatingWalletButton = () => {
  const { isConnected, stakeAddress, connect, disconnect } = useWalletStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }

  if (isConnected) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white rounded-lg shadow-lg border p-4 min-w-[200px]">
          <div className="text-xs text-gray-500 mb-2">Connected Wallet</div>
          <div className="text-sm font-medium text-gray-900 mb-3">
            {stakeAddress ? `${stakeAddress.slice(0, 8)}...${stakeAddress.slice(-8)}` : 'Connected'}
          </div>
          <button
            onClick={disconnect}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <LoadingOverlay isVisible={isLoading} message="Connecting Wallet..." />
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-full shadow-lg transition duration-200 hover:shadow-xl disabled:cursor-not-allowed"
      >
        Connect Wallet
      </button>
    </>
  )
}

export default FloatingWalletButton