# Ephemeral testnet

`docker/testnet/` brings up a self-contained, throwaway environment for
testing this frontend against real `vpn-indexer` and `vpn-contracts` code -
not mocks - and tears it down again. Every service runs as a Kubernetes
resource in a k3d cluster this script creates and deletes itself - no
docker-compose involved. It runs the same way locally and in CI
(`.github/workflows/testnet-e2e.yml`).

For running the same suite against the real Cardano preprod network and
an already-deployed instance of the contracts instead of this private
throwaway chain, see `docs/testnet-preprod.md` - manual/on-demand only,
not wired into CI.

## What it actually is

A private single-node Cardano network, not a fork of preprod/preview and not
a connection to any public testnet:

1. **`configurator`** generates fresh genesis files and one pool's keys
   (`docker/testnet/configurator/`, using
   [cardano-foundation/testnet-generation-tool][tgt] - the same tool
   blinklabs-io/dingo's own DevNet uses) the first time the stack starts
   (idempotent after that - see "Local caveats" below). Slots are short
   (0.5s) so the whole flow below fits in a few minutes; the epoch is long
   (100000 slots) mainly to keep a single Conway-from-genesis era summary
   simple - nothing currently depends on it being that specific length.
2. **`cardano-node`** (`ghcr.io/blinklabs-io/cardano-node`) runs as the sole
   block producer against that genesis - a real Haskell node, forging its
   own chain.
3. **`ogmios`**, **`kupo`**, **`tx-submit-api`** sit in front of it, same as
   blinklabs-io/cardano-compose-stacks' usual setup, just pointed at this
   private chain instead of a public network.
4. **`contracts-deploy`** builds `blinklabs-io/vpn-contracts`'s validators
   for *this* deployment (the checked-in `preview/`/`preprod/` `.plutus`
   files are parameterized to those networks' specific addresses - see
   `docker/testnet/deployer/deploy.sh` for why this run needs its own
   `aiken blueprint apply` pass), mints the reference NFT, and writes out
   the resulting script address/policy IDs.
5. **`vpn-indexer`** is built from source
   (`blinklabs-io/vpn-indexer`, pinned by `VPN_INDEXER_REF`, default `main`)
   and started once `contracts-deploy` finishes, pointed at the addresses it
   just produced.
6. **`vpn-frontend`** is this repo, built into a static bundle and served
   behind nginx, which proxies `/api` to `vpn-indexer` - the same shape a
   real deployment takes (see `Dockerfile`, `docker/nginx.conf.template`).
7. **`e2e`** runs the Playwright suite (`e2e/`) against that frontend.

Nothing here is faked: signing up for VPN access on this stack mints a real
token by executing the real Aiken validators, and vpn-indexer really has to
chain-sync and build a valid transaction against them.

### WireGuard *and* OpenVPN, together

vpn-indexer runs twice: one instance `VPN_PROTOCOL=wireguard` (alongside
`ghcr.io/blinklabs-io/docker-wireguard` and a `minio` instance for its
S3-backed peer registry), one `VPN_PROTOCOL=openvpn`. Both are ordinary
Deployments in the same k3d cluster/namespace as everything else - the
OpenVPN instance needs nothing special *from this stack*, but vpn-indexer's
own OpenVPN code path unconditionally initializes a CRL `ConfigMap`
updater that calls `rest.InClusterConfig()` (`internal/crl/crl.go`) - it
expects to be running *inside* Kubernetes (as an actual pod, not merely
reachable from one), which is exactly what running everything in k3d
already gets for free. Its RBAC (ServiceAccount+Role+RoleBinding) and CA
ConfigMap are hand-written manifests in `testnet.sh` itself, reusing the
same public test CA cert/key vpn-indexer's own `scripts/local-deploy.sh`
uses for the same purpose (that script solves this with a separate
`helm-charts` repo + Helm; this stack doesn't depend on either).
`contracts-deploy` mints a second region into the same reference datum
for it (`OPENVPN_REGION`/`DEVNET_OPENVPN_REGION`, default `"eu west-1"` -
the existing `"us east-1"` wireguard region is untouched), and
`signup-flow-dual-protocol.spec.ts` signs up against both concurrently in
one run.

## Quick start

Requires Docker, `k3d`, and `kubectl`. BuildKit's `buildx` is also needed
(for `additional_contexts`, i.e. pulling vpn-indexer/vpn-contracts source
straight from git at build time - `docker buildx version` should print
something; if a build says the classic builder doesn't support additional
contexts, install the `docker-buildx`/`docker-buildx-plugin` package for
your distro) - images are still built with plain `docker build`/`buildx`
exactly as before, then `k3d image import`ed into the cluster; only how
they're *run* changed. `curl` is needed on the host too (`testnet.sh`
polls ogmios directly with it before declaring the stack ready).

```bash
npm run testnet:up     # build everything, bring the stack up, wait for it
npm run testnet:test   # up, run the e2e suite, tear down - what CI runs
npm run testnet:down   # tear down (all volumes removed - nothing is worth
                        # keeping between runs, genesis is regenerated fresh
                        # every time anyway)
docker/testnet/testnet.sh logs vpn-indexer   # tail one service's logs
```

`testnet:up` prints the frontend and indexer API URLs once
`vpn-indexer`'s healthcheck (`/healthcheck` - unlike its other routes, not
under `/api`) passes. From there:

