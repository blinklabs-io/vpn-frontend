#!/usr/bin/env bash
set -euo pipefail

# Sets up the single wallet this preprod e2e run signs up and purchases
# with, then writes the same fixture shape the devnet stack's deployer/
# deploy.sh produces (e2e/fixtures/deployment.ts, vpn-indexer's own
# entrypoint.sh both already know how to read these) - the difference is
# entirely in *how* the wallet/fixtures come to exist:
#
#  - devnet: contracts-deploy funds fresh genesis-backed wallets instantly
#    and deploys a brand-new parameterized contract.
#  - preprod: there's no genesis to mint from and no contract to deploy -
#    we're targeting an already-deployed instance (see testnet-preprod.sh's
#    own apply_vpn_indexers - vpn-indexer's compiled-in defaults already
#    point at it). This script sets up its one wallet one of three ways,
#    in order of precedence: reuse a wallet you already funded
#    (EXISTING_WALLET_SKEY), derive one from a seed phrase
#    via bursa (SEED_PHRASE_FILE), or generate a brand-new one - and
#    either way, then blocks until it sees real (test) ADA show up.
#
# Idempotent per shared-volume lifetime via OUT_DIR/.deployed, same pattern
# as deploy.sh.

MAGIC_ARG="--testnet-magic ${TESTNET_MAGIC:-1}"
OUT_DIR="${OUT_DIR:-/shared}"
WALLET_DIR="${OUT_DIR}/wallets"
FUND_WAIT_TIMEOUT_SECS="${FUND_WAIT_TIMEOUT_SECS:-3600}"

# The real, currently-live preprod reference data (query /api/refdata once
# the stack is up to confirm - it can drift from vpn-contracts/preprod/
# datums/vpn_reference_data.json's checked-in snapshot, which is *not*
# authoritative for what's actually deployed; see docs/testnet-preprod.md).
# Region: the first of whatever's currently live. Duration/price: the
# shortest plan actually deployed - 1 hour, 3 ADA at last check.
REGION="us east-1"
PRICE_LOVELACE=3000000
DURATION_MS=3600000
# price + setup fee (see deploy.sh's devnet equivalent) + comfortable
# padding for fees/collateral on a real network's real min-UTxO rules.
FUND_LOVELACE_MIN=$((PRICE_LOVELACE + 10000000))

log() { echo "[wallet-setup] $*" >&2; }

if [ -f "${OUT_DIR}/.deployed" ]; then
    log "already set up (found ${OUT_DIR}/.deployed) - not repeating"
    exit 0
fi

mkdir -p "${WALLET_DIR}"

log "waiting for cardano-node to be reachable..."
for _ in $(seq 1 60); do
    cardano-cli query tip ${MAGIC_ARG} >/dev/null 2>&1 && break
    sleep 5
done

log "waiting for cardano-node to finish syncing to tip (this can take a while after a fresh Mithril restore)..."
i=0
while true; do
    progress=$(cardano-cli query tip ${MAGIC_ARG} 2>/dev/null | jq -r '.syncProgress // "0"')
    log "sync progress: ${progress}%"
    # Compare as a float via awk - syncProgress is a decimal string like "99.87".
    if awk -v p="${progress}" 'BEGIN { exit !(p+0 >= 99.9) }'; then
        break
    fi
    i=$((i + 1))
    if [ "${i}" -gt 720 ]; then
        log "node never reached tip after an hour of waiting - giving up"
        exit 1
    fi
    sleep 5
done
log "node is synced"

