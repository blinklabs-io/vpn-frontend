import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CardanoWalletApi } from '../types/cardano'
import { Address, Value, Tx, TxWitnessSet, VKeyWitness } from '@harmoniclabs/cardano-ledger-ts'




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
  connect: (walletName: string) => Promise<void>
  disconnect: () => void
  signMessage: (message: string) => Promise<unknown>
  signTransaction: (txCbor: string) => Promise<string> // Returns witness set
  submitTransaction: (witnessSet: string) => Promise<string>
  toggleWalletModal: () => void
  closeWalletModal: () => void
  getBalance: () => Promise<void>
  getWalletAddress: () => Promise<void>
}

const decodeHexAddress = (hexAddress: string): string | null => {
  try {
    const cleanHex = hexAddress.startsWith('0x') ? hexAddress.slice(2) : hexAddress
    
    const bytes = new Uint8Array(cleanHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    
    const address = Address.fromBytes(bytes).toString()
    console.log('Address:', address)
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
          // Try change address first (this is usually the signing address)
          const changeAddress = await walletApi.getChangeAddress()
          console.log('Change address (raw):', changeAddress)
          
          const decodedChangeAddress = decodeHexAddress(changeAddress)
          if (decodedChangeAddress) {
            console.log('Using change address as wallet address:', decodedChangeAddress)
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
          return await walletApi.signData(message)
        } catch (error) {
          console.error('Failed to sign message:', error)
          throw error
        }
      },

      signTransaction: async (txCbor: string) => {
        const { walletApi } = get()
        if (!walletApi) {
          throw new Error('No wallet connected')
        }

        try {
          console.log('Signing transaction...')
          
          const witnessSet = await walletApi.signTx(txCbor)
          
          return witnessSet as string
        } catch (error) {
          console.error('Failed to sign transaction:', error)
          throw error
        }
      },

      submitTransaction: async (witnessSet: string) => {
        const { walletApi } = get()
        if (!walletApi) {
          throw new Error('No wallet connected')
        }

        try {
          console.log('Submitting witness set...')
          
          // Try submitting the witness set directly
          const txHash = await walletApi.submitTx(witnessSet)
          console.log('Transaction submitted! Hash:', txHash)
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

      getBalance: async () => {
        const { walletApi } = get()
        if (!walletApi) {
          throw new Error('No wallet connected')
        }

        try {
          const balanceHex = await walletApi.getBalance()
          console.log('Raw balance from wallet:', balanceHex)
          
          // Decode the CBOR structure to get the Value object
          const value = Value.fromCbor(balanceHex)
          
          // Extract just the ADA amount as bigint, then convert properly
          const lovelaceBigInt = value.lovelaces
          const adaBalance = (Number(lovelaceBigInt) / 1_000_000).toFixed(2)
          
          set({ balance: adaBalance })
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