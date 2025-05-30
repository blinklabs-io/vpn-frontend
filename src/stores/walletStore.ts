import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CardanoWalletApi } from '../types/cardano'

interface WalletState {
  isConnected: boolean
  isEnabled: boolean
  enabledWallet: string | null
  stakeAddress: string | null
  walletApi: CardanoWalletApi | null

  // Actions
  setWalletState: (state: Partial<WalletState>) => void
  connect: (walletName: string) => Promise<void>
  disconnect: () => void
  signMessage: (message: string) => Promise<unknown>
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      isEnabled: false,
      enabledWallet: null,
      stakeAddress: null,
      walletApi: null,

      setWalletState: (newState) => set((state) => ({ ...state, ...newState })),

      connect: async (walletName: string) => {
        try {
          if (!window.cardano || !window.cardano[walletName]) {
            throw new Error(`${walletName} wallet not found`)
          }

          const walletApi = await window.cardano[walletName].enable()
          const stakeAddresses = await walletApi.getRewardAddresses()
          const stakeAddress = stakeAddresses?.[0] || null

          set({
            isConnected: true,
            isEnabled: true,
            enabledWallet: walletName,
            stakeAddress,
            walletApi,
          })
        } catch (error) {
          console.error(`Failed to connect to ${walletName}:`, error)
          throw error
        }
      },

      disconnect: () => {
        set({
          isConnected: false,
          isEnabled: false,
          enabledWallet: null,
          stakeAddress: null,
          walletApi: null,
        })
      },

      signMessage: async (message: string) => {
        const { walletApi } = get()
        if (!walletApi) {
          throw new Error('No wallet connected')
        }

        try {
          return await walletApi.signData(message)
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
        enabledWallet: state.enabledWallet,
        stakeAddress: state.stakeAddress,
      }),
    }
  )
)