# --- wallet: reuse an existing one, derive one from a seed phrase, or
# generate + wait for funding ---------------------------------------------
if [ -n "${EXISTING_WALLET_SKEY:-}" ] && [ -f "${EXISTING_WALLET_SKEY}" ]; then
    log "using existing wallet signing key at ${EXISTING_WALLET_SKEY}"
    cp "${EXISTING_WALLET_SKEY}" "${WALLET_DIR}/user1.skey"
    cardano-cli key verification-key \
        --signing-key-file "${WALLET_DIR}/user1.skey" \
        --verification-key-file "${WALLET_DIR}/user1.vkey"
    cardano-cli address build \
        ${MAGIC_ARG} \
        --payment-verification-key-file "${WALLET_DIR}/user1.vkey" \
        --out-file "${WALLET_DIR}/user1.addr"
    USER_ADDR=$(cat "${WALLET_DIR}/user1.addr")
    log "wallet address: ${USER_ADDR}"
    # `|| echo 0` (not just the query's own `2>/dev/null`): under `set -e
    # -o pipefail`, a transient cardano-cli failure (e.g. the node's own
    # socket briefly unavailable during a pod restart - a real, now-
    # documented recovery step, see docs/testnet-preprod.md) would
    # otherwise feed jq empty input, which itself errors, killing this
    # whole script instead of just retrying on the next loop iteration.
    BALANCE=$(cardano-cli query utxo ${MAGIC_ARG} --address "${USER_ADDR}" --out-file /dev/stdout 2>/dev/null | jq '[.[].value.lovelace] | add // 0' || echo 0)
    if [ "${BALANCE}" -lt "${FUND_LOVELACE_MIN}" ]; then
        log "existing wallet only has ${BALANCE} lovelace, need at least ${FUND_LOVELACE_MIN} - waiting for more funds to arrive (send to ${USER_ADDR})"
    fi
elif [ -n "${SEED_PHRASE_FILE:-}" ] && [ -f "${SEED_PHRASE_FILE}" ]; then
    log "deriving wallet from seed phrase at ${SEED_PHRASE_FILE} (via bursa)"
    # bursa wallet restore: derives payment/stake keys from a BIP39 seed
    # phrase via the standard CIP-1852 path (m/1852'/1815'/0'/0/0 for
    # payment - the same path every major Cardano wallet uses), and
    # writes cardano-cli-compatible key files. Only the payment key/
    # address are used here - see e2e/fixtures/signing.ts for how the
    # extended (bip32) payment.skey it produces gets loaded for signing.
    BURSA_OUT=$(mktemp -d)
    CARDANO_NETWORK=preprod bursa wallet restore \
        --mnemonic-file "${SEED_PHRASE_FILE}" \
        --output "${BURSA_OUT}"
    cp "${BURSA_OUT}/payment.skey" "${WALLET_DIR}/user1.skey"
    cp "${BURSA_OUT}/payment.vkey" "${WALLET_DIR}/user1.vkey"
    cp "${BURSA_OUT}/payment.addr" "${WALLET_DIR}/user1.addr"
    rm -rf "${BURSA_OUT}"
    USER_ADDR=$(cat "${WALLET_DIR}/user1.addr")
    log "wallet address: ${USER_ADDR}"
    # `|| echo 0` (not just the query's own `2>/dev/null`): under `set -e
    # -o pipefail`, a transient cardano-cli failure (e.g. the node's own
    # socket briefly unavailable during a pod restart - a real, now-
    # documented recovery step, see docs/testnet-preprod.md) would
    # otherwise feed jq empty input, which itself errors, killing this
    # whole script instead of just retrying on the next loop iteration.
    BALANCE=$(cardano-cli query utxo ${MAGIC_ARG} --address "${USER_ADDR}" --out-file /dev/stdout 2>/dev/null | jq '[.[].value.lovelace] | add // 0' || echo 0)
    if [ "${BALANCE}" -lt "${FUND_LOVELACE_MIN}" ]; then
        log "derived wallet only has ${BALANCE} lovelace, need at least ${FUND_LOVELACE_MIN} - waiting for more funds to arrive (send to ${USER_ADDR})"
    fi
