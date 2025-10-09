import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CardanoWalletApi } from '../types/cardano'
import { Address, Value, Tx } from '@harmoniclabs/cardano-ledger-ts'
import { showError } from '../utils/toast'
import { submitTransaction as submitTransactionApi } from '../api/client'




interface WalletState {
  isConnected: boolean
  isEnabled: boolean
  enabledWallet: string | null
  stakeAddress: string | null
  walletAddress: string | null
  walletApi: CardanoWalletApi | null
  isWalletModalOpen: boolean
  balance: string | null
  pendingTx: string | null // Store original transaction for signing

  // Actions
  setWalletState: (state: Partial<WalletState>) => void
  connect: (walletName: string) => Promise<boolean>
  disconnect: () => void
  signMessage: (message: string) => Promise<unknown>
  signTransaction: (txCbor: string) => Promise<string> // Returns signed transaction CBOR
  submitTransaction: (signedTxCbor: string) => Promise<string>
  toggleWalletModal: () => void
  closeWalletModal: () => void
  getBalance: () => Promise<void>
  getWalletAddress: () => Promise<void>
  reconnectWallet: () => Promise<void>
  signAndSubmitTransaction: (txCbor: string) => Promise<string> // New combined method
}

const decodeHexAddress = (hexAddress: string): string | null => {
  try {
    const cleanHex = hexAddress.startsWith('0x') ? hexAddress.slice(2) : hexAddress
    
    const bytes = new Uint8Array(cleanHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    
    const address = Address.fromBytes(bytes).toString()
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
      pendingTx: null,

      setWalletState: (newState) => set((state) => ({ ...state, ...newState })),

      connect: async (walletName: string) => {
        try {
          if (!window.cardano || !window.cardano[walletName]) {
            return false // Return false instead of throwing
          }

          const walletApi = await window.cardano[walletName].enable()
          
          await new Promise(resolve => setTimeout(resolve, 100))
          
          let stakeAddresses: string[] = []
          let retries = 3
          
          while (retries > 0) {
            try {
              stakeAddresses = await walletApi.getRewardAddresses()
              break
            } catch (error: unknown) {
              retries--
              
              if (error instanceof Error && (error.message.includes('account changed') || error.message.includes('Account changed'))) {
                console.warn(`Account changed error for ${walletName}, retrying... (${retries} attempts left)`)
                
                if (retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, 500))
                  continue
                } else {
                  const newWalletApi = await window.cardano[walletName].enable()
                  await new Promise(resolve => setTimeout(resolve, 200))
                  stakeAddresses = await newWalletApi.getRewardAddresses()
                  break
                }
              } else {
                throw error
              }
            }
          }
          
          const stakeAddress = stakeAddresses?.[0] || null

          set({
            isConnected: true,
            isEnabled: true,
            enabledWallet: walletName,
            stakeAddress,
            walletApi,
          })

          try {
            const { getBalance, getWalletAddress } = get()
            await Promise.all([getBalance(), getWalletAddress()])
          } catch (error) {
            console.warn('Failed to get balance or address, but wallet is connected:', error)
          }
          
          return true
        } catch (error) {
          console.error(`Failed to connect to ${walletName}:`, error)
          return false
        }
      },

      getWalletAddress: async () => {
        const { walletApi } = get()
        if (!walletApi) {
          throw new Error('No wallet connected')
        }

        try {
          // Try change address first (this is usually the signing address)
          const changeAddress = await walletApi.getChangeAddress()
          
          const decodedChangeAddress = decodeHexAddress(changeAddress)
          if (decodedChangeAddress) {
            set({ walletAddress: decodedChangeAddress })
            return
          }

          const usedAddresses = await walletApi.getUsedAddresses()
          if (usedAddresses && usedAddresses.length > 0) {
            const decodedAddress = decodeHexAddress(usedAddresses[0])
            if (decodedAddress) {
              set({ walletAddress: decodedAddress })
              return
            }
          }

          // Last resort - unused addresses
          const unusedAddresses = await walletApi.getUnusedAddresses()
          if (unusedAddresses && unusedAddresses.length > 0) {
            const decodedAddress = decodeHexAddress(unusedAddresses[0])
            if (decodedAddress) {
              set({ walletAddress: decodedAddress })
            }
          }

        } catch (error) {
          console.error('Failed to get wallet address:', error)
          showError('Failed to get wallet address')
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
          pendingTx: null,
        })
      },

      signMessage: async (message: string) => {
        const { walletApi } = get()
        if (!walletApi) {
          throw new Error('No wallet connected')
        }

        try {
          const address = await walletApi.getChangeAddress()
          const payload = Array.from(new TextEncoder().encode(message))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('')
          
          return await walletApi.signData(address, payload)
        } catch (error) {
          console.error('Failed to sign message:', error)
          showError('Failed to sign message')
          throw error
        }
      },

      signTransaction: async (txCbor: string) => {
        const { walletApi } = get()
        if (!walletApi) {
          throw new Error('No wallet connected')
        }

        try {
          // Decode the unsigned transaction
          const unsignedTx = Tx.fromCbor(txCbor)
          
          await unsignedTx.signWithCip30Wallet(walletApi)

          return unsignedTx.toCbor().toString()
        } catch (error) {
          console.error('Failed to sign transaction:', error)
          throw error
        }
      },

      submitTransaction: async (signedTxCbor: string) => {
        try {
          const txHash = await submitTransactionApi(signedTxCbor)
          return txHash
        } catch (error) {
          console.error('Failed to submit transaction via API:', error)
          throw error
        }
      },

      // New combined method for convenience
      signAndSubmitTransaction: async (txCbor: string) => {
        const { signTransaction, submitTransaction } = get()
        
        try {
          const signedTxCbor = await signTransaction(txCbor)
          
          const txHash = await submitTransaction(signedTxCbor)
          
          return txHash
        } catch (error) {
          console.error('Failed to sign and submit transaction:', error)
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
          const value = Value.fromCbor(balanceHex)
          
          const lovelaceBigInt = value.lovelaces
          const adaBalance = (Number(lovelaceBigInt) / 1_000_000).toFixed(2)
          
          set({ balance: adaBalance })
        } catch (error) {
          console.error('Failed to get balance:', error)
          throw error
        }
      },

      reconnectWallet: async () => {
        const { isConnected, enabledWallet } = get()
        if (isConnected && enabledWallet) {
          try {
            await get().connect(enabledWallet)
          } catch (error) {
            console.error('Failed to auto-reconnect wallet:', error)
            get().disconnect()
          }
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
