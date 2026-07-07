import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CardanoWalletApi } from "../types/cardano";
import { Address, Value, Tx } from "@harmoniclabs/cardano-ledger-ts";
import { submitTransaction as submitTransactionApi, post } from "../api/client";
import type { SessionTokenResponse } from "../api/types";

const APP_NETWORK = (
  import.meta.env.VITE_CARDANO_NETWORK ?? "preprod"
)
  .toString()
  .toLowerCase();
const NETWORK_NAME_MAP: Record<string, string> = {
  mainnet: "Cardano Mainnet",
  preprod: "Cardano Preprod Testnet",
  preview: "Cardano Preview Testnet",
  testnet: "Cardano Testnet",
};
const APP_NETWORK_LABEL =
  NETWORK_NAME_MAP[APP_NETWORK] ??
  `Cardano ${APP_NETWORK.charAt(0).toUpperCase()}${APP_NETWORK.slice(1)} Network`;
const EXPECTED_NETWORK_ID = APP_NETWORK === "mainnet" ? 1 : 0;
const formatWalletNetworkLabel = (networkId: number) =>
  networkId === 1 ? "Cardano Mainnet" : "a Cardano Testnet";

interface WalletState {
  isConnected: boolean;
  isEnabled: boolean;
  enabledWallet: string | null;
  stakeAddress: string | null;
  walletAddress: string | null;
  walletApi: CardanoWalletApi | null;
  isWalletModalOpen: boolean;
  balance: string | null;
  pendingTx: string | null; // Store original transaction for signing
  lastVpnConfigUrl: string | null; // Store the most recent VPN config download URL

  // Actions
  setWalletState: (state: Partial<WalletState>) => void;
  openWalletModal: () => void;
  connect: (walletName: string) => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<{ key: string; signature: string }>;
  /**
   * Returns a valid wallet-wide session token, signing a challenge with the
   * wallet only when no unexpired cached token exists. One token covers every
   * subscription owned by the connected wallet.
   */
  getSessionToken: () => Promise<string>;
  /**
   * Drops the cached session token for the wallet after a 401 — but only if the
   * cached token still matches `failedToken`, so a concurrent refresh that
   * already minted a new token is not clobbered.
   */
  clearSessionToken: (failedToken: string) => Promise<void>;
  signTransaction: (txCbor: string) => Promise<string>; // Returns signed transaction CBOR
  submitTransaction: (signedTxCbor: string) => Promise<string>;
  toggleWalletModal: () => void;
  closeWalletModal: () => void;
  getBalance: () => Promise<void>;
  getWalletAddress: () => Promise<void>;
  reconnectWallet: () => Promise<void>;
  signAndSubmitTransaction: (txCbor: string) => Promise<string>; // New combined method
  setVpnConfigUrl: (url: string) => void; // Store VPN config URL
}

const decodeHexAddress = (hexAddress: string): string | null => {
  try {
    const cleanHex = hexAddress.startsWith("0x")
      ? hexAddress.slice(2)
      : hexAddress;

    const bytes = new Uint8Array(
      cleanHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
    );

    const address = Address.fromBytes(bytes).toString();
    return address;
  } catch (error) {
    console.error("Failed to decode address:", error);
    return null;
  }
};

// In-memory session token cache, keyed by wallet address. Kept out of the
// persisted store (and localStorage) to limit token theft via XSS; tokens are
// short-lived and cheap to re-mint with a single signature. One token per
// wallet covers all of that wallet's subscriptions.
const sessionTokenCache = new Map<
  string,
  { token: string; expiresAt: number }
>();

// In-flight token mints, keyed by cacheKey. Concurrent callers with an empty or
// expired cache share the first caller's signature + exchange instead of each
// prompting the wallet and minting a duplicate token.
const pendingSessionTokens = new Map<string, Promise<string>>();

// Re-mint a token slightly before it actually expires to avoid races with
// in-flight requests near the boundary.
const SESSION_TOKEN_REFRESH_SKEW_SECONDS = 60;

