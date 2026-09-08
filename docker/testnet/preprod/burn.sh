#!/usr/bin/env bash
set -euo pipefail

# Burns one client token this preprod harness minted, cleaning up after
# itself on the *real* preprod chain - see testnet-preprod.sh's cmd_burn
# and docs/testnet-preprod.md. Not run automatically; invoke explicitly
# via `testnet-preprod.sh burn <clientId>` whenever you're actually done
# (including any manual testing) with a
# given client.
#
# Mirrors vpn-contracts/scripts/04a-burn-vpn-access.sh's actual on-chain
# pattern (owner-signed BurnVPNAccess, via cardano-cli against the same
# reference script this deployment already uses) rather than reinventing
# it - vpn-indexer has no burn API endpoint at all (see docs/testnet-
# preprod.md for why).
#
# On-chain rule this has to satisfy (validators/vpn.ak's BurnVPNAccess
# spend arm, owner path): now > expiration_time, and the owner's signature
# present. There is no early/voluntary burn - this can only succeed once
# the plan's real duration has actually elapsed since signup.

MAGIC_ARG="--testnet-magic ${TESTNET_MAGIC:-1}"
SHARED_DIR="${SHARED_DIR:-/shared}"
WALLET_DIR="${SHARED_DIR}/wallets"
CLIENT_ID="${CLIENT_ID:-}"

# The real preprod deployment's own identifiers (same values vpn-indexer's
# compiled-in defaults use - internal/config/config.go - and vpn-contracts/
# README.md's "Preprod" section).
VPN_SCRIPT_ADDR="addr_test1zz496ujn6ly5urgwfarftxs2f05s2cs2hjkeed73a8qjcvjjduk3c6ecrpkrk8qqlr4ep37cx03ytlcn70n93zyemj6suh7mks"
VPN_POLICY_ID="aa5d7253d7c94e0d0e4f46959a0a4be905620abcad9cb7d1e9c12c32"
VPN_SCRIPT_REF="ea7e4f0147eeba9a17c519e1652ed933262d30fe462bf418ece18dc27a2c13ba#1"

log() { echo "[burn] $*" >&2; }

if [ -z "${CLIENT_ID}" ]; then
    log "CLIENT_ID is required (testnet-preprod.sh burn <clientId>)"
    exit 1
fi
if [ ! -f "${WALLET_DIR}/user1.skey" ]; then
    log "no wallet found at ${WALLET_DIR}/user1.skey - run 'testnet-preprod.sh up' first"
    exit 1
fi

USER_ADDR=$(cat "${WALLET_DIR}/user1.addr")
USER_SKEY="${WALLET_DIR}/user1.skey"

log "looking up client ${CLIENT_ID} at ${VPN_SCRIPT_ADDR}..."
UTXOS=$(cardano-cli query utxo ${MAGIC_ARG} --address "${VPN_SCRIPT_ADDR}" --out-file /dev/stdout)
VPN_UTXO=$(echo "${UTXOS}" | jq -r --arg pid "${VPN_POLICY_ID}" --arg cid "${CLIENT_ID}" \
    'to_entries[] | select(.value.value[$pid][$cid]? == 1) | .key' | head -1)
if [ -z "${VPN_UTXO}" ]; then
    log "no UTxO at ${VPN_SCRIPT_ADDR} holds ${VPN_POLICY_ID}.${CLIENT_ID} - already burned, or wrong client ID?"
    exit 1
fi
log "found client UTxO: ${VPN_UTXO}"

EXPIRATION_MS=$(echo "${UTXOS}" | jq -r --arg k "${VPN_UTXO}" '.[$k].inlineDatum.fields[2].int')
NOW_MS=$(($(date +%s) * 1000))
if [ "${NOW_MS}" -le "${EXPIRATION_MS}" ]; then
    log "not expired yet: expiration_time=${EXPIRATION_MS} (ms), now=${NOW_MS} (ms)."
    log "the owner-burn path requires now > expiration_time - try again after $(date -u -d "@$((EXPIRATION_MS / 1000))" 2>/dev/null || date -u -r $((EXPIRATION_MS / 1000)))."
    exit 1
fi
log "expired (expiration_time=${EXPIRATION_MS}ms, now=${NOW_MS}ms) - proceeding"

# Collateral/fee input: any UTxO at the owner's address holding *only* ADA
# (Plutus collateral can't carry other assets), picking the largest.
COLLATERAL_UTXO=$(cardano-cli query utxo ${MAGIC_ARG} --address "${USER_ADDR}" --out-file /dev/stdout |
    jq -r '[to_entries[] | select((.value.value | keys) == ["lovelace"])] | max_by(.value.value.lovelace) | .key')
if [ -z "${COLLATERAL_UTXO}" ] || [ "${COLLATERAL_UTXO}" = "null" ]; then
    log "no ADA-only UTxO found at ${USER_ADDR} to use as collateral/fees"
    exit 1
fi
log "using ${COLLATERAL_UTXO} for collateral and fees"

WORKDIR=$(mktemp -d)
trap 'rm -rf "${WORKDIR}"' EXIT
REDEEMER_FILE="${WORKDIR}/burn-redeemer.json"
jq -n '{constructor: 3, fields: []}' >"${REDEEMER_FILE}"

CUR_SLOT=$(cardano-cli query tip ${MAGIC_ARG} | jq '.slot')
log "current slot: ${CUR_SLOT}"

cardano-cli conway transaction build \
    ${MAGIC_ARG} \
    --tx-in-collateral "${COLLATERAL_UTXO}" \
    --tx-in "${COLLATERAL_UTXO}" \
    --tx-in "${VPN_UTXO}" \
    --spending-tx-in-reference "${VPN_SCRIPT_REF}" \
    --spending-plutus-script-v3 \
    --spending-reference-tx-in-inline-datum-present \
    --spending-reference-tx-in-redeemer-file "${REDEEMER_FILE}" \
    --mint "-1 ${VPN_POLICY_ID}.${CLIENT_ID}" \
    --mint-tx-in-reference "${VPN_SCRIPT_REF}" \
    --mint-plutus-script-v3 \
    --mint-reference-tx-in-redeemer-file "${REDEEMER_FILE}" \
    --policy-id "${VPN_POLICY_ID}" \
    --change-address "${USER_ADDR}" \
    --invalid-before "${CUR_SLOT}" \
    --required-signer "${USER_SKEY}" \
    --out-file "${WORKDIR}/burn.raw"

cardano-cli conway transaction sign \
    ${MAGIC_ARG} \
    --tx-body-file "${WORKDIR}/burn.raw" \
    --out-file "${WORKDIR}/burn.sign" \
    --signing-key-file "${USER_SKEY}"

cardano-cli conway transaction submit \
    ${MAGIC_ARG} \
    --tx-file "${WORKDIR}/burn.sign"

log "burned ${CLIENT_ID}"
