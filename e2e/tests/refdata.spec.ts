import { test, expect } from "@playwright/test";
import { loadFixtures } from "../fixtures/deployment";

// Proves the full read path: nginx's /api proxy -> vpn-indexer -> its
// on-chain view (via kupo/ogmios) of the VPNReferenceData datum that
// docker/testnet/deployer/deploy.sh just minted onto the freshly-deployed
// vpn-contracts script address. If this fails, the stack didn't wire up
// correctly - it's not exercising app UI code at all.
test("refdata reflects the reference data deployed onto the testnet", async ({
  request,
}) => {
  const fixtures = loadFixtures();

  const res = await request.get("/api/refdata");
  expect(res.ok(), await res.text()).toBeTruthy();

  const body = await res.json();
  expect(body.regions).toContain(fixtures.region);
  expect(body.prices).toContainEqual({
    duration: fixtures.durationMs,
    price: fixtures.priceLovelace,
  });
});
