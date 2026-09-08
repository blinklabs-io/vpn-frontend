import { test } from "@playwright/test";
import { loadFixtures, walletSkeyPath } from "../fixtures/deployment";
import { loadSigningKey } from "../fixtures/signing";
import { runSignupFlow } from "../fixtures/signupFlow";

// The deep integration test: builds a real signup transaction through the
// app's own API surface, signs it with a genesis-funded test wallet, submits
// it, and waits for vpn-indexer's chain-sync to observe it back. This is
// the one test that actually exercises vpn-contracts' validators (the
// mint's checks all have to pass for the submitted tx to land on-chain at
// all) and vpn-indexer's txbuilder/chain-sync together, not just its API
// layer.
//
// Goes through `request` (nginx's /api proxy), not a browser wallet mock:
// nothing here needs the component tree, and driving the real purchase-flow
// UI would mean guessing its DOM structure sight unseen. See
// wallet-connect.spec.ts for the UI-level counterpart, and
// fixtures/mock-wallet.ts if a future test extends that to a full UI-driven
// purchase flow (see purchase-flow.spec.ts - it now does). See
// signup-flow-dual-protocol.spec.ts for the same flow run concurrently
// against a second, OpenVPN-mode vpn-indexer instance.
//
// The actual build-sign-submit-observe sequence lives in
// fixtures/signupFlow.ts, shared with that dual-protocol spec.
test(
  "signup: build, sign, submit, and observe a new client",
  async ({ request }) => {
    // See fixtures/signupFlow.ts's own comments for why this needs to be
    // this generous - in short, real preprod confirmation latency, plus a
    // few retries against a transient same-wallet UTxO race, can together
    // take a while, longer than playwright.config.ts's global default
    // (sized for the devnet stack's near-instant confirmations).
    test.setTimeout(11 * 60_000);

    const fixtures = loadFixtures();
    const user1 = fixtures.users.user1;
    const key = loadSigningKey(walletSkeyPath("user1"));

    await runSignupFlow({
      request,
      paymentAddress: user1.address,
      signingKey: key,
      region: fixtures.region,
      priceLovelace: fixtures.priceLovelace,
      durationMs: fixtures.durationMs,
    });
  },
);
