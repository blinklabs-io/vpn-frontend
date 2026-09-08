#!/usr/bin/env bash
set -euo pipefail

# One-command wrapper around the preprod e2e stack - see
# ../../docs/testnet-preprod.md before using this. Unlike testnet.sh (the
# private, throwaway devnet), this talks to the real Cardano preprod
# network and an already-deployed instance of the contracts on it.
# Manual/on-demand only - there is no CI workflow for this.
#
# Every service (cardano-node, ogmios, kupo, tx-submit-api, minio, a
# throwaway wireguard server, a one-shot wallet-setup Job, TWO vpn-indexer
# instances - WireGuard-mode and OpenVPN-mode - vpn-frontend, and the e2e
# test runner) runs as a Kubernetes resource inside a single, persistent
# k3d cluster this script creates once and reuses across runs. There is no
# docker-compose involved.
#
# Persistence: unlike devnet, a plain `down` KEEPS the cluster (`k3d
# cluster stop`, not delete) - its PersistentVolumeClaims (chain data,
# kupo/vpn-indexer's own catch-up progress, the wallet/fixtures) live on
# the k3d node container's own filesystem, which `stop` doesn't touch, so
# the next `up` (`k3d cluster start`) resumes exactly where it left off
# instead of paying Mithril-restore + the real-tip catch-up all over
# again. `down --purge` deletes the cluster (and therefore every PVC's
# data) outright. NOTE: because that data now lives in the k3d node
# container's own filesystem rather than a separate named Docker volume,
# `docker rm`'ing that container by hand (or a `docker system prune
# --volumes` sweep) silently destroys all of it with no warning - only
# `k3d cluster stop`/`start`/`delete` are safe lifecycle operations now.
#
# External infra: set PREPROD_OGMIOS_URL/PREPROD_KUPO_URL/
# PREPROD_SUBMIT_URL to point vpn-indexer's txbuilder at an already-
# running instance of that service instead of standing one up locally -
# whichever of the three you set, its own local Deployment+Service is
# skipped entirely. cardano-node itself (and vpn-indexer's own chain-
# follower) always runs locally regardless - see this script's own
# vpn_indexer_common_env.
#
# Usage:
#   docker/testnet/testnet-preprod.sh up [--wallet /path/to/some.skey |
#                                          --seed-phrase /path/to/seed.txt |
#                                          --seed-phrase-value "word1 word2 ..."]
#       Brings the stack up. With none of these flags, generates a fresh
#       wallet and prints its address, then blocks until it's funded (send
#       it test ADA from https://docs.cardano.org/cardano-testnets/tools/
#       faucet/). With --wallet, reuses that existing signing key instead.
#       With --seed-phrase or --seed-phrase-value, derives the wallet from
#       a BIP39 seed phrase via bursa - the same standard CIP-1852
#       derivation any real wallet holding that phrase would use, so this
#       is the address/key such a wallet would show. --seed-phrase reads
#       the phrase from a file; --seed-phrase-value takes it directly as
#       an argument, which lands in your shell history and this process's
#       argv (visible to anything that can list processes on this
#       machine) - prefer --seed-phrase unless you have a reason not to.
#   docker/testnet/testnet-preprod.sh test
#       Runs the e2e suite against the (already- or newly-)up stack. Does
#       NOT tear anything down afterward - the stack, and whatever it
#       minted on-chain, stay up for manual follow-up testing through the
#       UI at the printed frontend URL.
#   docker/testnet/testnet-preprod.sh burn <clientId>
#       Burns one previously-minted client (see e2e/tests output or
#       /api/client/list for its ID) once its real expiration_time has
#       passed - see preprod/burn.sh. Never automatic.
#   docker/testnet/testnet-preprod.sh down [--purge]
#       Stops (keeping all PVC data) by default; --purge deletes the
#       cluster (and every PVC's data) outright and starts fresh next time.
#   docker/testnet/testnet-preprod.sh logs [service]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# shellcheck source=./k8s-lib.sh
. "${SCRIPT_DIR}/k8s-lib.sh"

K8S_CLUSTER_NAME=vpn-preprod-e2e
K8S_NAMESPACE=vpn-test

OGMIOS_VERSION="${OGMIOS_VERSION:-7.0.0}"
KUPO_VERSION="${KUPO_VERSION:-v2.12.0}"
TX_SUBMIT_API_VERSION="${TX_SUBMIT_API_VERSION:-0.22.0}"
DOCKER_WIREGUARD_VERSION="${DOCKER_WIREGUARD_VERSION:-0.1.1}"
VPN_INDEXER_REF="${VPN_INDEXER_REF:-main}"
BURSA_REF="${BURSA_REF:-main}"
# "us east-2" is a real, currently-live preprod region (confirmed via live
# /api/refdata this session) distinct from the wireguard instance's own
# "us east-1" - but preprod's live regions are outside this repo's control
# and can drift. Re-check `curl localhost:${PREPROD_INDEXER_PORT:-8081}/
# api/refdata` before relying on this default; override with
# PREPROD_OPENVPN_REGION if it's changed.
PREPROD_OPENVPN_REGION="${PREPROD_OPENVPN_REGION:-us east-2}"

PREPROD_NODE_PORT="${PREPROD_NODE_PORT:-3011}"
PREPROD_OGMIOS_PORT="${PREPROD_OGMIOS_PORT:-1347}"
PREPROD_KUPO_PORT="${PREPROD_KUPO_PORT:-1452}"
PREPROD_TX_SUBMIT_PORT="${PREPROD_TX_SUBMIT_PORT:-8091}"
PREPROD_WIREGUARD_API_PORT="${PREPROD_WIREGUARD_API_PORT:-8181}"
PREPROD_INDEXER_PORT="${PREPROD_INDEXER_PORT:-8081}"
PREPROD_FRONTEND_PORT="${PREPROD_FRONTEND_PORT:-8881}"
PREPROD_FUND_WAIT_TIMEOUT_SECS="${PREPROD_FUND_WAIT_TIMEOUT_SECS:-3600}"

