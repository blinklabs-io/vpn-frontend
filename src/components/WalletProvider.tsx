import { useEffect } from 'react'
import { useConnectWallet } from '@newm.io/cardano-dapp-wallet-connector'
import { useWalletStore } from '../stores/walletStore'

interface WalletProviderProps {
  children: React.ReactNode
}

const WalletProvider = ({ children }: WalletProviderProps) => {
  const {
    wallet,
    connect,
    disconnect,
    isConnected,
    isLoading,
    error,
    getBalance,
    getAddress,
    getChangeAddress,
    signTransaction,
    getSupportedWallets
  } = useConnectWallet()
  
  const { setWalletState } = useWalletStore()
  
  // Sync the new library state with our store
  useEffect(() => {
    setWalletState({
      wallet,
      isConnected,
      isLoading,
      error: error || undefined,
      connect,
      disconnect,
      getBalance,
      getAddress,
      getChangeAddress,
      signTransaction,
      getSupportedWallets
    })
  }, [
    wallet,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    getBalance,
    getAddress,
    getChangeAddress,
    signTransaction,
    getSupportedWallets,
    setWalletState
  ])
  
  // Update address and balance when wallet connects
  useEffect(() => {
    if (wallet && isConnected) {
      // Get the wallet address
      getAddress((address: string) => {
        setWalletState({ walletAddress: address })
      })
      
      // Get the balance
      getBalance((balance: number) => {
        setWalletState({ balance: balance.toString() })
      })
      
      // Get the change address as stake address (fallback)
      getChangeAddress((changeAddress: string) => {
        setWalletState({ stakeAddress: changeAddress })
      })
    }
  }, [wallet, isConnected, getAddress, getBalance, getChangeAddress, setWalletState])
  
  return <>{children}</>
}

export default WalletProvider