// Domain-separated session challenge prefix; must match the backend's
// sessionChallengePrefix so the signature is accepted at /auth/session.
const SESSION_CHALLENGE_PREFIX = "vpn-session:";

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
      lastVpnConfigUrl: null,

      setWalletState: (newState) => set((state) => ({ ...state, ...newState })),

      openWalletModal: () => {
        set({ isWalletModalOpen: true });
      },

      setVpnConfigUrl: (url: string) => set({ lastVpnConfigUrl: url }),

      connect: async (walletName: string) => {
        if (!window.cardano || !window.cardano[walletName]) {
          throw new Error(`${walletName} wallet is not installed`);
        }

        const walletApi = await window.cardano[walletName].enable();
        const walletNetworkId = await walletApi.getNetworkId();

        if (walletNetworkId !== EXPECTED_NETWORK_ID) {
          const walletNetworkLabel = formatWalletNetworkLabel(walletNetworkId);
          const errorMessage = `Network mismatch: This app requires ${APP_NETWORK_LABEL}, but your wallet is connected to ${walletNetworkLabel}. Please switch your wallet to ${APP_NETWORK_LABEL} and try again.`;
          set({
            isConnected: false,
            isEnabled: false,
            enabledWallet: null,
            stakeAddress: null,
            walletAddress: null,
            walletApi: null,
            balance: null,
            pendingTx: null,
          });
          throw new Error(errorMessage);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));

        let stakeAddresses: string[] = [];
        let retries = 3;
        let activeWalletApi = walletApi;

        while (retries > 0) {
          try {
            stakeAddresses = await activeWalletApi.getRewardAddresses();
            break;
          } catch (error: unknown) {
            retries--;

            if (
              error instanceof Error &&
              (error.message.includes("account changed") ||
                error.message.includes("Account changed"))
            ) {
              console.warn(
                `Account changed error for ${walletName}, retrying... (${retries} attempts left)`,
              );

              if (retries > 0) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                continue;
              } else {
                activeWalletApi =
                  await window.cardano[walletName].enable();
                await new Promise((resolve) => setTimeout(resolve, 200));
                stakeAddresses = await activeWalletApi.getRewardAddresses();
                break;
              }
            } else {
              throw error;
            }
          }
        }

        const stakeAddress = stakeAddresses?.[0] || null;

        set({
          isConnected: true,
          isEnabled: true,
          enabledWallet: walletName,
          stakeAddress,
          walletApi: activeWalletApi,
        });

        try {
          const { getBalance, getWalletAddress } = get();
          await Promise.all([getBalance(), getWalletAddress()]);
        } catch (error) {
          console.warn(
            "Failed to get balance or address, but wallet is connected:",
            error,
          );
        }
      },

      getWalletAddress: async () => {
        const { walletApi } = get();
        if (!walletApi) {
          throw new Error("No wallet connected");
        }

        try {
          // Try change address first (this is usually the signing address)
          const changeAddress = await walletApi.getChangeAddress();

          const decodedChangeAddress = decodeHexAddress(changeAddress);
          if (decodedChangeAddress) {
            set({ walletAddress: decodedChangeAddress });
            return;
          }

          const usedAddresses = await walletApi.getUsedAddresses();
          if (usedAddresses && usedAddresses.length > 0) {
            const decodedAddress = decodeHexAddress(usedAddresses[0]);
            if (decodedAddress) {
              set({ walletAddress: decodedAddress });
              return;
            }
          }

          // Last resort - unused addresses
          const unusedAddresses = await walletApi.getUnusedAddresses();
          if (unusedAddresses && unusedAddresses.length > 0) {
            const decodedAddress = decodeHexAddress(unusedAddresses[0]);
            if (decodedAddress) {
              set({ walletAddress: decodedAddress });
            }
          }
        } catch (error) {
          console.error("Failed to get wallet address:", error);
        }
      },

      disconnect: () => {
        sessionTokenCache.clear();
        pendingSessionTokens.clear();
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
          lastVpnConfigUrl: null,
        });
      },

      signMessage: async (message: string) => {
        const { walletApi } = get();
        if (!walletApi) {
          throw new Error("No wallet connected");
        }

        try {
          const address = await walletApi.getChangeAddress();
          const payload = Array.from(new TextEncoder().encode(message))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");

          return await walletApi.signData(address, payload);
        } catch (error) {
          console.error("Failed to sign message:", error);
          throw error;
        }
      },

      getSessionToken: async () => {
        const { walletApi, signMessage } = get();
        // Key the cache by the live signing address from the currently enabled
        // wallet, rather than the (possibly stale or not-yet-loaded) persisted
        // walletAddress. Fail closed if no wallet is connected so a token is
        // never cached/reused under an empty key or a key belonging to a
        // different wallet.
        if (!walletApi) {
          throw new Error("No wallet connected");
        }
        const cacheKey = await walletApi.getChangeAddress();
        const now = Math.floor(Date.now() / 1000);
        const cached = sessionTokenCache.get(cacheKey);
        if (
          cached &&
          cached.expiresAt - SESSION_TOKEN_REFRESH_SKEW_SECONDS > now
        ) {
          return cached.token;
        }

        // Coalesce concurrent mints for the same wallet: the first caller signs
        // and exchanges, later callers await the same promise so the wallet is
        // only prompted once.
        const inFlight = pendingSessionTokens.get(cacheKey);
        if (inFlight) {
          return inFlight;
        }

        const mint = (async () => {
          // Sign a fresh challenge once for the whole wallet and exchange it
          // for a token covering all of its subscriptions.
          const challenge = `${SESSION_CHALLENGE_PREFIX}${now}`;
          const { signature, key } = await signMessage(challenge);

          const resp = await post<SessionTokenResponse>("/auth/session", {
            signature,
            key,
          });

          // Only cache if the same wallet is still connected. If a disconnect
          // (or wallet switch) happened while minting, caching here would
          // resurrect a token after disconnect cleared the cache. The check and
          // set are synchronous, so disconnect cannot interleave between them.
          if (get().walletApi === walletApi) {
            sessionTokenCache.set(cacheKey, {
              token: resp.token,
              expiresAt: resp.expires_at,
            });
          }
          return resp.token;
        })();

        pendingSessionTokens.set(cacheKey, mint);
        try {
          return await mint;
        } finally {
          pendingSessionTokens.delete(cacheKey);
        }
      },

      clearSessionToken: async (failedToken: string) => {
        const { walletApi } = get();
        if (!walletApi) {
          return;
        }
        // Use the same live key derivation as getSessionToken so the right
        // entry is targeted.
        const cacheKey = await walletApi.getChangeAddress();
        // Only evict if the cached token is still the one that failed, so a
        // concurrent 401 cannot delete a token another call already refreshed.
        if (sessionTokenCache.get(cacheKey)?.token === failedToken) {
          sessionTokenCache.delete(cacheKey);
        }
      },

      signTransaction: async (txCbor: string) => {
        const { walletApi } = get();
        if (!walletApi) {
          throw new Error("No wallet connected");
        }

        try {
          // Decode the unsigned transaction
          const unsignedTx = Tx.fromCbor(txCbor);

          await unsignedTx.signWithCip30Wallet(walletApi);

          return unsignedTx.toCbor().toString();
        } catch (error) {
          console.error("Failed to sign transaction:", error);
          throw error;
        }
      },

      submitTransaction: async (signedTxCbor: string) => {
        try {
          const txHash = await submitTransactionApi(signedTxCbor);
          return txHash;
        } catch (error) {
          console.error("Failed to submit transaction via API:", error);
          throw error;
        }
      },

      // New combined method for convenience
      signAndSubmitTransaction: async (txCbor: string) => {
        const { signTransaction, submitTransaction } = get();

        try {
          const signedTxCbor = await signTransaction(txCbor);

          const txHash = await submitTransaction(signedTxCbor);

          return txHash;
        } catch (error) {
          console.error("Failed to sign and submit transaction:", error);
          throw error;
        }
      },

      toggleWalletModal: () => {
        set((state) => ({ isWalletModalOpen: !state.isWalletModalOpen }));
      },

      closeWalletModal: () => {
        set({ isWalletModalOpen: false });
      },

      getBalance: async () => {
        const { walletApi } = get();
        if (!walletApi) {
          throw new Error("No wallet connected");
        }

        try {
          const balanceHex = await walletApi.getBalance();
          const value = Value.fromCbor(balanceHex);

          const lovelaceBigInt = value.lovelaces;
          const adaBalance = (Number(lovelaceBigInt) / 1_000_000).toFixed(2);

          set({ balance: adaBalance });
        } catch (error) {
          console.error("Failed to get balance:", error);
          throw error;
        }
      },

      reconnectWallet: async () => {
        const { isConnected, enabledWallet } = get();
        if (isConnected && enabledWallet) {
          try {
            await get().connect(enabledWallet);
          } catch (error) {
            console.error("Failed to auto-reconnect wallet:", error);
            get().disconnect();
          }
        }
      },
    }),
    {
      name: "wallet-storage",
      partialize: (state) => ({
        isConnected: state.isConnected,
        enabledWallet: state.enabledWallet,
        stakeAddress: state.stakeAddress,
        walletAddress: state.walletAddress,
      }),
    },
  ),
);
