// The build -> sign -> submit -> observe signup sequence, extracted out of
// signup-flow.spec.ts so signup-flow-dual-protocol.spec.ts can drive it
// twice against two different backends (nginx's /api proxy for the
// wireguard region, a second vpn-indexer instance's own API directly for
// the openvpn region - see testnet.sh's/testnet-preprod.sh's own
// apply_vpn_indexer_openvpn) without duplicating this logic. Behavior is
// unchanged from the original inline version - same retry/timeout
// budgets, same assertions.
import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import type { SigningKey } from "./signing";
import { signTx } from "./signing";

export interface SignupFlowParams {
  request: APIRequestContext;
  paymentAddress: string;
  signingKey: SigningKey;
  region: string;
  priceLovelace: number;
  durationMs: number;
}

export interface SignupFlowResult {
  clientId: string;
}

/**
 * Runs one full signup: /api/tx/signup -> sign -> /api/tx/submit -> poll
 * /api/client/list until the new client appears. Asserts the client's
 * region/expiration are correct before returning.
 *
 * `request` determines the backend this hits: pass the test's own
 * `request` fixture to go through nginx's /api proxy (the wireguard
 * region, same as always), or an `APIRequestContext` created via
 * `request.newContext({ baseURL: ... })` pointed directly at a second
 * vpn-indexer instance's own API (the openvpn region, which nginx never
 * proxies to).
 */
export async function runSignupFlow(
  params: SignupFlowParams,
): Promise<SignupFlowResult> {
  const { request, paymentAddress, signingKey, region, priceLovelace, durationMs } =
    params;

  // On the devnet stack each caller normally has its own wallet, so the
  // first attempt always succeeds - but the preprod stack (testnet-
  // preprod.sh) shares a single persistent wallet across callers. A
  // vpn-indexer tx-builder picks inputs from kupo's view, which can lag a
  // few seconds behind a spend that just landed - so a signup built right
  // after another one confirms can still reference a UTxO that's already
  // spent, rejected with "All inputs are spent [...]". That's transient
  // and self-corrects once kupo catches up, so retry the whole
  // build-sign-submit cycle (not just resubmitting the same tx - it's
  // kupo's picked *input* that's stale, not just this attempt) rather than
  // failing outright on it.
  let clientId = "";
  let txCbor = "";
  for (let attempt = 1; ; attempt++) {
    const signupRes = await request.post("/api/tx/signup", {
      data: {
        paymentAddress,
        price: priceLovelace,
        duration: durationMs,
        region,
      },
    });
    expect(signupRes.ok(), await signupRes.text()).toBeTruthy();
    ({ clientId, txCbor } = await signupRes.json());
    expect(clientId).toMatch(/^[0-9a-f]+$/);

    const signedTxHex = signTx(txCbor, signingKey);

    const submitRes = await request.post("/api/tx/submit", {
      headers: { "Content-Type": "application/cbor" },
      data: Buffer.from(signedTxHex, "hex"),
    });
    if (submitRes.ok()) break;
    const submitErr = await submitRes.text();
    if (attempt >= 5 || !submitErr.includes("All inputs are spent")) {
      expect(submitRes.ok(), submitErr).toBeTruthy();
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }

  // The devnet stack confirms near-instantly, so this rarely needs more
  // than a few seconds there. Real preprod is a different story: observed
  // directly, a tx submitted through that stack's single (non-block-
  // producing) relay node can take anywhere from a few seconds to several
  // minutes to actually land in a block - real, variable network latency,
  // not a bug here - so this gets a generous 10-minute budget to match.
  await expect(async () => {
    const listRes = await request.post("/api/client/list", {
      data: { ownerAddress: paymentAddress },
    });
    expect(listRes.ok()).toBeTruthy();
    const clients = await listRes.json();
    const client = (clients as Array<{ id: string }>).find(
      (c) => c.id === clientId,
    );
    expect(client).toBeTruthy();
  }).toPass({ timeout: 10 * 60_000, intervals: [2_000, 5_000, 10_000, 30_000] });

  const clients = await (
    await request.post("/api/client/list", {
      data: { ownerAddress: paymentAddress },
    })
  ).json();
  const client = clients.find((c: { id: string }) => c.id === clientId);
  expect(client.region).toBe(region);
  expect(new Date(client.expiration).getTime()).toBeGreaterThan(Date.now());

  return { clientId };
}
