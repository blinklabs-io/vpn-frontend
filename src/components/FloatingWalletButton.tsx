import { ConnectWallet } from '@newm.io/cardano-dapp-wallet-connector'
import { useWalletStore } from '../stores/walletStore'

const FloatingWalletButton = () => {
  const { isConnected, stakeAddress, disconnect } = useWalletStore()

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
    <div className="fixed bottom-6 right-6 z-50">
      <ConnectWallet 
        mainButtonStyle={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '9999px',
          border: 'none',
          fontWeight: '500',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s',
          cursor: 'pointer'
        }}
        onConnect={(wallet: unknown) => {
          console.log('Wallet connected:', wallet)
        }}
        onDisconnect={() => {
          console.log('Wallet disconnected')
        }}
        onError={(message: string) => {
          console.error('Wallet error:', message)
        }}
      />
    </div>
  )
}

export default FloatingWalletButton