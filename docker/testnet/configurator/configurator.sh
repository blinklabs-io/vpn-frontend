#!/usr/bin/env bash
set -euo pipefail

# Genesis/key generator for the ephemeral VPN testnet: a single-pool private
# Cardano network with one Haskell cardano-node acting as block producer.
#
# Trimmed down from blinklabs-io/dingo's internal/test/devnet/configurator.sh
# (same testnet-generation-tool). That version generates a multi-pool ring
# topology for Dingo-vs-Dingo consensus testing; we only need one producer
# with no peers, so the topology and multi-pool chown steps are dropped.

UTXO_HD_WITH="mem"

# Implement sponge-like command without needing a binary or TMPDIR env var.
write_file() {
    local tmp_file="${1}_$(tr </dev/urandom -dc A-Za-z0-9 | head -c16)"
    cat >"${tmp_file}"
    mv --force "${tmp_file}" "${1}"
}

config_config_json() {
    CONFIG_JSON=$1/configs/config.json
    jq "del(.AlonzoGenesisHash, .ByronGenesisHash, .ConwayGenesisHash, .ShelleyGenesisHash)" "${CONFIG_JSON}" | write_file "${CONFIG_JSON}"
    jq "del(.hasEKG)" "${CONFIG_JSON}" | write_file "${CONFIG_JSON}"
    jq "del(.options.mapBackends)" "${CONFIG_JSON}" | write_file "${CONFIG_JSON}"
    jq ".PeerSharing = false" "${CONFIG_JSON}" | write_file "${CONFIG_JSON}"

    case "${UTXO_HD_WITH,,}" in
        hd)
            jq ".LedgerDB = { Backend: \"V1LMDB\", LiveTablesPath: \"/state/lmdb\"}" "${CONFIG_JSON}" | write_file "${CONFIG_JSON}"
            ;;
        *)
            jq '.LedgerDB = { Backend: "V2InMemory"}' "${CONFIG_JSON}" | write_file "${CONFIG_JSON}"
            ;;
    esac
}

# Single producer, no peers: an empty topology is enough for a lone node to
# forge on its own leader schedule.
config_topology_json() {
    cat <<EOF > "/configs/1/configs/topology.json"
{
  "localRoots": [],
  "publicRoots": [],
  "useLedgerAfterSlot": 0
}
EOF
}

compute_start_time() {
    # Give Docker time to start the node container after this exits.
    # genesis-cli.py's systemStartDelay is too short because key generation
    # takes 20-30+ seconds, so we override after generation.
    SYSTEM_START_UNIX=$(( $(date +%s) + 30 ))
    SYSTEM_START_ISO="$(date -d @${SYSTEM_START_UNIX} -u '+%Y-%m-%dT%H:%M:%SZ')"
}

set_start_time() {
    SHELLEY_GENESIS_JSON="$1/configs/shelley-genesis.json"
    BYRON_GENESIS_JSON="$1/configs/byron-genesis.json"
    jq ".systemStart = \"${SYSTEM_START_ISO}\"" "${SHELLEY_GENESIS_JSON}" | write_file "${SHELLEY_GENESIS_JSON}"
    jq ".startTime = ${SYSTEM_START_UNIX}" "${BYRON_GENESIS_JSON}" | write_file "${BYRON_GENESIS_JSON}"
}

# Idempotency guard, matching deployer/deploy.sh's `.deployed` marker:
# unlike that script, this one had no guard at all, so *any* re-invocation
# (normally moot - testnet.sh's own cluster_up() always deletes and
# recreates the whole cluster before each run, so this Job only ever runs
# once per cluster lifetime; this matters if you manually re-apply it
# against an already-up cluster while debugging - see docs/testnet.md's
# "Local caveats") would silently regenerate genesis with a brand-new
# wall-clock-relative systemStart (compute_start_time() below is `now +
# 30s`, different every run) into the shared /configs volume, while
# cardano-node - already running, having loaded the *original*
# genesis once at its own startup - and ogmios - which reads the genesis
# file fresh per query, not cached at its own startup - would disagree
# about systemStart from that point on. That mismatch is exactly the shape
# of this project's documented signup-flow/on-chain-rejection bug.
if [ -f /configs/.generated ]; then
    echo "genesis/config already generated (found /configs/.generated) - not regenerating" >&2
    exit 0
fi

cp /testnet.yaml ./testnet.yaml

uv run python3 genesis-cli.py testnet.yaml -o /tmp/testnet -c generate

find /tmp/testnet -type f -name 'topology.json' -exec rm -f '{}' ';'

mkdir -p /configs /configs/utxo-keys
cp -r /tmp/testnet/pools/* /configs
rm -rf /configs/keys

config_topology_json

compute_start_time
echo "system start: ${SYSTEM_START_ISO} (unix: ${SYSTEM_START_UNIX})"

# Publish the runtime start so the deployer/wait-for-sync scripts (which have
# no other way to learn it) don't treat "socket is open" as "chain started":
# Docker can report the node healthy before genesis actually begins.
cp /testnet.yaml /configs/utxo-keys/runtime-genesis
sed -i "/^systemStartDelay:/a systemStartUnix: ${SYSTEM_START_UNIX}" \
  /configs/utxo-keys/runtime-genesis

set_start_time "/configs/1"
config_config_json "/configs/1"

# Expose the Shelley genesis (updated system start) and the genesis UTxO
# signing keys so the contracts-deployer can fund its wallets from the
# initial funds without needing its own copy of the node's config volume.
cp /configs/1/configs/shelley-genesis.json /configs/utxo-keys/
cp /tmp/testnet/utxos/keys/genesis.*.skey /configs/utxo-keys/
cp /tmp/testnet/utxos/keys/genesis.*.vkey /configs/utxo-keys/
cp /tmp/testnet/utxos/keys/genesis.*.addr.info /configs/utxo-keys/

# Test-only credentials: make config + genesis world-readable so any
# consuming container's user can read them.
find /configs -type d -exec chmod 0755 {} +
find /configs -type f -exec chmod 0644 {} +

# cardano-node refuses to start when vrf.skey has "other" read permissions.
if [ -d /configs/1/keys ]; then
    chmod 0700 /configs/1/keys
    find /configs/1/keys -type f -exec chmod 0600 {} +
fi

touch /configs/.generated
