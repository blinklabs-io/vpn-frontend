interface CardanoWalletApi {
  enable(): Promise<CardanoWalletApi>
  getRewardAddresses(): Promise<string[]>
  getUsedAddresses(): Promise<string[]>
  getUnusedAddresses(): Promise<string[]>
  getChangeAddress(): Promise<string>
  signData(message: string): Promise<unknown>
  signTx(tx: string): Promise<unknown>
  getBalance(): Promise<string>
  getUtxos(): Promise<unknown[]>
  getCollateral(): Promise<unknown[]>
  getNetworkId(): Promise<number>
  submitTx(tx: string): Promise<string>
}

interface CardanoWallet {
  name: string
  icon: string
  version: string
  enable(): Promise<CardanoWalletApi>
  isEnabled(): Promise<boolean>
}

declare global {
  interface Window {
    cardano?: {
      [key: string]: CardanoWallet
    }
  }
}

export { CardanoWalletApi, CardanoWallet }
