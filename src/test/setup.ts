import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import React from 'react'

Object.defineProperty(window, 'cardano', {
  value: {
    nami: {
      enable: vi.fn(),
      isEnabled: vi.fn(),
    },
    eternl: {
      enable: vi.fn(),
      isEnabled: vi.fn(),
    },
    flint: {
      enable: vi.fn(),
      isEnabled: vi.fn(),
    },
    yoroi: {
      enable: vi.fn(),
      isEnabled: vi.fn(),
    },
    gerowallet: {
      enable: vi.fn(),
      isEnabled: vi.fn(),
    },
  },
  writable: true,
})

global.fetch = vi.fn()

global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
}

// Mock the new wallet connector library
vi.mock("@newm.io/cardano-dapp-wallet-connector", () => ({
  useConnectWallet: vi.fn(() => ({
    wallet: undefined,
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: false,
    isLoading: false,
    error: undefined,
    getAddress: vi.fn(),
    getBalance: vi.fn(),
    getChangeAddress: vi.fn(),
    signTransaction: vi.fn(),
    getSupportedWallets: vi.fn(() => []),
  })),
  ConnectWallet: vi.fn(() => React.createElement('div', null, 'Connect Wallet')),
  WalletModal: vi.fn(() => React.createElement('div', null, 'Wallet Modal')),
  WalletButton: vi.fn(() => React.createElement('div', null, 'Wallet Button')),
}))

vi.mock('@emurgo/cardano-serialization-lib-browser', () => ({
  Address: {
    from_bytes: vi.fn().mockReturnValue({
      to_bech32: vi.fn().mockReturnValue('addr_test1mock...')
    })
  }
}))

afterEach(() => {
  vi.resetAllMocks()
}) 