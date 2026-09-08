# Preprod e2e testing

`docker/testnet/testnet-preprod.sh` runs the same Playwright suite as the
ephemeral devnet (`docs/testnet.md`), but against the **real** Cardano
preprod network and an already-deployed instance of
`vpn-contracts`/`vpn-indexer` on it - not a private throwaway chain. Every
service runs as a Kubernetes resource in a persistent k3d cluster (see
"Persistence" below) - no docker-compose involved. Manual, on-demand use
only: there is no CI workflow for this, unlike the devnet stack's
`.github/workflows/testnet-e2e.yml`.

Read this whole page before running it - unlike the devnet stack, this
touches a real chain and costs real (test) ADA.

## What it actually is, and isn't

- **Not a fresh contracts deployment.** This targets an existing preprod
  script address / policy IDs / reference script - the same ones
  `vpn-indexer` ships as its own compiled-in defaults
  (`internal/config/config.go`) and `vpn-contracts/README.md`'s "Preprod"
  section documents. `vpn-indexer` and `vpn-frontend` are still built from
  source here (so you're testing this repo's actual code), but there's no
  `configurator`/`contracts-deploy` step - nothing is parameterized or
  deployed fresh.
- **A real, self-hosted chain backend.** `cardano-node` runs with
  `NETWORK=preprod`, which makes `ghcr.io/blinklabs-io/cardano-node`'s own
  entrypoint bootstrap from a real Mithril snapshot instead of syncing
  from genesis - several minutes to tens of minutes on a genuinely fresh
  volume, not the seconds a private devnet takes, but not the hours a
  full sync would. `vpn-indexer` and `kupo` then have their own,
  separate (and much longer, on a fresh volume) catch-up on top of
  that - see "Usage" below.
- **A real, but disposable, test wallet.** There's no genesis to mint
  wallets from. `wallet-setup` either reuses a wallet you provide
  (`--wallet`, or a seed phrase via `--seed-phrase` - derived with
  [`bursa`][bursa]) or generates a fresh one and waits for it to be
  funded. See "Usage" below.
- **A throwaway WireGuard server and S3 bucket**, same as the devnet
  stack. This harness doesn't test real tunnel provisioning against any
  production infrastructure, only `vpn-indexer`'s own WireGuard code path.
- **A second, OpenVPN-mode vpn-indexer instance**, watching the same real
  preprod chain for a second, already-live region - see "OpenVPN, via
  k3d" below.

## OpenVPN

