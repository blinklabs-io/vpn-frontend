import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WalletState {
  // State from the new library
  wallet: unknown | undefined
  isConnected: boolean
  isLoading: boolean
  error: string | undefined
  
  // Helper functions from the new library
  connect: (id: string) => void
  disconnect: () => void
  getBalance: (callback: (balance: number) => void) => void
  getAddress: (callback: (address: string) => void) => void
  getChangeAddress: (callback: (address: string) => void) => void
  signTransaction: (tx: string, callback: (signedTx: string) => void, partialSign?: boolean) => void
  getSupportedWallets: (options?: { omit?: string[] }) => readonly unknown[]
  
  // Additional state for compatibility
  stakeAddress: string | null
  walletAddress: string | null
  balance: string | null
  
  // Legacy state for backward compatibility
  isWalletModalOpen: boolean
  enabledWallet: string | null
  
  // Actions
  setWalletState: (state: Partial<WalletState>) => void
  clearWalletState: () => void
  signAndSubmitTransaction: (txCbor: string) => Promise<string>
  submitTransaction: (signedTxCbor: string) => Promise<string>
  toggleWalletModal: () => void
  closeWalletModal: () => void
  reconnectWallet: () => Promise<void>
  signMessage: (message: string) => Promise<unknown>
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallet: undefined,
      isConnected: false,
      isLoading: false,
      error: undefined,
      stakeAddress: null,
      walletAddress: null,
      balance: null,
      isWalletModalOpen: false,
      enabledWallet: null,
      
      // These will be set by the hook
      connect: () => {},
      disconnect: () => {},
      getBalance: () => {},
      getAddress: () => {},
      getChangeAddress: () => {},
      signTransaction: () => {},
      getSupportedWallets: () => [],
      
      setWalletState: (newState) => set((state) => ({ ...state, ...newState })),
      
      clearWalletState: () => set({
        wallet: undefined,
        isConnected: false,
        isLoading: false,
        error: undefined,
        stakeAddress: null,
        walletAddress: null,
        balance: null,
        isWalletModalOpen: false,
        enabledWallet: null,
        connect: () => {},
        disconnect: () => {},
        getBalance: () => {},
        getAddress: () => {},
        getChangeAddress: () => {},
        signTransaction: () => {},
        getSupportedWallets: () => [],
      }),
      
      signAndSubmitTransaction: async (txCbor: string) => {
        const { wallet, signTransaction, submitTransaction } = get()
        if (!wallet) {
          throw new Error('No wallet connected')
        }
        
        try {
          const signedTx = await new Promise<string>((resolve) => {
            signTransaction(txCbor, (signedTx: string) => {
              resolve(signedTx)
            }, true)
          })
          
          return await submitTransaction(signedTx)
        } catch (error: unknown) {
          if (error instanceof Error && error.message?.includes('script integrity hash')) {
            throw new Error('Script integrity error. Please try: 1) Clear wallet script cache, 2) Reconnect wallet, 3) Try a different wallet (Flint/Yoroi)')
          }
          
          if (error instanceof Error && error.message?.includes('network')) {
            throw new Error('Network mismatch. Please ensure your wallet is on the correct network.')
          }
          
          console.error('Partial signing failed, trying full signing...')
          
          // Fallback to full signing
          const signedTx = await new Promise<string>((resolve) => {
            signTransaction(txCbor, (signedTx: string) => {
              resolve(signedTx)
            }, false)
          })
          
          return await submitTransaction(signedTx)
        }
      },
      
      submitTransaction: async (signedTxCbor: string) => {
        const { wallet } = get()
        if (!wallet) {
          throw new Error('No wallet connected')
        }
        
        try {
          // Use the standard Cardano wallet submitTx method
          const txHash = await (wallet as unknown as { submitTx: (tx: string) => Promise<string> }).submitTx(signedTxCbor)
          return txHash
        } catch (error) {
          console.error('Failed to submit transaction:', error)
          throw error
        }
      },
      
      toggleWalletModal: () => {
        set((state) => ({ isWalletModalOpen: !state.isWalletModalOpen }))
      },
      
      closeWalletModal: () => {
        set({ isWalletModalOpen: false })
      },
      
      reconnectWallet: async () => {
        const { isConnected, enabledWallet, connect } = get()
        if (isConnected && enabledWallet) {
          try {
            connect(enabledWallet)
          } catch (error) {
            console.error('Failed to auto-reconnect wallet:', error)
            get().disconnect()
          }
        }
      },
      
      signMessage: async (message: string) => {
        const { wallet } = get()
        if (!wallet) {
          throw new Error('No wallet connected')
        }
        
        try {
          // Use the wallet's signData method
          const address = await new Promise<string>((resolve) => {
            (wallet as unknown as { getAddress: (callback: (address: string) => void) => void }).getAddress((address: string) => {
              resolve(address)
            })
          })
          
          const signResult = await (wallet as unknown as { signData: (address: string, message: string) => Promise<unknown> }).signData(address, message)
          return signResult
        } catch (error) {
          console.error('Failed to sign message:', error)
          throw error
        }
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        isConnected: state.isConnected,
        stakeAddress: state.stakeAddress,
        walletAddress: state.walletAddress,
        enabledWallet: state.enabledWallet,
      }),
    }
  )
)