import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CardanoWalletApi } from '../types/cardano'
import * as CSL from '@emurgo/cardano-serialization-lib-browser'

interface WalletState {
  isConnected: boolean
  isEnabled: boolean
  enabledWallet: string | null
  stakeAddress: string | null
  walletAddress: string | null
  walletApi: CardanoWalletApi | null
  isWalletModalOpen: boolean
  balance: string | null

  // Actions
  setWalletState: (state: Partial<WalletState>) => void
  connect: (walletName: string) => Promise<void>
  disconnect: () => void
  signMessage: (message: string) => Promise<unknown>
  toggleWalletModal: () => void
  closeWalletModal: () => void
  getBalance: () => Promise<void>
  getWalletAddress: () => Promise<void>
}

const decodeHexAddress = (hexAddress: string): string | null => {
  try {
    const cleanHex = hexAddress.startsWith('0x') ? hexAddress.slice(2) : hexAddress
    
    const bytes = new Uint8Array(cleanHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    
    const address = CSL.Address.from_bytes(bytes).to_bech32()
    return address
  } catch (error) {
    console.error('Failed to decode address:', error)
    return null
  }
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      isEnabled: false,
      enabledWallet: null,
      stakeAddress: null,
      walletAddress: null,
      walletApi: null,
      isWalletModalOpen: false,
      balance: null,

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

          const { getBalance, getWalletAddress } = get()
          await Promise.all([getBalance(), getWalletAddress()])

        } catch (error) {
          console.error(`Failed to connect to ${walletName}:`, error)
          throw error
        }
      },

      getWalletAddress: async () => {
        const { walletApi } = get()
        if (!walletApi) {
          throw new Error('No wallet connected')
        }

        try {
          const usedAddresses = await walletApi.getUsedAddresses()
          
          if (usedAddresses && usedAddresses.length > 0) {
            const decodedAddress = decodeHexAddress(usedAddresses[0])
            if (decodedAddress) {
              set({ walletAddress: decodedAddress })
              return
            }
          }

          const unusedAddresses = await walletApi.getUnusedAddresses()
          if (unusedAddresses && unusedAddresses.length > 0) {
            const decodedAddress = decodeHexAddress(unusedAddresses[0])
            if (decodedAddress) {
              set({ walletAddress: decodedAddress })
              return
            }
          }

        } catch (error) {
          console.error('Failed to get wallet address:', error)
        }
      },

      disconnect: () => {
        set({
          isConnected: false,
          isEnabled: false,
          enabledWallet: null,
          stakeAddress: null,
          walletAddress: null,
          walletApi: null,
          isWalletModalOpen: false,
          balance: null,
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

      toggleWalletModal: () => {
        set((state) => ({ isWalletModalOpen: !state.isWalletModalOpen }))
      },

      closeWalletModal: () => {
        set({ isWalletModalOpen: false })
      },

      getBalance: async () => {
        const { walletApi } = get()
        if (!walletApi) {
          throw new Error('No wallet connected')
        }

        try {
          const balanceHex = await walletApi.getBalance()
          console.log('Raw balance from wallet:', balanceHex)
          
          let balanceLovelace: string
          if (balanceHex.startsWith('0x')) {
            balanceLovelace = parseInt(balanceHex, 16).toString()
          } else {
            try {
              balanceLovelace = parseInt(balanceHex, 16).toString()
            } catch {
              balanceLovelace = balanceHex
            }
          }
          
          set({ balance: balanceLovelace })
        } catch (error) {
          console.error('Failed to get balance:', error)
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
        walletAddress: state.walletAddress,
      }),
    }
  )
)