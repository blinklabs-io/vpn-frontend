// Reads the fixture data this run's setup step wrote out once it finished -
// the region/price/duration this run's reference data actually offers, and
// where to find each test user's address and signing key. Written by
// docker/testnet/deployer/deploy.sh (devnet: deploys vpn-contracts fresh,
// funds wallets from genesis) or docker/testnet/preprod/wallet-setup.sh
// (preprod: targets an already-deployed instance, funds/reuses one real
// wallet) - same JSON shape either way, so this file doesn't need to know
// or care which stack it's running against.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const SHARED_DIR = process.env.SHARED_DIR || "/shared";

export interface DeploymentFixtures {
  region: string;
  priceLovelace: number;
  durationMs: number;
  users: Record<"user1" | "user2", { address: string }> & {
    // devnet only (docker/testnet/deployer/deploy.sh) - a dedicated wallet
    // for signup-flow-dual-protocol.spec.ts's OpenVPN leg, so it never
    // contends for a UTxO with user1's concurrent wireguard-leg signup.
    // Absent on preprod, which has exactly one funded wallet - that spec
    // falls back to reusing user1 there (sequentially, not concurrently).
    user3?: { address: string };
  };
  // The OpenVPN-mode vpn-indexer instance (a second Deployment alongside
  // the wireguard-mode one - see testnet.sh's/testnet-preprod.sh's own
  // apply_vpn_indexer_openvpn), if any. On devnet, deploy.sh writes both
  // fields directly into e2e-fixtures.json up front (indexerUrl is a
  // static, known-ahead-of-time in-cluster Service address). On preprod,
  // wallet-setup.sh doesn't know about this leg at all - testnet-
  // preprod.sh's own write_openvpn_fixtures writes a separate file once
  // the OpenVPN Deployment is actually up - see loadFixtures() below,
  // which merges both possible sources.
  openvpn?: { region: string; indexerUrl?: string };
}

export function loadFixtures(): DeploymentFixtures {
  const fixtures = JSON.parse(
    readFileSync(path.join(SHARED_DIR, "e2e-fixtures.json"), "utf8"),
  ) as DeploymentFixtures;
  const openvpnFixturesPath = path.join(SHARED_DIR, "e2e-fixtures-openvpn.json");
  if (existsSync(openvpnFixturesPath)) {
    fixtures.openvpn = {
      ...fixtures.openvpn,
      ...JSON.parse(readFileSync(openvpnFixturesPath, "utf8")),
    };
  }
  return fixtures;
}

export function walletSkeyPath(
  user: "user1" | "user2" | "user3" | "provider",
): string {
  return path.join(SHARED_DIR, "wallets", `${user}.skey`);
}
