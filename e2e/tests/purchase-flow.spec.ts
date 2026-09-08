import { test, expect } from "@playwright/test";
import { installMockWallet } from "../fixtures/mock-wallet";
import { loadFixtures, walletSkeyPath } from "../fixtures/deployment";
import { loadSigningKey } from "../fixtures/signing";

// The full purchase flow, driven entirely through the UI: connect wallet ->
// click "Buy Now" -> confirm in the modal -> the wallet (mocked) signs and
// the app submits -> the new subscription appears. Unlike signup-flow.spec.ts
// (which talks to the API directly to avoid guessing this UI's structure),
// this drives src/pages/Account.tsx and src/components/PurchaseCard.tsx/
// ConfirmModal.tsx for real, using fixtures/mock-wallet.ts for signing -
// the natural extension the comment in wallet-connect.spec.ts pointed at.
//
// Uses user2 (signup-flow.spec.ts uses user1) so the two don't fight over
// the same funded wallet's UTxOs if both ever run in the same pass -
// against the devnet stack, that is; the preprod stack (testnet-
// preprod.sh) only has one funded wallet and points both at it, so this
// only matters there in the sense that the two tests run sequentially,
// never concurrently.
//
// Selector notes: PurchaseCard renders twice in the DOM at once (a mobile
// layout showing only the currently-selected duration, and a desktop
// layout mapping over every duration option, toggled by a CSS breakpoint,
// not conditional rendering). Reference data can offer any number of
// duration options depending on which stack this runs against, so this
// locates the specific card whose label matches this run's own
// fixtures.durationMs (mirroring Account.tsx's formatDuration - see below)
// rather than relying on position.
function expectedDurationLabel(durationMs: number): string {
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) {
    if (days % 365 === 0) {
      const years = days / 365;
      return years === 1 ? "1 year" : `${years} years`;
    }
    return days === 1 ? "1 day" : `${days} days`;
  }
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

test(
  "purchase: connect, buy, confirm in wallet, see the new subscription",
  async ({ page }) => {
    // Same reasoning as signup-flow.spec.ts: the client-list wait below
    // needs a generous, real-network-latency-sized budget (observed
    // directly this session: a submitted tx can take anywhere from
    // seconds to several minutes to actually land in a block on this
    // stack's single relay node), far longer than the global default test
    // timeout (playwright.config.ts, sized for the devnet stack's
    // near-instant confirmations) - without this the test itself gets
    // killed before that wait ever gets the time it asks for.
    test.setTimeout(11 * 60_000);

    const fixtures = loadFixtures();
    const user2 = fixtures.users.user2;
    const key = loadSigningKey(walletSkeyPath("user2"));

    await installMockWallet(page, {
      name: "eternl",
      address: user2.address,
      key,
    });

    await page.goto("/");
    await page.getByRole("button", { name: /connect wallet/i }).click();
    await page.getByText(/eternl/i).last().click();
    await expect(
      page.getByRole("button", { name: /disconnect/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Snapshot client ids that exist *before* this purchase, so the wait
    // below (after submitting) can confirm a genuinely *new* one landed
    // rather than trusting the UI's "VPN Active" heading alone - which the
    // preprod stack's persistent, reused wallet can already satisfy from an
    // earlier run's still-active instance, even if this run's own tx
    // hasn't actually confirmed on-chain yet.
    const preExistingClientIds = new Set(
      (
        (await (
          await page.request.post("/api/client/list", {
            data: { ownerAddress: user2.address },
          })
        ).json()) as Array<{ id: string }>
      ).map((c) => c.id),
    );

    // Account.tsx only renders the purchase cards by default for a wallet
    // with zero existing VPN instances (shouldShowPurchaseCards); otherwise
    // it shows the instance dashboard instead, with a "+ Add New" button
    // that reveals the same cards on demand. The devnet stack always starts
    // this wallet fresh, so this is normally a no-op there - but the
    // preprod stack (testnet-preprod.sh) reuses one persistent wallet
    // across every run, so from the second run on it already has
    // instances from earlier runs and needs this click first.
    const addNewButton = page.getByRole("button", { name: "+ Add New" });
    if (await addNewButton.isVisible().catch(() => false)) {
      await addNewButton.click();
    }

    // .last(): desktop always shows every option (mobile only shows
    // whichever one is currently selected, which may or may not be this
    // one), so this label is guaranteed to appear there even if it also
    // happens to be mobile's current selection.
    const durationLabel = page
      .getByText(expectedDurationLabel(fixtures.durationMs), { exact: true })
      .last();
    const card = durationLabel.locator(
      "xpath=ancestor::div[.//button[normalize-space(text())='Buy Now']][1]",
    );
    await card.getByRole("button", { name: "Buy Now" }).click();

    await expect(page.getByText("Confirm VPN Purchase")).toBeVisible();
    await page.getByRole("button", { name: "Continue to Wallet" }).click();

    // The mock wallet's signTx is called here (see fixtures/mock-wallet.ts),
    // then the app posts the signed tx to /api/tx/submit. Wait for a
    // genuinely new client id to appear (see preExistingClientIds above),
    // not just the "VPN Active" heading - that can already be true from an
    // earlier run's still-active instance on the preprod stack's reused
    // wallet, regardless of whether *this* tx has confirmed yet.
    await expect(async () => {
      const clients = (await (
        await page.request.post("/api/client/list", {
          data: { ownerAddress: user2.address },
        })
      ).json()) as Array<{ id: string }>;
      expect(clients.some((c) => !preExistingClientIds.has(c.id))).toBeTruthy();
    }).toPass({ timeout: 10 * 60_000, intervals: [2_000, 5_000, 10_000, 30_000] });

    // The toPass() above only confirms vpn-indexer's own database has the
    // new client - the *page*'s own client list (react-query, staleTime
    // 30s, no auto-refetch interval) doesn't necessarily reflect that yet.
    // What actually drives this heading is useClientPolling.ts's own poll
    // loop, started by handleConfirmSubmit right after submit - it waits a
    // fixed 20s before its *first* check, then every 40s after that, by
    // design (real on-chain confirmation is never faster than that in
    // practice) - so this needs real margin past the default 5s, even
    // once the backend already has the client. "active" appears three
    // times at once (an h1, a status blurb, and a status badge span) -
    // match the heading specifically to avoid a strict-mode violation.
    await expect(
      page.getByRole("heading", { name: /vpn active/i }),
    ).toBeVisible({ timeout: 90_000 });
    // VpnInstance renders the region with its first two characters
    // uppercased (region.slice(0,2).toUpperCase() + region.slice(2)), not
    // verbatim - match case-insensitively instead of assuming that exact
    // transform. .first(): the preprod stack reuses one persistent wallet
    // across every run, so by now it can have several instances all in
    // this same region - this only needs to confirm the text appears, not
    // that it's unique.
    await expect(
      page.getByText(new RegExp(fixtures.region, "i")).first(),
    ).toBeVisible();
  },
);
