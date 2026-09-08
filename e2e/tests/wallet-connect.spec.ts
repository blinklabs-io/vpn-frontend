import { test, expect } from "@playwright/test";
import { installMockWallet } from "../fixtures/mock-wallet";
import { loadFixtures, walletSkeyPath } from "../fixtures/deployment";
import { loadSigningKey } from "../fixtures/signing";

// UI-level counterpart to signup-flow.spec.ts's API-level test: proves the
// wallet-connect flow (src/components/WalletConnection.tsx, src/stores/
// walletStore.ts) works against a CIP-30 wallet reporting our devnet's
// network ID, using fixtures/mock-wallet.ts instead of a browser extension.
//
// Selector notes: `ConnectWalletList` is a third-party component
// (@cardano-foundation/cardano-connect-with-wallet) whose internal markup
// this suite doesn't control. `getByText` is used rather than a role/testid
// selector so this only depends on the wallet's display name appearing
// somewhere in its rendered list - update if that assumption stops holding.
// It renders twice - once in a persistent nav-bar widget, once in the modal
// this test actually opens - `.last()` picks the modal's copy (appended
// later in the DOM).
test("connect wallet shows the connected state", async ({ page }) => {
  const fixtures = loadFixtures();
  const key = loadSigningKey(walletSkeyPath("user1"));

  await installMockWallet(page, {
    name: "eternl",
    address: fixtures.users.user1.address,
    key,
  });

  await page.goto("/");
  await page.getByRole("button", { name: /connect wallet/i }).click();
  await page.getByText(/eternl/i).last().click();

  await expect(
    page.getByRole("button", { name: /disconnect/i }),
  ).toBeVisible({ timeout: 15_000 });
});