else
    log "no EXISTING_WALLET_SKEY or SEED_PHRASE_FILE provided - generating a new wallet"
    cardano-cli address key-gen \
        --verification-key-file "${WALLET_DIR}/user1.vkey" \
        --signing-key-file "${WALLET_DIR}/user1.skey"
    cardano-cli address build \
        ${MAGIC_ARG} \
        --payment-verification-key-file "${WALLET_DIR}/user1.vkey" \
        --out-file "${WALLET_DIR}/user1.addr"
    USER_ADDR=$(cat "${WALLET_DIR}/user1.addr")
    log ""
    log "=================================================================="
    log " Generated a fresh preprod wallet. Fund it with test ADA, then"
    log " this will continue automatically once the funds are visible:"
    log ""
    log "   ${USER_ADDR}"
    log ""
    log " Preprod faucet: https://docs.cardano.org/cardano-testnets/tools/faucet/"
    log " Needs at least ${FUND_LOVELACE_MIN} lovelace ($(awk "BEGIN{printf \"%.2f\", ${FUND_LOVELACE_MIN}/1000000}") ADA)."
    log "=================================================================="
    log ""
fi

log "waiting for ${USER_ADDR} to hold at least ${FUND_LOVELACE_MIN} lovelace (timeout: ${FUND_WAIT_TIMEOUT_SECS}s)..."
elapsed=0
while true; do
    # `|| echo 0` (not just the query's own `2>/dev/null`): under `set -e
    # -o pipefail`, a transient cardano-cli failure (e.g. the node's own
    # socket briefly unavailable during a pod restart - a real, now-
    # documented recovery step, see docs/testnet-preprod.md) would
    # otherwise feed jq empty input, which itself errors, killing this
    # whole script instead of just retrying on the next loop iteration.
    BALANCE=$(cardano-cli query utxo ${MAGIC_ARG} --address "${USER_ADDR}" --out-file /dev/stdout 2>/dev/null | jq '[.[].value.lovelace] | add // 0' || echo 0)
    if [ "${BALANCE}" -ge "${FUND_LOVELACE_MIN}" ]; then
        log "funded: ${BALANCE} lovelace"
        break
    fi
    sleep 10
    elapsed=$((elapsed + 10))
    if [ $((elapsed % 60)) -eq 0 ]; then
        log "still waiting for funds at ${USER_ADDR} (${BALANCE}/${FUND_LOVELACE_MIN} lovelace, ${elapsed}s elapsed)..."
    fi
    if [ "${elapsed}" -ge "${FUND_WAIT_TIMEOUT_SECS}" ]; then
        log "timed out after ${FUND_WAIT_TIMEOUT_SECS}s waiting for funding"
        exit 1
    fi
done

# Only one funded wallet is set up here; user1 and user2 (signup-flow.spec.ts
# and purchase-flow.spec.ts respectively) share it. Both tests run
# sequentially in this suite, so there's no concurrent-UTxO contention -
# see docs/testnet-preprod.md.
cp "${WALLET_DIR}/user1.skey" "${WALLET_DIR}/user2.skey"
cp "${WALLET_DIR}/user1.vkey" "${WALLET_DIR}/user2.vkey"
cp "${WALLET_DIR}/user1.addr" "${WALLET_DIR}/user2.addr"

# --- JWT signing key (same as deploy.sh's devnet equivalent) -------------
log "generating JWT signing key"
openssl genpkey -algorithm ed25519 -out "${OUT_DIR}/jwt-private.pem"
openssl pkey -in "${OUT_DIR}/jwt-private.pem" -pubout -out "${OUT_DIR}/jwt-public.pem"

# --- vpn-indexer.env: entrypoint.sh sources this unconditionally, but this
# stack has nothing dynamic for it to contribute (see testnet-preprod.sh's
# own apply_vpn_indexers: everything else is either a compiled-in default
# or a static environment value already) -----------------------------------
: >"${OUT_DIR}/vpn-indexer.env"

# --- e2e fixtures ----------------------------------------------------------
cat >"${OUT_DIR}/e2e-fixtures.json" <<EOF
{
  "region": "${REGION}",
  "priceLovelace": ${PRICE_LOVELACE},
  "durationMs": ${DURATION_MS},
  "users": {
    "user1": {"address": "${USER_ADDR}"},
    "user2": {"address": "${USER_ADDR}"}
  }
}
EOF

touch "${OUT_DIR}/.deployed"
log "done"
