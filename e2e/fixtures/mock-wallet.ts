// Injects a CIP-30-shaped wallet into the page for tests that drive the
// actual wallet-connect UI, bridging `signTx` back to Node so it can use a
// real test key (src/stores/walletStore.ts talks to `window.cardano[name]`
// directly - see its `connect()` - so this is a straightforward stand-in,
// not a browser-extension shim).
//
// Deliberately minimal: `signData` (CIP-8 message signing, used for
// /api/auth/session) isn't implemented, since nothing this suite currently
// exercises needs a session token. Add it here if a future test needs the
// WireGuard device-management endpoints.
import type { Page } from "@playwright/test";
import { Address } from "@harmoniclabs/cardano-ledger-ts";
import { signWitnessSet, type SigningKey } from "./signing";

export interface MockWalletOptions {
  /** Key under window.cardano - must be one of src/constants/wallets.ts's SUPPORTED_WALLETS. */
  name: string;
  address: string; // bech32 (addr_test1...)
  key: SigningKey;
}

function bech32ToHex(addr: string): string {
  return Buffer.from(Address.fromString(addr).toBytes()).toString("hex");
}

/**
 * Installs a mock CIP-30 wallet into `page` before any script runs, and
 * wires its `signTx` to real Node-side signing via `page.exposeFunction`.
 * Call before `page.goto(...)`.
 */
export async function installMockWallet(
  page: Page,
  { name, address, key }: MockWalletOptions,
): Promise<void> {
  const addressHex = bech32ToHex(address);
  const bridgeName = `__mockWalletSignTx_${name}`;

  await page.exposeFunction(bridgeName, (txCborHex: string) =>
    signWitnessSet(txCborHex, key),
  );

  await page.addInitScript(
    ({ name, addressHex, bridgeName }) => {
      const api = {
        getRewardAddresses: async () => [] as string[],
        getUsedAddresses: async () => [addressHex],
        getUnusedAddresses: async () => [] as string[],
        getChangeAddress: async () => addressHex,
        getBalance: async () => "00",
        getUtxos: async () => [] as unknown[],
        getCollateral: async () => [] as unknown[],
        getNetworkId: async () => 0,
        signData: async () => {
          throw new Error("mock wallet: signData is not implemented");
        },
        signTx: async (txCbor: string) =>
          (
            window as unknown as Record<
              string,
              (cbor: string) => Promise<string>
            >
          )[bridgeName](txCbor),
        submitTx: async () => {
          throw new Error(
            "mock wallet: submitTx is not implemented - the app submits via /api/tx/submit",
          );
        },
      };
      // Not `src/types/cardano.d.ts`'s ambient `Window.cardano` type: that
      // declaration only applies where the file is part of the TS program
      // (the app's own tsconfig), which e2e/'s standalone files aren't.
      const win = window as unknown as {
        cardano?: Record<string, unknown>;
      };
      win.cardano = win.cardano || {};
      win.cardano[name] = {
        name,
        icon: "",
        version: "1.0.0",
        isEnabled: async () => true,
        enable: async () => api as never,
      };
    },
    { name, addressHex, bridgeName },
  );
}