`testnet.sh test` also confirms kupo and vpn-indexer (both regions) have
actually caught up to chain tip before running the suite - normally
near-instant on devnet's tiny freshly-genesis'd chain, so this is really a
fast-failing sanity check (5m timeout) rather than a real wait; see
`docs/testnet-preprod.md`'s own note on this for why it matters at all.
Pass `--skip-sync-check` (`docker/testnet/testnet.sh test --skip-sync-check`)
to skip it.

```bash
BASE_URL=http://localhost:8880 npx playwright test   # run e2e without Docker
```

## Pinning upstream refs

`vpn-indexer` and `vpn-contracts` are built from their git repos directly
(Docker's git build-context support - no local checkout needed), pinned to
`main` by default:

```bash
VPN_INDEXER_REF=some-branch VPN_CONTRACTS_REF=v1.2.3 npm run testnet:up
```

## The e2e suite

`e2e/tests/`:

- `smoke.spec.ts` - the page loads with no console errors.
- `refdata.spec.ts` - `/api/refdata` reflects the reference data
  `contracts-deploy` actually minted on-chain (proxy -> indexer -> kupo/
  ogmios -> the deployed contract, no app code involved).
- `signup-flow.spec.ts` - the deep one: builds a signup tx through the
  real API, signs it with a genesis-funded test wallet
  (`e2e/fixtures/signing.ts`, using the same `@harmoniclabs/
  cardano-ledger-ts` dependency the app itself signs with), submits it, and
  polls until vpn-indexer's chain-sync observes the new client. This is the
  one that actually exercises the vpn-contracts validators.
- `wallet-connect.spec.ts` - drives the real wallet-connect UI against a
  mocked CIP-30 wallet (`e2e/fixtures/mock-wallet.ts`). Its selectors reach
  into a third-party wallet-picker component this suite doesn't control -
  see the comment at the top of the file before changing that UI.
- `purchase-flow.spec.ts` - the UI-driven counterpart to
  `signup-flow.spec.ts`: connects the mocked wallet, clicks through
  `PurchaseCard`/`ConfirmModal` for real, and lets the app itself build,
  sign, and submit the transaction (instead of talking to `/api/tx/*`
  directly).
- `signup-flow-dual-protocol.spec.ts` - signs up against the wireguard
  region (through nginx, like `signup-flow.spec.ts`) and the openvpn
  region (directly against its own in-cluster Service address - nginx
  only ever proxies to one backend) concurrently, using a dedicated third
  wallet (`user3`) so neither leg contends for the other's UTxOs. Skips
  itself cleanly if it can't find the OpenVPN indexer's fixture data (e.g.
  running `BASE_URL=... npx playwright test` directly against a
  differently-configured stack).

`contracts-deploy` writes the fixture data these tests read (region/price/
duration, test users' addresses, and their signing keys) to a shared
PersistentVolumeClaim mounted at `/shared` - see `docker/testnet/deployer/
deploy.sh`'s last section and `e2e/fixtures/deployment.ts`.

## Local caveats

- First run pulls several images and builds vpn-indexer from source; expect
  it to take a few minutes longer than subsequent runs (Docker's layer
  cache covers the rest).
- `TESTNET_MAGIC` (env var, default `45`) must match
  `docker/testnet/configurator/testnet-vpn.yaml`'s `networkMagic` if you
  change either - `tx-submit-api` and `contracts-deploy` don't derive it
  from genesis themselves.
- `contracts-deploy` and `configurator` both guard against re-running
  (`deploy.sh` exits immediately if `/shared/.deployed` already exists;
  `configurator.sh` if `/configs/.generated` does) - normally moot here
  since `testnet.sh` always deletes and recreates the whole cluster before
  each run, so these Jobs only ever run once per cluster lifetime anyway.
  The guard mainly matters if you manually re-apply one of these Jobs
  against an already-up cluster (e.g. via `kubectl apply` by hand while
  debugging) - a second real `deploy.sh` run would find its `plutus.json`
  copy already fully parameter-applied and fail outright (`aiken blueprint
  apply`'s `no_parameters` error), while a second real `configurator.sh`
  run would silently regenerate genesis with a new wall-clock-relative
  `systemStart` while `cardano-node` keeps running against the original
  one.
- The wireguard container logs `/proc/sys/net/ipv4/ip_forward: Read-only
  file system` on start. Harmless here - it's only trying to enable NAT
  forwarding for real tunnel traffic, which this stack never sends (nothing
  exercises the actual WireGuard UDP path, only the peer-management API) -
  and it doesn't stop the API server underneath it from starting.
- `deploy.sh`'s `DURATION_MS` must stay >= 3,600,000 (1 hour). The
  frontend's `normalizeDurationMs()` (`src/pages/Account.tsx`) treats any
  smaller value as seconds rather than ms and multiplies it by 1000 - a
  heuristic that papers over a real API unit ambiguity but never applies to
  actual (hour+) subscription plans, so a duration below that is silently
  corrupted before it reaches the API. This is a genuine (if narrow)
  frontend fragility, not a test bug - worth fixing in `Account.tsx` itself
  at some point - but nothing in this suite needs a short-lived plan (no
  test asserts on expiry timing, only that `expiration > now`), so the
  fixture just avoids it.

[tgt]: https://github.com/cardano-foundation/testnet-generation-tool