`vpn-indexer` runs twice in this cluster: one instance `VPN_PROTOCOL=
wireguard`, one `VPN_PROTOCOL=openvpn`. vpn-indexer's OpenVPN code path
unconditionally initializes a CRL `ConfigMap` updater via Kubernetes
client-go's `rest.InClusterConfig()` (`internal/crl/crl.go`) - it expects
to be running *inside* Kubernetes as an actual pod, which running
everything in k3d already provides; its RBAC and CA ConfigMap are
hand-written manifests in `testnet-preprod.sh` itself (the same public
test CA cert/key vpn-indexer's own `scripts/local-deploy.sh` uses).

The OpenVPN instance watches this same real preprod chain for a *second,
already-live* region - `PREPROD_OPENVPN_REGION` (default `"us east-2"`,
distinct from the wireguard instance's own `"us east-1"`). Unlike devnet,
this harness has no ability to mint a fresh region for this - preprod's
regions are whatever the real, already-deployed contract's reference data
actually offers, and that can drift (same caveat as "What plan this uses,
and why" below). **Re-verify with `curl localhost:${PREPROD_INDEXER_PORT:-
8081}/api/refdata` before relying on the default.**
`signup-flow-dual-protocol.spec.ts` signs up against both regions in the
same run (see `docs/testnet.md` for the general shape - notably, unlike
devnet, the two legs run *sequentially* here rather than concurrently,
both against the same one wallet, to avoid the same-wallet-UTxO-race
flakiness documented above and below).

This is a *second real indexer instance watching the same real preprod
chain* for a second real region - the "shared on-chain policy, other
watchers may react" caveat below applies to it too.

## Persistence

Unlike devnet (fully ephemeral - a fresh cluster every run), this stack's
k3d cluster is **long-lived**: `down` (without `--purge`) runs `k3d
cluster stop`, not delete - every PersistentVolumeClaim's data (chain
data, kupo's and vpn-indexer's own catch-up progress, the wallet/
fixtures) lives on the k3d node container's own filesystem, which `stop`
doesn't touch, so the next `up` (`k3d cluster start`) resumes right where
it left off instead of paying the Mithril restore and the real-tip
catch-up all over again. `down --purge` deletes the cluster - and every
PVC's data with it - outright.

Two things worth knowing about this, precisely because it's a real change
from how the old docker-compose-based version of this stack worked:

- **One-time migration cost.** If you used the old, compose-based version
  of this stack before, its data lived in ordinary named Docker volumes -
  a completely different storage backend from k3d's PVCs (backed by the
  k3d node container's own filesystem via its default `local-path`
  provisioner). There's no way to carry that old data forward: the
  *first* `up` under this version pays the full Mithril restore + kupo/
  vpn-indexer catch-up cost regardless of how caught-up your old volumes
  were. Every run after that first one resumes normally.
- **Don't `docker rm` or prune the cluster's containers by hand.** Since
  PVC data lives in the k3d node container's own filesystem rather than a
  separately-named Docker volume, an accidental `docker rm` of that
  container (or a `docker system prune --volumes` sweep) silently
  destroys all of it with no warning. `k3d cluster stop`/`start`/`delete`
  (i.e. this script's own `down`/`up`/`down --purge`) are the only safe
  lifecycle operations.

## What this means operationally

Every signup this suite runs mints a real client token against a real,
shared on-chain policy - one that may already have other consumers
watching it (an indexer instance operating against this same deployment,
for instance). Anything watching it will observe the mint over the chain
and may try to act on it (e.g. provision a WireGuard peer of its own).
This is expected and accepted for this harness (manual/on-demand only,
not run in CI), but it's why cleanup matters more here than on the devnet
stack:

- **Burning is manual, and only possible once the plan has genuinely
  expired.** `vpn.ak`'s `BurnVPNAccess` spend arm has exactly one owner
  path: `now > expiration_time`, plus the owner's signature. There is no
  early/voluntary burn on-chain, and `vpn-indexer` has no burn API
  endpoint at all (`internal/api/api.go` has no burn/cancel route). This
  harness uses the shortest plan actually offered on preprod (1 hour,
  3 ADA, see below) specifically so that window is short, and
  `preprod/burn.sh` hand-builds the same transaction shape
  `vpn-contracts/scripts/04a-burn-vpn-access.sh` uses.
- **`testnet-preprod.sh test` does not tear anything down afterward** -
  intentionally, so you can follow up with manual testing through the UI
  right after the automated suite runs. Burn what you created explicitly,
  whenever you're actually done with it:
  ```
  docker/testnet/testnet-preprod.sh burn <clientId>
  ```
  (the clientId is in the suite's own output, or `/api/client/list`).

## Prerequisites

Same as the devnet stack (Docker, `buildx`, `k3d`, `kubectl`) - see
`docs/testnet.md`'s "Quick start". Additionally:

- A stable connection: this downloads a real (if modest) chain snapshot.
- Either test ADA already sitting in a preprod wallet you control, or
  patience to wait on the public faucet (rate-limited).

## Usage

```bash
# Generates a fresh wallet and waits for you to fund it - watch the logs
# for the printed address, then send it test ADA from
# https://docs.cardano.org/cardano-testnets/tools/faucet/
docker/testnet/testnet-preprod.sh up

# Or reuse a wallet you already funded (a cardano-cli signing-key JSON file):
docker/testnet/testnet-preprod.sh up --wallet ~/.cardano/preprod-test.skey

# Or derive the wallet from a BIP39 seed phrase (a file with the phrase as
# plain text) - the same standard CIP-1852 derivation any real wallet
# holding that phrase would use, via bursa (github.com/blinklabs-io/bursa):
docker/testnet/testnet-preprod.sh up --seed-phrase ~/.cardano/preprod-test-seed.txt

# Or give the seed phrase directly - see the security note below first:
docker/testnet/testnet-preprod.sh up --seed-phrase-value "word1 word2 ... word24"

docker/testnet/testnet-preprod.sh test    # run the suite (leaves the stack up)
docker/testnet/testnet-preprod.sh burn <clientId>   # clean up, once expired
docker/testnet/testnet-preprod.sh down    # stop it - keeps the synced chain
                                           # data and the wallet/fixtures, so
                                           # the next `up` resumes instead of
                                           # starting over (see below)
docker/testnet/testnet-preprod.sh down --purge   # wipe everything instead -
                                                  # the next `up` starts from
                                                  # a genuinely clean slate
docker/testnet/testnet-preprod.sh logs vpn-indexer
```

`test` waits for both kupo and vpn-indexer (both regions) to actually catch
up to real chain tip before running the suite - kupo and vpn-indexer each
run their own independent chain-follower from the same fixed intersect
point, at very different throughputs, and a Deployment being
Running/Ready says nothing about either one having reached tip yet.
Skipping this produced a real, misleading failure once: the txbuilder
(backed by kupo) reported `"choose input UTxOs: not enough funds"` even
though the wallet plainly held funds on-chain - kupo just hadn't indexed
them yet. Pass `--skip-sync-check` to skip this wait (e.g. you've already
confirmed both are caught up via `testnet-preprod.sh logs kupo`/
`vpn-indexer` yourself, or you're deliberately testing against a
known-stale index):
```bash
docker/testnet/testnet-preprod.sh test --skip-sync-check
```

`--wallet`/`--seed-phrase` both take a file path, never a value inline on
the command line - keeps the actual key material out of shell history and
`ps` output (only the path is passed through; the file's contents are
loaded into a Kubernetes Secret - `kubectl create secret --from-file` -
mounted read-only into the `wallet-setup` Job, and deleted again as soon
as that Job completes, bounding how long it sits in the cluster's own
state to that Job's runtime). Use a seed phrase you're comfortable having
sit on disk in plain text for the duration of the run - this harness makes
no attempt to encrypt it, same as any local `cardano-cli`/`cardano-address`
workflow. Note this is a real (if narrow) trade-off from the old
docker-compose version: a Secret's content sits base64-encoded in the
cluster's own etcd, not encrypted at rest by default, for as long as it
exists - bounded here to one Job's runtime, but not literally *zero*
exposure the way a plain bind-mount (which never touches any daemon's
persisted state at all) was.

`--seed-phrase-value` takes the phrase directly as an argument instead,
for when a file isn't convenient - it lands in this shell's history and in
`testnet-preprod.sh`'s own argv (visible to anything on this machine that
can list processes, e.g. `ps -ef` run by another user), which `--wallet`/
`--seed-phrase` are specifically designed to avoid. Prefer a file unless
you have a specific reason not to. Internally this just writes the value
to a `0600` file under a private temp directory and reuses the same path
`--seed-phrase` does, deleted once `wallet-setup` has consumed it.

### Using an external ogmios/kupo/tx-submit-api

Set `PREPROD_OGMIOS_URL`/`PREPROD_KUPO_URL`/`PREPROD_SUBMIT_URL` to point
vpn-indexer's txbuilder at an already-running instance of that service
instead of standing one up locally - useful for reusing a team-shared
preprod indexer rather than paying each one's own catch-up cost on every
fresh cluster. Whichever of the three you set, its own local
Deployment+Service is skipped entirely; the others (whichever you leave
unset) still get their normal local Deployment:

```bash
PREPROD_KUPO_URL="https://kupo.example.com" \
PREPROD_SUBMIT_URL="https://submit.example.com/api/submit/tx" \
docker/testnet/testnet-preprod.sh up --wallet ~/.cardano/preprod-test.skey
```

Give the exact value `TXBUILDER_OGMIOS_URL`/`TXBUILDER_KUPO_URL`/
`TXBUILDER_SUBMIT_URL` themselves expect - full scheme + host + port, and
for submit, the `/api/submit/tx` path too (this script sets these directly
on the local Deployments too - `ws://ogmios:1337`, `http://kupo:1442`,
`http://tx-submit-api:8090/api/submit/tx` - matching whatever's actually
listening for that shape) - this script passes your value straight
through unmodified, it doesn't try to guess a scheme or append a path
for you.

This does **not** reduce cardano-node itself, or the node-ipc PVC, to
optional: vpn-indexer's own chain-follower (`INDEXER_SOCKET_PATH`) always
needs a direct local node socket regardless, and there's no equivalent
externalizable HTTP/WS alternative for it the way there is for the
txbuilder's own dependencies - so a fresh cluster still pays cardano-node's
own Mithril-restore cost even with all three URLs externalized. `test`'s
own sync-check also skips waiting on kupo specifically when
`PREPROD_KUPO_URL` is set (there's no local pod to health-check) - an
external kupo's own readiness is on you to confirm.

This controls whether a *new* local Deployment gets created, not whether
an existing one gets torn down: setting one of these on an already-`up`
persistent cluster that previously deployed that service locally leaves
the old local Deployment running, unused, until you `down --purge`.
Simplest to set these before the very first `up` against a given cluster.

`up`/`test` wait for `vpn-indexer` to report healthy, which the Mithril
restore blocks (several minutes to tens of minutes on a genuinely fresh
volume) - but **that healthcheck passes well before vpn-indexer or kupo
have actually caught up to the real tip**, and both matter for a signup
to actually succeed:

- **kupo** (wallet funds): `cc.Utxos(paymentAddr)` during tx-building
  reads from kupo, not from vpn-indexer's own database - until kupo's own
  catch-up reaches recent enough blocks to see the wallet's real, current
  UTxOs, signup fails with "not enough funds" even though the wallet is
  genuinely funded. In practice this resolves well before vpn-indexer's
  own catch-up finishes.
- **vpn-indexer itself** (reference data): `/api/tx/signup` reads
  `refData.TxId`/`OutputIdx` from vpn-indexer's *own* database, populated
  purely by replaying chain history from its intersect point forward - it
  has no live "what's the current UTxO" query, so if the reference-data
  UTxO has been spent and recreated (e.g. a price update) since
  vpn-indexer's intersect point, it's still holding the *original,
  already-spent* reference until its own catch-up replays far enough to
  observe the newer one. Signing up with a stale reference fails
  submission with an opaque `ShelleyTxValidationError`/`GenericError`
  ledger rejection (not a script failure - a phase-1 "this input doesn't
  exist" style rejection) that names the stale UTxO. `docker/testnet/
  testnet-preprod.sh logs vpn-indexer | grep "updated reference data"`
  shows every such event vpn-indexer has observed so far - if there's
  only ever been the one from right after the intersect point, this is
  why signup still fails even once kupo/funds are no longer the blocker.

Both walk forward from a fixed historical intersect point (vpn-indexer's
own compiled-in default - the block before its reference token/script
first appeared on-chain) rather than from `origin`, but that point doesn't
move forward as preprod's real chain does, so the gap - and the real
catch-up time - only grows over time. As of the current `vpn-indexer`
`main` (which includes a real chain-follower throughput fix - see its own
history for `fix/sync-speedup`), a genuinely fresh volume's first run has
been directly observed to catch up in **~15-20 minutes total**, with kupo
(a separate, unrelated Haskell codebase, unaffected by that fix) as the
actual bottleneck at ~15-20k slots/sec once vpn-indexer's own catch-up
easily outpaces it. Before that fix, vpn-indexer's own catch-up alone
could take on the order of an hour or more against the same gap - if a
run looks anomalously slow, check `VPN_INDEXER_REF`/whichever `vpn-
indexer` build is actually running. Either way, this is only the *first*
run's cost: `testnet-preprod.sh down` (without `--purge`) keeps the synced
chain data, so a later `up` resumes with only a small incremental catch-up
instead of paying this cost again. `docker/testnet/testnet-preprod.sh logs
vpn-indexer` shows `"catch-up sync in progress"` lines you can watch the
slot number close in on tip with. A wallet with
insufficient funds also blocks here: the setup step polls until it sees
enough lovelace, logging progress every minute, with a generous but
finite timeout (`PREPROD_FUND_WAIT_TIMEOUT_SECS`, default 3600).

**Even once fully caught up, individual submissions can fail to
propagate.** This stack runs a single, non-block-producing preprod relay
node - observed directly against the real network, a submitted signup/
purchase tx is accepted into the node's own mempool (`cardano-cli query
tx-mempool info` against the `cardano-node` container shows what's
currently pending) but whether it ever actually reaches a block producer
looks essentially binary: it either gets relayed and lands within
seconds, or it never does and just sits there until its TTL lapses. A
*longer* TTL doesn't make confirmation more likely in the latter case -
it only holds the wallet's UTxO hostage to a doomed tx for that whole
window before a retry can even start, which actively works against
retrying. `testnet-preprod.sh` overrides `TXBUILDER_TTL_OFFSET` down to
600 slots (~10 min, still comfortably above the few-seconds case) so a
stuck submission frees the wallet back up quickly; `signup-flow.spec.
ts`/`purchase-flow.spec.ts` each poll for up to 10 minutes waiting for
their own submission to actually be indexed before failing. If a run gets
unlucky, `kubectl -n vpn-test delete pod -l app=cardano-node` clears the
node's in-memory mempool immediately (a fresh pod picks up right where
the old one left off - its PVC-backed chain data is untouched, so this
doesn't force a resync) instead of waiting out the TTL.

## What plan this uses, and why

`preprod/wallet-setup.sh` hardcodes the shortest plan actually present in
preprod's real, *currently live* reference data: region `us east-1`,
1 hour, 3 ADA. `vpn-contracts/preprod/datums/vpn_reference_data.json`'s
checked-in snapshot is *not* authoritative for what's actually
deployed - it can drift out of sync with the live on-chain data (region
names in particular). If `wallet-setup` fails signup with "provided
region not valid", confirm the current live values with `curl
localhost:${PREPROD_INDEXER_PORT:-8081}/api/refdata` and update `REGION`
in `wallet-setup.sh` (and the wireguard instance's `VPN_REGION` in
`testnet-preprod.sh`'s `apply_vpn_indexers`, which must match it) to
match. Real preprod plans go up to ~67 days; this
harness always uses the shortest one
so a burn is realistically possible within the same sitting rather than
weeks later. `refdata.spec.ts` still passes even though preprod's refdata
has several other plans too - it only asserts *this* one is present
(`toContainEqual`), not that it's the only one. `purchase-flow.spec.ts`'s
UI-driven purchase locates its card by this run's actual duration label
(mirroring `Account.tsx`'s own `formatDuration`) rather than assuming
there's only one option, so it correctly targets the 1-hour plan's card
even though preprod's real UI shows five.

`signup-flow.spec.ts` and `purchase-flow.spec.ts` share a single wallet
here (`user1`/`user2` in `e2e/fixtures/deployment.ts` both point at the
same funded address) - the devnet stack's two-genesis-wallet setup avoiding
UTxO contention doesn't apply since there's only one funded wallet to
begin with; the two tests still run sequentially within one Playwright
worker, never concurrently, so this doesn't race.

## Costs and limits

- Each signup spends ~3 ADA (price) + fees; a full `test` run (signup +
  purchase) costs a small, low-single-digit-ADA amount of real test ADA
  per run.
- The public preprod faucet is rate-limited (commonly ~1 request per IP
  per day) - for anything beyond occasional manual runs, fund a wallet
  once and reuse it via `--wallet` rather than generating (and re-funding)
  a fresh one every time.
- `kupo` is pointed at vpn-indexer's own default intersect point
  (`107209181.80f5d844230e01d46485495eba8e66486d5264f7d9506abfadbf178fae5b4fdc`)
  rather than `origin`, specifically to avoid re-indexing preprod's entire
  history - if that value is ever bumped upstream in `vpn-indexer`, update
  `testnet-preprod.sh`'s `apply_ogmios_kupo_txsubmit` to match.
- `wallet-setup`'s image builds `bursa` from source (pinned to `main` by
  default, like `vpn-indexer`/`vpn-contracts` - override with
  `BURSA_REF`), only needed for `--seed-phrase`/`--seed-phrase-value`.
  `--wallet` and generating a fresh wallet both use `cardano-cli` directly
  and don't need it.

[bursa]: https://github.com/blinklabs-io/bursa