# External infra overrides: point vpn-indexer's txbuilder at an already-
# running ogmios/kupo/tx-submit-api instead of standing up a local one -
# useful for reusing a team-shared preprod indexer instead of paying each
# one's own catch-up cost on every fresh cluster. Full URLs, exactly the
# shape TXBUILDER_OGMIOS_URL/TXBUILDER_KUPO_URL/TXBUILDER_SUBMIT_URL
# themselves expect (scheme + host + port, and for submit, the
# /api/submit/tx path too) - see docs/testnet-preprod.md. Does NOT affect
# cardano-node itself, or vpn-indexer's own INDEXER_SOCKET_PATH chain-
# follower: both still run locally regardless, since neither has a
# network-reachable alternative to a direct node socket.
PREPROD_OGMIOS_URL="${PREPROD_OGMIOS_URL:-}"
PREPROD_KUPO_URL="${PREPROD_KUPO_URL:-}"
PREPROD_SUBMIT_URL="${PREPROD_SUBMIT_URL:-}"

log() { echo "[testnet-preprod] $*" >&2; }

require_tools() {
    local tool
    for tool in docker k3d kubectl; do
        if ! command -v "${tool}" >/dev/null 2>&1; then
            echo "testnet-preprod.sh: '${tool}' is required but not found in PATH - see docs/testnet-preprod.md's prerequisites" >&2
            exit 1
        fi
    done
}

# --- cluster lifecycle -------------------------------------------------------

cluster_exists() {
    k3d cluster get "${K8S_CLUSTER_NAME}" >/dev/null 2>&1
}

cluster_up() {
    if cluster_exists; then
        log "cluster '${K8S_CLUSTER_NAME}' already exists - starting it (resuming, not recreating - see this script's own persistence comment up top)"
        k3d cluster start "${K8S_CLUSTER_NAME}"
    else
        log "creating cluster '${K8S_CLUSTER_NAME}' (first time - this and the Mithril/catch-up cost that follows only happen once)"
        k3d cluster create "${K8S_CLUSTER_NAME}" \
            -p "${PREPROD_NODE_PORT}:30011@server:0" \
            -p "${PREPROD_OGMIOS_PORT}:30347@server:0" \
            -p "${PREPROD_KUPO_PORT}:30452@server:0" \
            -p "${PREPROD_TX_SUBMIT_PORT}:30091@server:0" \
            -p "${PREPROD_WIREGUARD_API_PORT}:30181@server:0" \
            -p "${PREPROD_INDEXER_PORT}:30081@server:0" \
            -p "${PREPROD_FRONTEND_PORT}:30881@server:0" \
            -v "${REPO_ROOT}/playwright-report:/mnt/playwright-report@server:0" \
            --wait --timeout 120s
    fi
    kctl create namespace "${K8S_NAMESPACE}" --dry-run=client -o yaml | k8s_apply
}

cluster_down() {
    local purge="${1:-false}"
    if ! command -v k3d >/dev/null 2>&1; then
        log "k3d not found - nothing to tear down"
        return 0
    fi
    if [ "${purge}" = true ]; then
        log "deleting cluster '${K8S_CLUSTER_NAME}' (--purge - every PVC's data goes with it)"
        k3d cluster delete "${K8S_CLUSTER_NAME}" >/dev/null 2>&1 || true
    else
        log "stopping cluster '${K8S_CLUSTER_NAME}' (kept - not --purge; next 'up' resumes it)"
        k3d cluster stop "${K8S_CLUSTER_NAME}" >/dev/null 2>&1 || true
    fi
}

# --- image build + import ----------------------------------------------------

build_and_import_images() {
    log "building images"
    docker build -t vpn-preprod-wallet-setup:latest \
        "${SCRIPT_DIR}/preprod" -f "${SCRIPT_DIR}/preprod/Dockerfile.wallet-setup" \
        --build-context "bursa-src=https://github.com/blinklabs-io/bursa.git#${BURSA_REF}"
    docker build -t vpn-preprod-vpn-indexer:latest \
        "${SCRIPT_DIR}/indexer" \
        --build-context "vpn-indexer-src=https://github.com/blinklabs-io/vpn-indexer.git#${VPN_INDEXER_REF}"
    docker build -t vpn-preprod-vpn-frontend:latest \
        "${REPO_ROOT}" -f "${REPO_ROOT}/Dockerfile" \
        --build-arg VITE_CARDANO_NETWORK=preprod \
        --build-arg VITE_WIREGUARD_ENABLED=true \
        --build-arg "VITE_OPENVPN_REGION=${PREPROD_OPENVPN_REGION}"
    docker build -t vpn-preprod-e2e:latest \
        "${REPO_ROOT}" -f "${SCRIPT_DIR}/e2e/Dockerfile"

    log "importing images into the cluster"
    k3d image import \
        vpn-preprod-wallet-setup:latest \
        vpn-preprod-vpn-indexer:latest \
        vpn-preprod-vpn-frontend:latest \
        vpn-preprod-e2e:latest \
        --cluster "${K8S_CLUSTER_NAME}"
}

# --- manifests ----------------------------------------------------------------

apply_static_resources() {
    {
        k8s_pvc preprod-config 100Mi
        echo "---"
        k8s_pvc node-data-preprod 100Gi
        echo "---"
        k8s_pvc node-ipc-preprod 50Mi
        echo "---"
        k8s_pvc kupo-db-preprod 20Gi
        echo "---"
        k8s_pvc minio-data-preprod 200Mi
        echo "---"
        k8s_pvc indexer-data-preprod 2Gi
        echo "---"
        k8s_pvc indexer-data-preprod-openvpn 2Gi
        echo "---"
        k8s_pvc shared-preprod 500Mi
        echo "---"
        k8s_configmap_from_dir preprod-scripts "${SCRIPT_DIR}/preprod"
    } | k8s_apply
}

apply_preprod_config_job() {
    # Re-run (delete+recreate) every `up`, cheap/idempotent - stages
    # ghcr.io/blinklabs-io/cardano-node's baked-in preprod config/genesis/
    # topology files into a shared PVC ogmios/kupo mount read-only.
    kctl delete job preprod-config-init --ignore-not-found >/dev/null
    cat <<EOF | k8s_apply
apiVersion: batch/v1
kind: Job
metadata:
  name: preprod-config-init
  namespace: ${K8S_NAMESPACE}
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: preprod-config-init
          image: ghcr.io/blinklabs-io/cardano-node:11.0.1
          command: ["sh", "-c"]
          args: ["cp -r /opt/cardano/config/preprod /shared-config/preprod && echo 'preprod config staged'"]
          volumeMounts:
            - { name: preprod-config, mountPath: /shared-config }
      volumes:
        - { name: preprod-config, persistentVolumeClaim: { claimName: preprod-config } }
EOF
    k8s_wait_job preprod-config-init 2m
}

