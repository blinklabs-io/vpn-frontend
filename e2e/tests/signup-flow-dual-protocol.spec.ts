import { test, expect, request as apiRequest } from "@playwright/test";
import { loadFixtures, walletSkeyPath } from "../fixtures/deployment";
import { loadSigningKey } from "../fixtures/signing";
import { runSignupFlow } from "../fixtures/signupFlow";

// Exercises signup against an OpenVPN-mode region and a WireGuard-mode
// region in the same automated run - see testnet.sh's/testnet-preprod.sh's
// own apply_vpn_indexer_openvpn for how the OpenVPN-mode vpn-indexer
// instance gets stood up (a second Deployment in the same k8s cluster:
// vpn-indexer's OpenVPN code path unconditionally needs a real in-cluster
// Kubernetes API for its CRL ConfigMap updater).
//
// The wireguard leg goes through nginx's /api proxy exactly like
// signup-flow.spec.ts (same wallet, region, and shared runSignupFlow()
// logic). The openvpn leg talks directly to the OpenVPN indexer pod's own
// API (nginx only ever proxies to one backend, so there's no single
// frontend URL that reaches both).
//
// Devnet mints a dedicated third wallet (user3, docker/testnet/deployer/
// deploy.sh) purely so this can run both legs *concurrently* (Promise.all)
// without the two racing for the same UTxO. Preprod has exactly one funded
// wallet by design (faucet-limited - see docs/testnet-preprod.md) with no
// equivalent second wallet, so there both legs reuse the wireguard leg's
// own wallet and run sequentially instead: this session's own experience
// building this harness is that concurrent same-wallet signups against
// preprod's real, sometimes-slow chain are exactly the kind of race that
// produces "All inputs are spent" failures far more often than not - not
// worth reintroducing here just to run two legs in parallel that were
// never going to share a wallet safely in the first place.
test("signup: wireguard and openvpn regions", async ({ request }) => {
  const fixtures = loadFixtures();
  test.skip(
    !fixtures.openvpn?.indexerUrl,
    "no OpenVPN vpn-indexer configured for this stack (apply_vpn_indexer_openvpn hasn't finished yet, or this isn't running against testnet.sh's/testnet-preprod.sh's own stack)",
  );

  const wgUser = fixtures.users.user1;
  const wgKey = loadSigningKey(walletSkeyPath("user1"));

  const hasDedicatedOpenvpnWallet = !!fixtures.users.user3;
  // Concurrent (devnet, dedicated wallets): both legs share one
  // runSignupFlow budget, ~11 min covers it same as signup-flow.spec.ts.
  // Sequential (preprod, one shared wallet): the two legs' budgets don't
  // overlap, so this needs close to double.
  test.setTimeout(hasDedicatedOpenvpnWallet ? 11 * 60_000 : 21 * 60_000);
  const ovUser = fixtures.users.user3 ?? fixtures.users.user1;
  const ovKey = loadSigningKey(
    walletSkeyPath(hasDedicatedOpenvpnWallet ? "user3" : "user1"),
  );

  // The `request` fixture is bound to BASE_URL (nginx) - the openvpn leg
  // needs its own APIRequestContext pointed directly at the k3d-hosted
  // indexer instead, which is what @playwright/test's standalone
  // `request.newContext()` (not the fixture - that has no such method) is
  // for.
  const ovRequest = await apiRequest.newContext({
    baseURL: fixtures.openvpn!.indexerUrl,
  });
  try {
    const wgSignup = () =>
      runSignupFlow({
        request,
        paymentAddress: wgUser.address,
        signingKey: wgKey,
        region: fixtures.region,
        priceLovelace: fixtures.priceLovelace,
        durationMs: fixtures.durationMs,
      });
    const ovSignup = () =>
      runSignupFlow({
        request: ovRequest,
        paymentAddress: ovUser.address,
        signingKey: ovKey,
        region: fixtures.openvpn!.region,
        priceLovelace: fixtures.priceLovelace,
        durationMs: fixtures.durationMs,
      });

    let wg: { clientId: string };
    let ov: { clientId: string };
    if (hasDedicatedOpenvpnWallet) {
      [wg, ov] = await Promise.all([wgSignup(), ovSignup()]);
    } else {
      wg = await wgSignup();
      ov = await ovSignup();
    }

    expect(wg.clientId).toMatch(/^[0-9a-f]+$/);
    expect(ov.clientId).toMatch(/^[0-9a-f]+$/);
    expect(wg.clientId).not.toBe(ov.clientId);
  } finally {
    await ovRequest.dispose();
  }
});
