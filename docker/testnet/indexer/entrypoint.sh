#!/bin/sh
set -eu

# Waits for the contracts-deploy Job to publish the addresses/policy IDs
# for this run's fresh vpn-contracts deployment, sources them into the
# environment, then execs the real vpn-indexer binary. Everything else
# vpn-indexer needs (kupo/ogmios/submit URLs, WireGuard/S3 config, JWT key
# path) is set directly as environment on this container in testnet.sh's/
# testnet-preprod.sh's own vpn-indexer Deployment manifest - only the
# values contracts-deploy computes at runtime have to flow through the
# shared volume.

SHARED_DIR="${SHARED_DIR:-/shared}"
ENV_FILE="${SHARED_DIR}/vpn-indexer.env"

echo "[entrypoint] waiting for ${SHARED_DIR}/.deployed" >&2
i=0
while [ ! -f "${SHARED_DIR}/.deployed" ]; do
    i=$((i + 1))
    if [ "${i}" -gt 360 ]; then
        echo "[entrypoint] contracts-deploy never finished (timed out after 30m)" >&2
        exit 1
    fi
    sleep 5
done

echo "[entrypoint] loading ${ENV_FILE}" >&2
set -a
# shellcheck disable=SC1090
. "${ENV_FILE}"
set +a

# VPN_WG_SERVER_PUBKEY isn't known ahead of time: the wireguard container
# generates its own key on first boot when WG_PRIVATE_KEY isn't set. Fetch
# it from that container's own /info endpoint (testnet.sh's/testnet-
# preprod.sh's own k8s_rollout_wait on the wireguard Deployment, before
# vpn-indexer's own manifest is ever applied, guarantees this is up by now).
#
# This image/entrypoint is also reused unmodified for the OpenVPN-mode
# instance (a second vpn-indexer Deployment - see testnet.sh's/testnet-
# preprod.sh's own apply_vpn_indexer_openvpn) - gate this on VPN_PROTOCOL
# so that instance doesn't hang waiting on a wireguard container that
# doesn't exist for it.
if [ "${VPN_PROTOCOL:-wireguard}" = "wireguard" ]; then
    WG_INFO_URL="${VPN_WG_CONTAINER_URL:-http://wireguard:8080}/info"
    echo "[entrypoint] fetching WireGuard server pubkey from ${WG_INFO_URL}" >&2
    i=0
    while true; do
        VPN_WG_SERVER_PUBKEY=$(curl -fsS "${WG_INFO_URL}" 2>/dev/null | jq -r .server_pubkey 2>/dev/null || true)
        [ -n "${VPN_WG_SERVER_PUBKEY}" ] && [ "${VPN_WG_SERVER_PUBKEY}" != "null" ] && break
        i=$((i + 1))
        if [ "${i}" -gt 60 ]; then
            echo "[entrypoint] never got a server_pubkey from ${WG_INFO_URL}" >&2
            exit 1
        fi
        sleep 2
    done
    export VPN_WG_SERVER_PUBKEY
fi

exec /bin/vpn-indexer "$@"
