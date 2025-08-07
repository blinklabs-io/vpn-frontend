import { ConnectWallet } from '@newm.io/cardano-dapp-wallet-connector'
import { useWalletStore } from '../stores/walletStore'

interface WalletConnectionProps {
  variant?: 'default' | 'white'
  showTitle?: boolean
  showDescription?: boolean
}

const WalletConnection = ({
  variant = 'default',
  showTitle = false,
  showDescription = false
}: WalletConnectionProps) => {
  const { isConnected, disconnect, clearWalletState } = useWalletStore()

  const handleDisconnect = () => {
    disconnect()
    clearWalletState()
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <button
          onClick={handleDisconnect}
          className="flex py-2.5 px-6 justify-center items-center gap-2.5 self-stretch rounded-md border border-white/20 backdrop-blur-sm text-white font-medium cursor-pointer"
        >
          Disconnect
        </button>
      </div>
    )
  }

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
            </p>
          )}

          <ConnectWallet 
            mainButtonStyle={{
              backgroundColor: 'white',
              color: 'black',
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '500',
              fontSize: '18px',
              cursor: 'pointer'
            }}
            onConnect={(wallet) => {
              console.log('Wallet connected:', wallet)
            }}
            onDisconnect={() => {
              console.log('Wallet disconnected')
              clearWalletState()
            }}
            onError={(message) => {
              console.error('Wallet error:', message)
            }}
          />
        </div>
      </div>
    )
  }

  const buttonStyle = variant === 'white'
    ? {
        backgroundColor: 'white',
        color: 'black',
        padding: '12px 32px',
        borderRadius: '6px',
        border: 'none',
        fontWeight: '500',
        fontSize: '16px',
        cursor: 'pointer'
      }
    : {
        backgroundColor: 'transparent',
        color: 'white',
        padding: '10px 24px',
        borderRadius: '6px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        fontWeight: '500',
        cursor: 'pointer',
        backdropFilter: 'blur(4px)'
      }

  return (
    <ConnectWallet 
      mainButtonStyle={buttonStyle}
      onConnect={(wallet) => {
        console.log('Wallet connected:', wallet)
      }}
      onDisconnect={() => {
        console.log('Wallet disconnected')
        clearWalletState()
      }}
      onError={(message) => {
        console.error('Wallet error:', message)
      }}
    />
  )
}

export default WalletConnection