apply_cardano_node() {
    cat <<EOF | k8s_apply
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cardano-node
  namespace: ${K8S_NAMESPACE}
spec:
  strategy: { type: Recreate }
  replicas: 1
  selector: { matchLabels: { app: cardano-node } }
  template:
    metadata: { labels: { app: cardano-node } }
    spec:
      containers:
        - name: cardano-node
          image: ghcr.io/blinklabs-io/cardano-node:11.0.1
          env:
            - { name: NETWORK, value: preprod }
          # Unchanged from the compose-era entrypoint: NETWORK=preprod
          # makes the image's own run-network entrypoint bootstrap from a
          # real Mithril snapshot on first run only (skips straight to
          # \`cardano-node run\` once /data/db/protocolMagicId already
          # exists). A Mithril download can fail transiently mid-unpack,
          # leaving /data/db non-empty but without protocolMagicId -
          # clear that partial state before retrying, since a bare
          # container restart alone would otherwise crash-loop forever
          # (mithril-client refuses to resume into a non-empty directory).
          command: ["bash", "-c"]
          args:
            - |
              if [ -d /data/db ] && [ ! -e /data/db/protocolMagicId ]; then
                echo "[cardano-node] clearing partial Mithril unpack from a previous failed attempt..."
                rm -rf /data/db
              fi
              exec /usr/local/bin/run-network
          ports: [{ containerPort: 3001 }]
          volumeMounts:
            - { name: node-data, mountPath: /data }
            - { name: node-ipc, mountPath: /ipc }
          # Deliberately no livenessProbe: compose's own healthcheck for
          # this service only ever gated readiness (depends_on/ps
          # display), never triggered a restart - a livenessProbe with any
          # practical timeout would restart (destructively interrupting) a
          # container still legitimately mid-Mithril-bootstrap, which can
          # genuinely take well over an hour on a fresh volume (confirmed
          # directly: this is exactly what happened during this rewrite's
          # own first real test run, restarting a legitimate, in-progress
          # Mithril download and forcing it to start over).
          readinessProbe:
            exec: { command: ["test", "-S", "/ipc/node.socket"] }
            initialDelaySeconds: 30
            periodSeconds: 10
      volumes:
        - { name: node-data, persistentVolumeClaim: { claimName: node-data-preprod } }
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc-preprod } }
---
$(k8s_service cardano-node 3001 3001 NodePort 30011)
EOF
    # Generous: Mithril snapshot restore (fresh volume) can take well over
    # an hour - see docs/testnet-preprod.md.
    k8s_rollout_wait cardano-node 90m
}

apply_ogmios_kupo_txsubmit() {
    if [ -n "${PREPROD_OGMIOS_URL}" ]; then
        log "PREPROD_OGMIOS_URL is set (${PREPROD_OGMIOS_URL}) - not deploying a local ogmios"
    else
        cat <<EOF | k8s_apply
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ogmios
  namespace: ${K8S_NAMESPACE}
spec:
  strategy: { type: Recreate }
  replicas: 1
  selector: { matchLabels: { app: ogmios } }
  template:
    metadata: { labels: { app: ogmios } }
    spec:
      containers:
        - name: ogmios
          image: cardanosolutions/ogmios:v${OGMIOS_VERSION}
          args: [--log-level, info, --host, "0.0.0.0", --port, "1337", --node-socket, /ipc/node.socket, --node-config, /configs/preprod/config.json]
          ports: [{ containerPort: 1337 }]
          volumeMounts:
            - { name: preprod-config, mountPath: /configs, readOnly: true }
            - { name: node-ipc, mountPath: /ipc }
          readinessProbe:
            tcpSocket: { port: 1337 }
            initialDelaySeconds: 10
            periodSeconds: 5
      volumes:
        - { name: preprod-config, persistentVolumeClaim: { claimName: preprod-config } }
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc-preprod } }
---
$(k8s_service ogmios 1337 1337 NodePort 30347)
EOF
        k8s_rollout_wait ogmios 2m
    fi

    if [ -n "${PREPROD_KUPO_URL}" ]; then
        log "PREPROD_KUPO_URL is set (${PREPROD_KUPO_URL}) - not deploying a local kupo"
    else
        cat <<EOF | k8s_apply
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kupo
  namespace: ${K8S_NAMESPACE}
spec:
  strategy: { type: Recreate }
  replicas: 1
  selector: { matchLabels: { app: kupo } }
  template:
    metadata: { labels: { app: kupo } }
    spec:
      containers:
        - name: kupo
          image: cardanosolutions/kupo:${KUPO_VERSION}
          # Indexing preprod from origin would mean walking its entire
          # history - vpn-indexer's own default IntersectSlot/IntersectHash
          # (internal/config/config.go) is exactly "the block before the
          # reference token/script this deployment uses first appears
          # on-chain", the correct, much cheaper starting point.
          args: [--node-socket, /ipc/node.socket, --host, "0.0.0.0", --port, "1442", --node-config, /configs/preprod/config.json, --match, "*", --since, "107209181.80f5d844230e01d46485495eba8e66486d5264f7d9506abfadbf178fae5b4fdc", --workdir, /db]
          ports: [{ containerPort: 1442 }]
          volumeMounts:
            - { name: preprod-config, mountPath: /configs, readOnly: true }
            - { name: node-ipc, mountPath: /ipc }
            - { name: kupo-db, mountPath: /db }
      volumes:
        - { name: preprod-config, persistentVolumeClaim: { claimName: preprod-config } }
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc-preprod } }
        - { name: kupo-db, persistentVolumeClaim: { claimName: kupo-db-preprod } }
---
$(k8s_service kupo 1442 1442 NodePort 30452)
EOF
    fi

    if [ -n "${PREPROD_SUBMIT_URL}" ]; then
        log "PREPROD_SUBMIT_URL is set (${PREPROD_SUBMIT_URL}) - not deploying a local tx-submit-api"
    else
        cat <<EOF | k8s_apply
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tx-submit-api
  namespace: ${K8S_NAMESPACE}
