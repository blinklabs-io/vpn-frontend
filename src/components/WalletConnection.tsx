import { useWalletStore } from '../stores/walletStore'
import { useNavigate } from 'react-router'

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
  const { isConnected, connect, disconnect } = useWalletStore()
  const navigate = useNavigate()

  const handleConnect = async () => {
    try {
      const walletNames = ['nami', 'eternl', 'flint', 'yoroi', 'gerowallet']
      let connected = false
      
      for (const walletName of walletNames) {
        const success = await connect(walletName)
        if (success) {
          console.log(`Connected to ${walletName}`)
          connected = true
          navigate('/account')
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

  const buttonClasses = variant === 'white'
    ? "flex py-3 px-8 justify-center items-center gap-2.5 rounded-md bg-white text-black font-medium cursor-pointer text-lg md:text-base"
    : "flex py-2.5 px-6 justify-center items-center gap-2.5 self-stretch rounded-md border border-white/20 backdrop-blur-sm text-white font-medium z-40 cursor-pointer"

  if (showTitle || showDescription) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
        <div className="border-2 border-white rounded-3xl p-8 md:p-12 w-full">
          <div className="flex items-start gap-4 mb-6">
            {/* Logomark Icon */}
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
              Any descriptive copy that can explain how this wallet linking system works.
            </p>
          )}

          <button
            onClick={handleConnect}
            className="bg-white text-black font-medium py-3 px-8 rounded-lg text-lg cursor-pointer"
          >
            Connect
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className={buttonClasses}
    >
      Connect Wallet
    </button>
  )
}

export default WalletConnection