spec:
  strategy: { type: Recreate }
  replicas: 1
  selector: { matchLabels: { app: tx-submit-api } }
  template:
    metadata: { labels: { app: tx-submit-api } }
    spec:
      containers:
        - name: tx-submit-api
          image: ghcr.io/blinklabs-io/tx-submit-api:${TX_SUBMIT_API_VERSION}
          env:
            - { name: CARDANO_NETWORK, value: "" }
            - { name: CARDANO_NODE_NETWORK_MAGIC, value: "1" }
            - { name: CARDANO_NODE_SOCKET_PATH, value: /ipc/node.socket }
          ports: [{ containerPort: 8090 }]
          volumeMounts:
            - { name: node-ipc, mountPath: /ipc }
      volumes:
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc-preprod } }
---
$(k8s_service tx-submit-api 8090 8090 NodePort 30091)
EOF
    fi
}

apply_minio() {
    cat <<EOF | k8s_apply
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minio
  namespace: ${K8S_NAMESPACE}
spec:
  strategy: { type: Recreate }
  replicas: 1
  selector: { matchLabels: { app: minio } }
  template:
    metadata: { labels: { app: minio } }
    spec:
      containers:
        - name: minio
          image: minio/minio:RELEASE.2025-04-08T15-41-24Z
          args: [server, /data, --console-address, ":9001"]
          env:
            - { name: MINIO_ROOT_USER, value: testuser }
            - { name: MINIO_ROOT_PASSWORD, value: testpassword }
          ports: [{ containerPort: 9000 }]
          volumeMounts:
            - { name: minio-data, mountPath: /data }
      volumes:
        - { name: minio-data, persistentVolumeClaim: { claimName: minio-data-preprod } }
---
$(k8s_service minio 9000 9000 ClusterIP)
EOF
    kctl delete job minio-init --ignore-not-found >/dev/null
    cat <<EOF | k8s_apply
apiVersion: batch/v1
kind: Job
metadata:
  name: minio-init
  namespace: ${K8S_NAMESPACE}
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: minio-init
          image: minio/mc:RELEASE.2025-04-08T15-39-49Z
          command: ["sh", "-c"]
          args:
            - "until mc alias set local http://minio:9000 testuser testpassword; do sleep 2; done && mc mb --ignore-existing local/test-bucket"
EOF
    k8s_wait_job minio-init 3m
}

apply_wallet_setup_job() {
    local wallet_secret_args=()
    if [ -n "${PREPROD_WALLET_SKEY:-}" ]; then
        kctl create secret generic preprod-wallet-material \
            "--from-file=$(basename "${PREPROD_WALLET_SKEY}")=${PREPROD_WALLET_SKEY}" \
            --dry-run=client -o yaml | k8s_apply
        wallet_secret_args=(EXISTING_WALLET_SKEY "/existing-wallet/$(basename "${PREPROD_WALLET_SKEY}")")
    elif [ -n "${PREPROD_SEED_PHRASE_FILE:-}" ]; then
        kctl create secret generic preprod-wallet-material \
            "--from-file=$(basename "${PREPROD_SEED_PHRASE_FILE}")=${PREPROD_SEED_PHRASE_FILE}" \
            --dry-run=client -o yaml | k8s_apply
        wallet_secret_args=(SEED_PHRASE_FILE "/seed-phrase/$(basename "${PREPROD_SEED_PHRASE_FILE}")")
    fi

    kctl delete job wallet-setup --ignore-not-found >/dev/null
    cat <<EOF | k8s_apply
apiVersion: batch/v1
kind: Job
metadata:
  name: wallet-setup
  namespace: ${K8S_NAMESPACE}
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: wallet-setup
          image: vpn-preprod-wallet-setup:latest
          imagePullPolicy: Never
          command: ["bash", "/scripts/wallet-setup.sh"]
          env:
            - { name: CARDANO_NODE_SOCKET_PATH, value: /ipc/node.socket }
            - { name: TESTNET_MAGIC, value: "1" }
            - { name: CARDANO_NETWORK, value: preprod }
            - { name: OUT_DIR, value: /shared }
            - { name: FUND_WAIT_TIMEOUT_SECS, value: "${PREPROD_FUND_WAIT_TIMEOUT_SECS}" }
$(if [ "${#wallet_secret_args[@]}" -eq 2 ]; then echo "            - { name: ${wallet_secret_args[0]}, value: ${wallet_secret_args[1]} }"; fi)
          volumeMounts:
            - { name: node-ipc, mountPath: /ipc }
            - { name: shared, mountPath: /shared }
            - { name: scripts, mountPath: /scripts, readOnly: true }
$(if [ -n "${PREPROD_WALLET_SKEY:-}" ] || [ -n "${PREPROD_SEED_PHRASE_FILE:-}" ]; then
cat <<MOUNT
            - { name: wallet-material, mountPath: /existing-wallet, readOnly: true }
            - { name: wallet-material, mountPath: /seed-phrase, readOnly: true }
MOUNT
fi)
      volumes:
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc-preprod } }
        - { name: shared, persistentVolumeClaim: { claimName: shared-preprod } }
        - { name: scripts, configMap: { name: preprod-scripts, defaultMode: 0755 } }
$(if [ -n "${PREPROD_WALLET_SKEY:-}" ] || [ -n "${PREPROD_SEED_PHRASE_FILE:-}" ]; then
cat <<MOUNT
        - { name: wallet-material, secret: { secretName: preprod-wallet-material } }
MOUNT
fi)
EOF
    k8s_wait_job wallet-setup 90m
    # Bounds the Secret's etcd-at-rest exposure to the Job's own runtime,
    # matching the same "delete once consumed" discipline the old bind-
    # mount design got for free by never writing key material to any
    # daemon's persisted state at all.
    kctl delete secret preprod-wallet-material --ignore-not-found >/dev/null
}

apply_wireguard() {
    cat <<EOF | k8s_apply
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wireguard
  namespace: ${K8S_NAMESPACE}
spec:
  strategy: { type: Recreate }
  replicas: 1
  selector: { matchLabels: { app: wireguard } }
  template:
    metadata: { labels: { app: wireguard } }
    spec:
      containers:
        - name: wireguard
          image: ghcr.io/blinklabs-io/docker-wireguard:${DOCKER_WIREGUARD_VERSION}
          securityContext:
            capabilities: { add: ["NET_ADMIN"] }
          env:
            - { name: WG_ENDPOINT, value: "localhost:51820" }
            - { name: JWT_PUBLIC_KEY_FILE, value: /shared/jwt-public.pem }
          ports: [{ containerPort: 8080 }]
          volumeMounts:
            - { name: shared, mountPath: /shared, readOnly: true }
          readinessProbe:
            httpGet: { path: /health, port: 8080 }
            initialDelaySeconds: 5
            periodSeconds: 5
      volumes:
        - { name: shared, persistentVolumeClaim: { claimName: shared-preprod } }
---
$(k8s_service wireguard 8080 8080 NodePort 30181)
EOF
    k8s_rollout_wait wireguard 2m
}

vpn_indexer_common_env() {
    local protocol="$1"
    # Falls back to the in-cluster Service DNS name for whichever of
    # ogmios/kupo/tx-submit-api wasn't given an external override above -
    # apply_ogmios_kupo_txsubmit only deploys the ones without one, so
    # these two must always agree on which is which.
    local ogmios_url="${PREPROD_OGMIOS_URL:-ws://ogmios:1337}"
    local kupo_url="${PREPROD_KUPO_URL:-http://kupo:1442}"
    local submit_url="${PREPROD_SUBMIT_URL:-http://tx-submit-api:8090/api/submit/tx}"
    cat <<EOF
            - { name: SHARED_DIR, value: /shared }
            - { name: LOGGING_DEBUG, value: "true" }
            - { name: INDEXER_SOCKET_PATH, value: /ipc/node.socket }
            - { name: INDEXER_DELAY_CONFIRMATIONS, value: "0" }
            - { name: DATABASE_DIR, value: /data/.vpn-indexer }
            - { name: API_LISTEN_ADDRESS, value: "" }
            - { name: API_LISTEN_PORT, value: "8080" }
            - { name: TXBUILDER_KUPO_URL, value: "${kupo_url}" }
            - { name: TXBUILDER_OGMIOS_URL, value: "${ogmios_url}" }
            - { name: TXBUILDER_SUBMIT_URL, value: "${submit_url}" }
            - { name: TXBUILDER_TTL_OFFSET, value: "600" }
            - { name: VPN_DOMAIN, value: vpn.test }
            - { name: VPN_PROTOCOL, value: ${protocol} }
            - { name: VPN_JWT_KEY_FILE, value: /shared/jwt-private.pem }
            - { name: S3_CLIENT_BUCKET, value: test-bucket }
            - { name: S3_ENDPOINT, value: "http://minio:9000" }
            - { name: AWS_REGION, value: us-east-1 }
            - { name: AWS_ACCESS_KEY_ID, value: testuser }
            - { name: AWS_SECRET_ACCESS_KEY, value: testpassword }
EOF
    if [ "${protocol}" = wireguard ]; then
        cat <<EOF
            - { name: VPN_WG_ENDPOINT, value: "wireguard:51820" }
            - { name: VPN_WG_CONTAINER_URL, value: "http://wireguard:8080" }
EOF
    fi
}

apply_vpn_indexers() {
    # Deliberately NOT setting INDEXER_SCRIPT_ADDRESS/INDEXER_REFERENCE_
    # TOKEN/INDEXER_INTERSECT_*/TXBUILDER_PROVIDER_ADDRESS/TXBUILDER_
    # SCRIPT_REF_INPUT - vpn-indexer's own compiled-in defaults already
    # point at this exact preprod deployment (internal/config/config.go).
    cat <<EOF | k8s_apply
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vpn-indexer
  namespace: ${K8S_NAMESPACE}
spec:
  strategy: { type: Recreate }
  replicas: 1
  selector: { matchLabels: { app: vpn-indexer } }
  template:
    metadata: { labels: { app: vpn-indexer } }
    spec:
      containers:
        - name: vpn-indexer
          image: vpn-preprod-vpn-indexer:latest
          imagePullPolicy: Never
          env:
            - { name: VPN_REGION, value: "us east-1" }
$(vpn_indexer_common_env wireguard)
          ports: [{ containerPort: 8080 }]
          volumeMounts:
            - { name: node-ipc, mountPath: /ipc }
            - { name: shared, mountPath: /shared }
            - { name: data, mountPath: /data }
          readinessProbe:
            httpGet: { path: /healthcheck, port: 8080 }
            initialDelaySeconds: 10
            periodSeconds: 5
      volumes:
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc-preprod } }
        - { name: shared, persistentVolumeClaim: { claimName: shared-preprod } }
        - { name: data, persistentVolumeClaim: { claimName: indexer-data-preprod } }
---
$(k8s_service vpn-indexer 8080 8080 NodePort 30081)
EOF
    apply_vpn_indexer_openvpn
    # Generous: on top of Mithril catch-up, vpn-indexer itself has real
    # preprod history to chain-sync through from IntersectSlot to tip.
    k8s_rollout_wait vpn-indexer 90m
    k8s_rollout_wait vpn-indexer-openvpn 90m
}

# The OpenVPN-mode instance - a second vpn-indexer Deployment alongside the
# wireguard-mode one above, plus the RBAC (ServiceAccount+Role+RoleBinding)
# its CRL ConfigMap updater needs: vpn-indexer's OpenVPN code path
# unconditionally requires a real in-cluster Kubernetes API
# (rest.InClusterConfig()), which is exactly why this whole stack runs on
# k3d rather than plain Docker. Shares the node-ipc (cardano-node socket)
# and shared (wallet/fixtures) PVCs with the wireguard-mode instance, but
# gets its own dedicated indexer-data PVC.
apply_vpn_indexer_openvpn() {
    cat <<EOF | k8s_apply
apiVersion: v1
kind: ServiceAccount
metadata:
  name: vpn-indexer-openvpn
  namespace: ${K8S_NAMESPACE}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: vpn-indexer-crl-configmap
  namespace: ${K8S_NAMESPACE}
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "create", "update"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: vpn-indexer-crl-configmap
  namespace: ${K8S_NAMESPACE}
subjects:
  - kind: ServiceAccount
    name: vpn-indexer-openvpn
    namespace: ${K8S_NAMESPACE}
roleRef:
  kind: Role
  name: vpn-indexer-crl-configmap
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: vpn-indexer-ca
  namespace: ${K8S_NAMESPACE}
data:
  cert.pem: |
    -----BEGIN CERTIFICATE-----
    MIIClzCCAgCgAwIBAgIULdRPwP+Ue5oxNvgG6RjBFgEtovAwDQYJKoZIhvcNAQEL
    BQAwVzELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
    GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDEQMA4GA1UEAwwHVGVzdCBDQTAeFw0y
    NTA2MDUxODU1MTBaFw0yODEwMjExODU1MTBaMFcxCzAJBgNVBAYTAkFVMRMwEQYD
    VQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBM
    dGQxEDAOBgNVBAMMB1Rlc3QgQ0EwgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGB
    AM25vK3+qvIdsYsdRBhoVnQa5pfG8UCODD1nGcFBujtRyNCZUQdyu0pX20LhRIUm
    cTByGCOPsZxNr/kAK5mgXmOMWr/0dyyd9KHmeIFmdZCb8wGUI70XeTWIkXLYbffS
    ttwaVV+dClb27FI7Pjzm3ZUMAJ7XifVpj0diVd94l81FAgMBAAGjYDBeMB0GA1Ud
    DgQWBBRbpGrNjgwN/Jj8aLAoe+5AdtOapzAfBgNVHSMEGDAWgBRbpGrNjgwN/Jj8
    aLAoe+5AdtOapzAPBgNVHRMBAf8EBTADAQH/MAsGA1UdDwQEAwIBBjANBgkqhkiG
    9w0BAQsFAAOBgQAq+D287IeZ3R+s4beNyb0z9U4q+XmgZC2H0UtsoP+nDzvnq6EU
    X5K0OZf3nKDQPV886jBYuqpXcYdk86ylQbPQJbvSzqGTxg/WTey4BPN51ojdYEvt
    sQbsfCZK4tx5Q7FwfL9uk+tybKtEyrGKLr+JH07OwKhtQpYGoVtiD6U6nQ==
    -----END CERTIFICATE-----
  key.pem: |
    -----BEGIN PRIVATE KEY-----
    MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAM25vK3+qvIdsYsd
    RBhoVnQa5pfG8UCODD1nGcFBujtRyNCZUQdyu0pX20LhRIUmcTByGCOPsZxNr/kA
    K5mgXmOMWr/0dyyd9KHmeIFmdZCb8wGUI70XeTWIkXLYbffSttwaVV+dClb27FI7
    Pjzm3ZUMAJ7XifVpj0diVd94l81FAgMBAAECgYEArJlQO4qWUVuoQVbkcrXXEsIf
    BOfcMJT8n+eILCPA41PSb3CyEtWnXNApHQtyOWPvQv32Up+UG9bx9K635cQua0U8
    HVuJbm4GO6P+Q/I7cW8uIJPEdBKKbJwZ379F/APGBAP0RD5rJQ1Y65jP1Ii1yOsV
    +Y2ayN7q00sIjkctbAECQQDvuEERGy3uIJGP5/YFkAEGuvV/QPyXYIE7TteFhzYr
    nmU+U1qUEATBhJpGWn6AA1b4rz2PKbksap+5MfMDmGFhAkEA27J2b0P2FdOldy8u
    OI+Tx5RFuz7dcjXV59fWnbRO9d0q8MDWDckZ9oqT2yLHQ5sZ1HMkQVDlhPnPc1/s
    PBqiZQJAKjjCxReLbHCyEq2haHNnqt7NFJ/GnYby3BZT4YHiKaaZYHPf9Uoo/Ei1
    v4R62WM9M0nyRr/rjIYvIbhJfC2foQJBAL7xAUw81eEsfE/0uohACSFZda2CurYr
    ogiJJ6cS8dlv6oUqJCABG0aSNGUteeABKlbh56244HJNJ4bP5KJsR50CQEFT6XaA
    rQ0aNyVXoRZrTewWsowzPAasprQhv9qUQPy14+iO9Nttfumge+r4Z6/oqYn9Fem2
    xvIsZvJsUWLOo/c=
    -----END PRIVATE KEY-----
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vpn-indexer-openvpn
  namespace: ${K8S_NAMESPACE}
spec:
  strategy: { type: Recreate }
  replicas: 1
  selector: { matchLabels: { app: vpn-indexer-openvpn } }
  template:
    metadata: { labels: { app: vpn-indexer-openvpn } }
    spec:
      serviceAccountName: vpn-indexer-openvpn
      containers:
        - name: vpn-indexer
          image: vpn-preprod-vpn-indexer:latest
          imagePullPolicy: Never
          env:
            - { name: VPN_REGION, value: "${PREPROD_OPENVPN_REGION}" }
$(vpn_indexer_common_env openvpn)
            - { name: CRL_CONFIGMAP_NAMESPACE, value: "${K8S_NAMESPACE}" }
            - { name: CRL_CONFIGMAP_NAME, value: test-crl }
            - { name: CRL_CONFIGMAP_KEY, value: crl.pem }
            - { name: CRL_UPDATE_INTERVAL, value: 2m }
            - { name: CA_CERT_FILE, value: /etc/vpn-indexer/ca/cert.pem }
            - { name: CA_KEY_FILE, value: /etc/vpn-indexer/ca/key.pem }
          ports: [{ containerPort: 8080 }]
          volumeMounts:
            - { name: node-ipc, mountPath: /ipc }
            - { name: shared, mountPath: /shared }
            - { name: data, mountPath: /data }
            - { name: ca, mountPath: /etc/vpn-indexer/ca, readOnly: true }
          readinessProbe:
            httpGet: { path: /healthcheck, port: 8080 }
            initialDelaySeconds: 10
            periodSeconds: 5
      volumes:
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc-preprod } }
        - { name: shared, persistentVolumeClaim: { claimName: shared-preprod } }
        - { name: data, persistentVolumeClaim: { claimName: indexer-data-preprod-openvpn } }
        - { name: ca, configMap: { name: vpn-indexer-ca } }
---
$(k8s_service vpn-indexer-openvpn 8080 8080 ClusterIP)
EOF
}

apply_vpn_frontend() {
    cat <<EOF | k8s_apply
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vpn-frontend
  namespace: ${K8S_NAMESPACE}
spec:
  strategy: { type: Recreate }
  replicas: 1
  selector: { matchLabels: { app: vpn-frontend } }
  template:
    metadata: { labels: { app: vpn-frontend } }
    spec:
      containers:
        - name: vpn-frontend
          image: vpn-preprod-vpn-frontend:latest
          imagePullPolicy: Never
          env:
            - { name: API_PROXY_TARGET, value: "http://vpn-indexer:8080" }
          ports: [{ containerPort: 8080 }]
          readinessProbe:
            httpGet: { path: /, port: 8080 }
            initialDelaySeconds: 5
            periodSeconds: 5
---
$(k8s_service vpn-frontend 8080 8080 NodePort 30881)
EOF
    k8s_rollout_wait vpn-frontend 2m
}

# Writes the OpenVPN leg's fixture data into the shared PVC - a plain
# ClusterIP DNS name, known and reachable ahead of time since the e2e Job
# runs inside the same cluster/namespace (no cross-cluster NodePort/host-
# path plumbing needed, unlike the old two-cluster hybrid design this
# replaced). wallet-setup.sh itself is untouched - it doesn't know or care
# about the OpenVPN leg at all - this is a separate file
# (e2e-fixtures-openvpn.json) that e2e/fixtures/deployment.ts merges in.
write_openvpn_fixtures() {
    kctl run write-openvpn-fixtures --restart=Never --rm -i --image=alpine:3.20 \
        --overrides="$(cat <<EOF
{
  "spec": {
    "containers": [{
      "name": "write-openvpn-fixtures",
      "image": "alpine:3.20",
      "command": ["sh", "-c", "printf '%s' '{\\"region\\":\\"${PREPROD_OPENVPN_REGION}\\",\\"indexerUrl\\":\\"http://vpn-indexer-openvpn:8080\\"}' > /shared/e2e-fixtures-openvpn.json"],
      "volumeMounts": [{"name": "shared", "mountPath": "/shared"}]
    }],
    "volumes": [{"name": "shared", "persistentVolumeClaim": {"claimName": "shared-preprod"}}]
  }
}
EOF
)" >/dev/null
}

# --- top-level commands -------------------------------------------------------

bring_stack_up() {
    cluster_up
    build_and_import_images
    apply_static_resources
    apply_preprod_config_job
    apply_cardano_node
    apply_ogmios_kupo_txsubmit
    apply_minio
    apply_wallet_setup_job
    write_openvpn_fixtures
    apply_wireguard
    apply_vpn_indexers
    apply_vpn_frontend
}

cmd_up() {
    require_tools
    local wallet_path="" seed_phrase_path="" seed_phrase_value="" seed_phrase_tmpdir=""
    while [ $# -gt 0 ]; do
        case "$1" in
            --wallet) wallet_path="$2"; shift 2 ;;
            --seed-phrase) seed_phrase_path="$2"; shift 2 ;;
            --seed-phrase-value) seed_phrase_value="$2"; shift 2 ;;
            *) echo "unknown option: $1" >&2; exit 2 ;;
        esac
    done
    local given=0
    [ -n "${wallet_path}" ] && given=$((given + 1))
    [ -n "${seed_phrase_path}" ] && given=$((given + 1))
    [ -n "${seed_phrase_value}" ] && given=$((given + 1))
    if [ "${given}" -gt 1 ]; then
        echo "--wallet, --seed-phrase, and --seed-phrase-value are mutually exclusive" >&2
        exit 2
    fi

    if [ -n "${seed_phrase_value}" ]; then
        echo "WARNING: --seed-phrase-value puts your seed phrase in this shell's history and in this process's argv (visible to anything that can list processes on this machine, e.g. 'ps -ef' from another user). Prefer --seed-phrase (a file) if you can." >&2
        seed_phrase_tmpdir="$(mktemp -d)"
        chmod 700 "${seed_phrase_tmpdir}"
        printf '%s' "${seed_phrase_value}" >"${seed_phrase_tmpdir}/seed.txt"
        chmod 600 "${seed_phrase_tmpdir}/seed.txt"
        seed_phrase_path="${seed_phrase_tmpdir}/seed.txt"
        trap "rm -rf '${seed_phrase_tmpdir}'" EXIT
    fi

    # A --wallet/--seed-phrase/--seed-phrase-value given here only takes
    # effect on wallet-setup's *first* run against this cluster's shared
    # PVC - its own idempotency guard (/shared/.deployed) silently skips
    # redoing its work otherwise. Since this PVC outlives a plain `down`
    # now, warn here instead.
    if [ "${given}" -gt 0 ] && cluster_exists; then
        if k3d cluster start "${K8S_CLUSTER_NAME}" >/dev/null 2>&1 &&
            kctl run check-deployed --restart=Never --rm -i --image=alpine:3.20 \
                --overrides='{"spec":{"containers":[{"name":"check-deployed","image":"alpine:3.20","command":["test","-f","/shared/.deployed"],"volumeMounts":[{"name":"shared","mountPath":"/shared"}]}],"volumes":[{"name":"shared","persistentVolumeClaim":{"claimName":"shared-preprod"}}]}}' \
                >/dev/null 2>&1; then
            echo "NOTE: a wallet was already set up on a previous run that's still on disk - this flag will be ignored unless you 'testnet-preprod.sh down --purge' first." >&2
        fi
    fi

    if [ -n "${wallet_path}" ]; then
        if [ ! -f "${wallet_path}" ]; then
            echo "--wallet ${wallet_path}: no such file" >&2
            exit 2
        fi
        export PREPROD_WALLET_SKEY="${wallet_path}"
        echo "Reusing existing wallet signing key: ${wallet_path}" >&2
    elif [ -n "${seed_phrase_path}" ]; then
        if [ ! -f "${seed_phrase_path}" ]; then
            echo "--seed-phrase ${seed_phrase_path}: no such file" >&2
            exit 2
        fi
        export PREPROD_SEED_PHRASE_FILE="${seed_phrase_path}"
        if [ -n "${seed_phrase_value}" ]; then
            echo "Deriving wallet from the seed phrase given on the command line" >&2
        else
            echo "Deriving wallet from seed phrase: ${seed_phrase_path}" >&2
        fi
    else
        echo "No --wallet, --seed-phrase, or --seed-phrase-value given - a fresh wallet will be generated; watch the logs below for its address to fund." >&2
    fi

    bring_stack_up
    if [ -n "${seed_phrase_tmpdir}" ]; then
        rm -rf "${seed_phrase_tmpdir}"
        trap - EXIT
    fi
    echo ""
    echo "Preprod stack is up."
    echo "  Frontend:    http://localhost:${PREPROD_FRONTEND_PORT}"
    echo "  Indexer API: http://localhost:${PREPROD_INDEXER_PORT}/api"
    echo "  Logs:        docker/testnet/testnet-preprod.sh logs [service]"
    echo "  Burn a client once it's expired: docker/testnet/testnet-preprod.sh burn <clientId>"
    echo "  Tear down:   docker/testnet/testnet-preprod.sh down"
}

cmd_down() {
    require_tools
    local purge=false
    while [ $# -gt 0 ]; do
        case "$1" in
            --purge) purge=true; shift ;;
            *) echo "unknown option: $1" >&2; exit 2 ;;
        esac
    done
    cluster_down "${purge}"
    if [ "${purge}" = false ]; then
        echo "Chain data and the wallet/fixtures were kept - the next 'up' resumes from here. Use 'down --purge' to wipe everything and start over." >&2
    fi
}

cmd_logs() {
    require_tools
    if [ -n "${1:-}" ]; then
        kctl logs -f "deployment/$1" 2>/dev/null || kctl logs -f "job/$1"
    else
        k8s_dump_diagnostics
    fi
}

cmd_test() {
    require_tools
    local skip_sync_check=false
    while [ $# -gt 0 ]; do
        case "$1" in
            --skip-sync-check) skip_sync_check=true; shift ;;
            *) echo "unknown option: $1" >&2; exit 2 ;;
        esac
    done
    if ! cluster_exists || [ "$(kctl get deployment vpn-indexer -o jsonpath='{.status.conditions[?(@.type=="Available")].status}' 2>/dev/null)" != "True" ]; then
        bring_stack_up
    fi
    if [ "${skip_sync_check}" = true ]; then
        echo "--skip-sync-check given - not confirming kupo/vpn-indexer have caught up to chain tip; the e2e suite may fail with a spurious 'not enough funds'/'Internal server error' if they haven't (see docs/testnet-preprod.md)." >&2
    else
        # kupo and vpn-indexer (both regions) each run their own independent
        # chain-follower from the same fixed intersect point - none of them
        # being "up" (Running/Ready) implies any of them have actually
        # reached real chain tip yet. Skipping this on a freshly-created
        # cluster and running the suite anyway is exactly what produced a
        # real, misleading "not enough funds" failure earlier (see
        # docs/testnet-preprod.md) even though the wallet held funds -
        # kupo just hadn't indexed them yet. Skipped for kupo specifically
        # when PREPROD_KUPO_URL is set - there's no local kupo pod to
        # `kubectl exec` a health check into; confirming an external
        # kupo's own readiness is its operator's responsibility, not this
        # script's.
        if [ -z "${PREPROD_KUPO_URL}" ]; then
            k8s_wait_kupo_sync kupo
        fi
        k8s_wait_indexer_sync vpn-indexer
        k8s_wait_indexer_sync vpn-indexer-openvpn
    fi
    apply_e2e_job_and_run
}

apply_e2e_job_and_run() {
    kctl delete job e2e --ignore-not-found >/dev/null
    cat <<EOF | k8s_apply
apiVersion: batch/v1
kind: Job
metadata:
  name: e2e
  namespace: ${K8S_NAMESPACE}
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: e2e
          image: vpn-preprod-e2e:latest
          imagePullPolicy: Never
          env:
            - { name: BASE_URL, value: "http://vpn-frontend:8080" }
          volumeMounts:
            - { name: shared, mountPath: /shared, readOnly: true }
            - { name: playwright-report, mountPath: /work/playwright-report }
      volumes:
        - { name: shared, persistentVolumeClaim: { claimName: shared-preprod } }
        - name: playwright-report
          hostPath: { path: /mnt/playwright-report, type: Directory }
EOF
    local status
    # 60m, not 20m: each of the 3 chain-dependent specs (signup-flow,
    # signup-flow-dual-protocol, purchase-flow) budgets up to 11m of its
    # own (test.setTimeout, see e2e/tests/*.spec.ts) for a submitted tx to
    # actually confirm on real preprod - a real run hit ~30m across just
    # those three once. 20m was short enough that this wait would give up
    # and report a false "failed" (dumping diagnostics, exiting non-zero)
    # while the Job itself kept running and eventually finished fine
    # underneath - a misleading result, not a real failure. k8s_wait_job
    # (not a bare `kctl wait --for=condition=complete`) matters here too:
    # the bare form never returns early on a Job that fails outright, so a
    # real e2e test failure would otherwise burn the entire 60m for
    # nothing - see k8s_wait_job's own comment in k8s-lib.sh.
    if k8s_wait_job e2e 60m; then
        status=0
    else
        status=1
    fi
    kctl logs job/e2e --all-containers --tail=-1
    echo "" >&2
    echo "Stack left running for manual follow-up - tear down explicitly with 'testnet-preprod.sh down' when done." >&2
    exit "${status}"
}

cmd_burn() {
    require_tools
    local client_id="${1:-}"
    if [ -z "${client_id}" ]; then
        echo "usage: $0 burn <clientId>" >&2
        exit 2
    fi
    kctl delete job burn --ignore-not-found >/dev/null
    cat <<EOF | k8s_apply
apiVersion: batch/v1
kind: Job
metadata:
  name: burn
  namespace: ${K8S_NAMESPACE}
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: burn
          image: ghcr.io/blinklabs-io/cardano-node:11.0.1
          command: ["bash", "/scripts/burn.sh"]
          env:
            - { name: CARDANO_NODE_SOCKET_PATH, value: /ipc/node.socket }
            - { name: TESTNET_MAGIC, value: "1" }
            - { name: SHARED_DIR, value: /shared }
            - { name: CLIENT_ID, value: "${client_id}" }
          volumeMounts:
            - { name: node-ipc, mountPath: /ipc }
            - { name: shared, mountPath: /shared }
            - { name: scripts, mountPath: /scripts, readOnly: true }
      volumes:
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc-preprod } }
        - { name: shared, persistentVolumeClaim: { claimName: shared-preprod } }
        - { name: scripts, configMap: { name: preprod-scripts, defaultMode: 0755 } }
EOF
    local status
    if kctl wait --for=condition=complete job/burn --timeout=5m 2>/dev/null; then
        status=0
    else
        status=1
    fi
    kctl logs job/burn
    exit "${status}"
}

case "${1:-}" in
    up) shift; cmd_up "$@" ;;
    down) shift; cmd_down "$@" ;;
    logs) shift; cmd_logs "$@" ;;
    test) shift; cmd_test "$@" ;;
    burn) shift; cmd_burn "$@" ;;
    *)
        echo "usage: $0 {up [--wallet /path/to/some.skey | --seed-phrase /path/to/seed.txt | --seed-phrase-value \"word1 word2 ...\"]|down [--purge]|logs [service]|test [--skip-sync-check]|burn <clientId>}" >&2
        exit 2
        ;;
esac
