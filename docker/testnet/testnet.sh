#!/usr/bin/env bash
set -euo pipefail

# One-command wrapper around the ephemeral-testnet stack. Requires Docker,
# k3d, and kubectl - see ../../docs/testnet.md. Every service (cardano-node,
# ogmios, kupo, tx-submit-api, minio, wireguard, a one-shot configurator
# Job, a one-shot contracts-deploy Job, TWO vpn-indexer instances -
# WireGuard-mode and OpenVPN-mode - vpn-frontend, and the e2e test runner)
# runs as a Kubernetes resource inside a single k3d cluster this script
# creates and tears down itself. There is no docker-compose involved.
#
# Why OpenVPN needs a real cluster, not just a container: vpn-indexer's
# OpenVPN code path unconditionally builds a CRL ConfigMap updater via
# Kubernetes client-go's rest.InClusterConfig() (internal/crl/crl.go),
# which only works running as an actual pod inside a real cluster - not
# merely reachable from one.
#
# Usage:
#   docker/testnet/testnet.sh up      # bring the stack up, wait for it to be ready
#   docker/testnet/testnet.sh down    # tear it down (deletes the k3d cluster - genesis
#                                      # is regenerated fresh on every `up`, there's
#                                      # nothing worth preserving between runs)
#   docker/testnet/testnet.sh test    # up -> run the e2e suite -> down, exit
#                                      # with the suite's exit code
#   docker/testnet/testnet.sh logs [service]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# shellcheck source=./k8s-lib.sh
. "${SCRIPT_DIR}/k8s-lib.sh"

K8S_CLUSTER_NAME=vpn-testnet
K8S_NAMESPACE=vpn-test

TESTNET_MAGIC="${TESTNET_MAGIC:-45}"
OGMIOS_VERSION="${OGMIOS_VERSION:-7.0.0}"
KUPO_VERSION="${KUPO_VERSION:-v2.12.0}"
TX_SUBMIT_API_VERSION="${TX_SUBMIT_API_VERSION:-0.22.0}"
DOCKER_WIREGUARD_VERSION="${DOCKER_WIREGUARD_VERSION:-0.1.1}"
VPN_INDEXER_REF="${VPN_INDEXER_REF:-main}"
VPN_CONTRACTS_REF="${VPN_CONTRACTS_REF:-main}"
DEVNET_OPENVPN_REGION="${DEVNET_OPENVPN_REGION:-eu west-1}"

# Host ports - unchanged defaults from the old compose file, still exposed
# the same way (curl localhost:8080/..., BASE_URL=http://localhost:8880
# npx playwright test, etc. all keep working).
DEVNET_NODE_PORT="${DEVNET_NODE_PORT:-3001}"
DEVNET_OGMIOS_PORT="${DEVNET_OGMIOS_PORT:-1337}"
DEVNET_KUPO_PORT="${DEVNET_KUPO_PORT:-1442}"
DEVNET_TX_SUBMIT_PORT="${DEVNET_TX_SUBMIT_PORT:-8090}"
DEVNET_WIREGUARD_API_PORT="${DEVNET_WIREGUARD_API_PORT:-8180}"
DEVNET_INDEXER_PORT="${DEVNET_INDEXER_PORT:-8080}"
DEVNET_FRONTEND_PORT="${DEVNET_FRONTEND_PORT:-8880}"

log() { echo "[testnet] $*" >&2; }

require_tools() {
    local tool
    for tool in docker k3d kubectl; do
        if ! command -v "${tool}" >/dev/null 2>&1; then
            echo "testnet.sh: '${tool}' is required but not found in PATH - see docs/testnet.md's prerequisites" >&2
            exit 1
        fi
    done
}

# --- cluster lifecycle -------------------------------------------------------

cluster_up() {
    log "deleting any prior '${K8S_CLUSTER_NAME}' cluster before recreating (fully ephemeral - nothing persists between runs)"
    k3d cluster delete "${K8S_CLUSTER_NAME}" >/dev/null 2>&1 || true
    k3d cluster create "${K8S_CLUSTER_NAME}" \
        -p "${DEVNET_NODE_PORT}:30301@server:0" \
        -p "${DEVNET_OGMIOS_PORT}:31337@server:0" \
        -p "${DEVNET_KUPO_PORT}:31442@server:0" \
        -p "${DEVNET_TX_SUBMIT_PORT}:30890@server:0" \
        -p "${DEVNET_WIREGUARD_API_PORT}:30818@server:0" \
        -p "${DEVNET_INDEXER_PORT}:30808@server:0" \
        -p "${DEVNET_FRONTEND_PORT}:30880@server:0" \
        -v "${REPO_ROOT}/playwright-report:/mnt/playwright-report@server:0" \
        --wait --timeout 120s
    kctl create namespace "${K8S_NAMESPACE}" --dry-run=client -o yaml | k8s_apply
}

cluster_down() {
    k3d cluster delete "${K8S_CLUSTER_NAME}" >/dev/null 2>&1 || true
}

# --- image build + import ----------------------------------------------------

build_and_import_images() {
    log "building images"
    docker build -t vpn-testnet-configurator:latest \
        "${SCRIPT_DIR}/configurator" -f "${SCRIPT_DIR}/configurator/Dockerfile.configurator"
    docker build -t vpn-testnet-contracts-deploy:latest \
        "${SCRIPT_DIR}/deployer" -f "${SCRIPT_DIR}/deployer/Dockerfile.deployer" \
        --build-context "vpn-contracts=https://github.com/blinklabs-io/vpn-contracts.git#${VPN_CONTRACTS_REF}"
    docker build -t vpn-testnet-vpn-indexer:latest \
        "${SCRIPT_DIR}/indexer" \
        --build-context "vpn-indexer-src=https://github.com/blinklabs-io/vpn-indexer.git#${VPN_INDEXER_REF}"
    docker build -t vpn-testnet-vpn-frontend:latest \
        "${REPO_ROOT}" -f "${REPO_ROOT}/Dockerfile" \
        --build-arg VITE_CARDANO_NETWORK=testnet \
        --build-arg VITE_WIREGUARD_ENABLED=true \
        --build-arg "VITE_OPENVPN_REGION=${DEVNET_OPENVPN_REGION}"
    docker build -t vpn-testnet-e2e:latest \
        "${REPO_ROOT}" -f "${SCRIPT_DIR}/e2e/Dockerfile"

    log "importing images into the cluster"
    k3d image import \
        vpn-testnet-configurator:latest \
        vpn-testnet-contracts-deploy:latest \
        vpn-testnet-vpn-indexer:latest \
        vpn-testnet-vpn-frontend:latest \
        vpn-testnet-e2e:latest \
        --cluster "${K8S_CLUSTER_NAME}"
}

# --- manifests ----------------------------------------------------------------
# One Deployment+Service (or Job) per service, applied in dependency order:
# cardano-node before anything that needs its socket, wireguard/vpn-indexer
# before vpn-frontend, and so on.

apply_static_resources() {
    {
        k8s_pvc pool-configs 200Mi
        echo "---"
        k8s_pvc node-data 2Gi
        echo "---"
        k8s_pvc node-ipc 50Mi
        echo "---"
        k8s_pvc kupo-db 500Mi
        echo "---"
        k8s_pvc minio-data 200Mi
        echo "---"
        k8s_pvc indexer-data 200Mi
        echo "---"
        k8s_pvc indexer-data-openvpn 200Mi
        echo "---"
        k8s_pvc shared 200Mi
        echo "---"
        k8s_configmap_from_file testnet-vpn-config testnet.yaml "${SCRIPT_DIR}/configurator/testnet-vpn.yaml"
    } | k8s_apply
}

apply_configurator_job() {
    cat <<EOF | k8s_apply
apiVersion: batch/v1
kind: Job
metadata:
  name: configurator
  namespace: ${K8S_NAMESPACE}
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: configurator
          image: vpn-testnet-configurator:latest
          imagePullPolicy: Never
          volumeMounts:
            - { name: testnet-vpn-config, mountPath: /testnet.yaml, subPath: testnet.yaml, readOnly: true }
            - { name: pool-configs, mountPath: /configs }
      volumes:
        - name: testnet-vpn-config
          configMap: { name: testnet-vpn-config }
        - name: pool-configs
          persistentVolumeClaim: { claimName: pool-configs }
EOF
    k8s_wait_job configurator 5m
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
            - { name: CARDANO_BLOCK_PRODUCER, value: "true" }
            - { name: RESTORE_SNAPSHOT, value: "false" }
          args:
            - run
            - --config
            - /configs/1/configs/config.json
            - --topology
            - /configs/1/configs/topology.json
            - --database-path
            - /data/db
            - --socket-path
            - /ipc/node.socket
            - --shelley-kes-key
            - /configs/1/keys/kes.skey
            - --shelley-vrf-key
            - /configs/1/keys/vrf.skey
            - --shelley-operational-certificate
            - /configs/1/keys/opcert.cert
            - --port
            - "3001"
          ports: [{ containerPort: 3001 }]
          volumeMounts:
            - { name: pool-configs, mountPath: /configs, readOnly: true }
            - { name: node-data, mountPath: /data/db }
            - { name: node-ipc, mountPath: /ipc }
          # Deliberately no livenessProbe: compose's own healthcheck for
          # this service only ever gated readiness (depends_on/ps
          # display), never triggered a restart - a livenessProbe with any
          # practical timeout would restart (destructively interrupting)
          # a container still legitimately mid-bootstrap.
          readinessProbe:
            exec: { command: ["test", "-S", "/ipc/node.socket"] }
            initialDelaySeconds: 10
            periodSeconds: 5
      volumes:
        - { name: pool-configs, persistentVolumeClaim: { claimName: pool-configs } }
        - { name: node-data, persistentVolumeClaim: { claimName: node-data } }
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc } }
---
$(k8s_service cardano-node 3001 3001 NodePort 30301)
EOF
    k8s_rollout_wait cardano-node 3m
}

apply_ogmios_kupo_txsubmit() {
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
          args: [--log-level, info, --host, "0.0.0.0", --port, "1337", --node-socket, /ipc/node.socket, --node-config, /configs/1/configs/config.json]
          ports: [{ containerPort: 1337 }]
          volumeMounts:
            - { name: pool-configs, mountPath: /configs, readOnly: true }
            - { name: node-ipc, mountPath: /ipc }
          readinessProbe:
            tcpSocket: { port: 1337 }
            initialDelaySeconds: 10
            periodSeconds: 5
      volumes:
        - { name: pool-configs, persistentVolumeClaim: { claimName: pool-configs } }
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc } }
---
$(k8s_service ogmios 1337 1337 NodePort 31337)
---
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
          args: [--node-socket, /ipc/node.socket, --host, "0.0.0.0", --port, "1442", --node-config, /configs/1/configs/config.json, --match, "*", --since, origin, --workdir, /db]
          ports: [{ containerPort: 1442 }]
          volumeMounts:
            - { name: pool-configs, mountPath: /configs, readOnly: true }
            - { name: node-ipc, mountPath: /ipc }
            - { name: kupo-db, mountPath: /db }
      volumes:
        - { name: pool-configs, persistentVolumeClaim: { claimName: pool-configs } }
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc } }
        - { name: kupo-db, persistentVolumeClaim: { claimName: kupo-db } }
---
$(k8s_service kupo 1442 1442 NodePort 31442)
---
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
            - { name: CARDANO_NODE_NETWORK_MAGIC, value: "${TESTNET_MAGIC}" }
            - { name: CARDANO_NODE_SOCKET_PATH, value: /ipc/node.socket }
          ports: [{ containerPort: 8090 }]
          volumeMounts:
            - { name: node-ipc, mountPath: /ipc }
      volumes:
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc } }
---
$(k8s_service tx-submit-api 8090 8090 NodePort 30890)
EOF
    k8s_rollout_wait ogmios 2m
    # kupo/tx-submit-api have no readinessProbe (matches compose's own lack
    # of a healthcheck for them - other services only ever depended on them
    # via condition: service_started) - apply-and-move-on, no explicit wait.
}

apply_ogmios_warmup_job() {
    cat <<'YAML_HEADER' | sed "s/\${K8S_NAMESPACE}/${K8S_NAMESPACE}/g" | k8s_apply
apiVersion: batch/v1
kind: Job
metadata:
  name: ogmios-warmup
  namespace: ${K8S_NAMESPACE}
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: ogmios-warmup
          image: curlimages/curl:8.11.1
          command: ["sh", "-c"]
          args:
            - |
              prev=""
              i=0
              while [ "$i" -lt 120 ]; do
                cur=$(curl -fsS -X POST http://ogmios:1337 \
                    -H "Content-Type: application/json" \
                    -d '{"jsonrpc":"2.0","method":"queryNetwork/genesisConfiguration","params":{"era":"shelley"}}' \
                    2>/dev/null | grep -o '"startTime":"[^"]*"')
                if [ -n "$cur" ] && [ "$cur" = "$prev" ]; then
                  echo "genesis config settled: $cur"
                  exit 0
                fi
                prev="$cur"
                i=$((i + 1))
                sleep 3
              done
              echo "genesis config never settled after $i checks"
              exit 1
YAML_HEADER
    k8s_wait_job ogmios-warmup 8m
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
        - { name: minio-data, persistentVolumeClaim: { claimName: minio-data } }
---
$(k8s_service minio 9000 9000 ClusterIP)
EOF
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

apply_contracts_deploy_job() {
    cat <<EOF | k8s_apply
apiVersion: batch/v1
kind: Job
metadata:
  name: contracts-deploy
  namespace: ${K8S_NAMESPACE}
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: contracts-deploy
          image: vpn-testnet-contracts-deploy:latest
          imagePullPolicy: Never
          env:
            - { name: TESTNET_MAGIC, value: "${TESTNET_MAGIC}" }
            - { name: CARDANO_NODE_SOCKET_PATH, value: /ipc/node.socket }
            - { name: GENESIS_DIR, value: /configs/utxo-keys }
            - { name: OUT_DIR, value: /shared }
            - { name: DEVNET_OPENVPN_REGION, value: "${DEVNET_OPENVPN_REGION}" }
          volumeMounts:
            - { name: pool-configs, mountPath: /configs, readOnly: true }
            - { name: node-ipc, mountPath: /ipc }
            - { name: shared, mountPath: /shared }
      volumes:
        - { name: pool-configs, persistentVolumeClaim: { claimName: pool-configs } }
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc } }
        - { name: shared, persistentVolumeClaim: { claimName: shared } }
EOF
    k8s_wait_job contracts-deploy 10m
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
        - { name: shared, persistentVolumeClaim: { claimName: shared } }
---
$(k8s_service wireguard 8080 8080 NodePort 30818)
EOF
    k8s_rollout_wait wireguard 2m
}

# vpn-indexer env shared between the wireguard-mode and openvpn-mode
# instances - only VPN_PROTOCOL/VPN_REGION/the port/volume actually differ
# between the two.
vpn_indexer_common_env() {
    local protocol="$1"
    cat <<EOF
            - { name: SHARED_DIR, value: /shared }
            - { name: LOGGING_DEBUG, value: "true" }
            - { name: INDEXER_SOCKET_PATH, value: /ipc/node.socket }
            - { name: INDEXER_DELAY_CONFIRMATIONS, value: "0" }
            - { name: DATABASE_DIR, value: /data/.vpn-indexer }
            - { name: API_LISTEN_ADDRESS, value: "" }
            - { name: API_LISTEN_PORT, value: "8080" }
            - { name: TXBUILDER_KUPO_URL, value: "http://kupo:1442" }
            - { name: TXBUILDER_OGMIOS_URL, value: "ws://ogmios:1337" }
            - { name: TXBUILDER_SUBMIT_URL, value: "http://tx-submit-api:8090/api/submit/tx" }
            - { name: TXBUILDER_TTL_OFFSET, value: "50" }
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
          image: vpn-testnet-vpn-indexer:latest
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
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc } }
        - { name: shared, persistentVolumeClaim: { claimName: shared } }
        - { name: data, persistentVolumeClaim: { claimName: indexer-data } }
---
$(k8s_service vpn-indexer 8080 8080 NodePort 30808)
EOF
    apply_vpn_indexer_openvpn
    k8s_rollout_wait vpn-indexer 15m
    k8s_rollout_wait vpn-indexer-openvpn 15m
}

# The OpenVPN-mode instance - a second vpn-indexer Deployment alongside the
# wireguard-mode one above, plus the RBAC (ServiceAccount+Role+RoleBinding)
# its CRL ConfigMap updater needs: vpn-indexer's OpenVPN code path
# unconditionally requires a real in-cluster Kubernetes API
# (rest.InClusterConfig()), which is exactly why this whole stack runs on
# k3d rather than plain Docker. Shares the node-ipc (cardano-node socket)
# and shared (fixtures) PVCs with the wireguard-mode instance, but gets
# its own dedicated indexer-data PVC.
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
          image: vpn-testnet-vpn-indexer:latest
          imagePullPolicy: Never
          env:
            - { name: VPN_REGION, value: "${DEVNET_OPENVPN_REGION}" }
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
        - { name: node-ipc, persistentVolumeClaim: { claimName: node-ipc } }
        - { name: shared, persistentVolumeClaim: { claimName: shared } }
        - { name: data, persistentVolumeClaim: { claimName: indexer-data-openvpn } }
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
          image: vpn-testnet-vpn-frontend:latest
          imagePullPolicy: Never
          env:
            - { name: API_PROXY_TARGET, value: "http://vpn-indexer:8080" }
          ports: [{ containerPort: 8080 }]
          readinessProbe:
            httpGet: { path: /, port: 8080 }
            initialDelaySeconds: 5
            periodSeconds: 5
---
$(k8s_service vpn-frontend 8080 8080 NodePort 30880)
EOF
    k8s_rollout_wait vpn-frontend 2m
}

apply_e2e_job() {
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
          image: vpn-testnet-e2e:latest
          imagePullPolicy: Never
          env:
            - { name: BASE_URL, value: "http://vpn-frontend:8080" }
          volumeMounts:
            - { name: shared, mountPath: /shared, readOnly: true }
            - { name: playwright-report, mountPath: /work/playwright-report }
      volumes:
        - { name: shared, persistentVolumeClaim: { claimName: shared } }
        - name: playwright-report
          hostPath: { path: /mnt/playwright-report, type: Directory }
EOF
}

# --- wait_for_chain_maturity --------------------------------------------------
# Unchanged in spirit from the old compose-based version: building a
# transaction's TTL against a chain that hasn't yet cleared its own
# stability window can fail with a PastHorizon error. Still polls ogmios
# via its host-mapped port, from outside the cluster, exactly like before -
# that host port is preserved specifically so this needs no changes beyond
# where it's called from.
wait_for_chain_maturity() {
    local min_slot=200 slot
    echo "Waiting for the chain to advance past its safe zone (slot >= ${min_slot})..." >&2
    for _ in $(seq 1 120); do
        slot=$(curl -fsS -X POST "http://localhost:${DEVNET_OGMIOS_PORT}" \
            -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","method":"queryNetwork/tip"}' 2>/dev/null |
            grep -o '"slot":[0-9]*' | head -1 | grep -o '[0-9]*' || echo 0)
        if [ "${slot:-0}" -ge "${min_slot}" ] 2>/dev/null; then
            return 0
        fi
        sleep 5
    done
    echo "chain never reached slot ${min_slot}" >&2
    return 1
}

# --- top-level commands -------------------------------------------------------

bring_stack_up() {
    cluster_up
    build_and_import_images
    apply_static_resources
    apply_configurator_job
    apply_cardano_node
    apply_ogmios_kupo_txsubmit
    apply_ogmios_warmup_job
    apply_minio
    apply_contracts_deploy_job
    apply_wireguard
    apply_vpn_indexers
    wait_for_chain_maturity
    apply_vpn_frontend
}

cmd_up() {
    require_tools
    bring_stack_up
    echo ""
    echo "Testnet is up."
    echo "  Frontend:    http://localhost:${DEVNET_FRONTEND_PORT}"
    echo "  Indexer API: http://localhost:${DEVNET_INDEXER_PORT}/api"
    echo "  Logs:        docker/testnet/testnet.sh logs [service]"
    echo "  Tear down:   docker/testnet/testnet.sh down"
}

cmd_down() {
    require_tools
    cluster_down
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
    # `set -e` (from the top of this script) stays active the whole way
    # through - testing bring_stack_up's own call in this `if` is what lets
    # its exit status be captured instead of the script dying outright,
    # while a failure *inside* bring_stack_up (at any nesting depth) still
    # aborts that call chain immediately and propagates up correctly, so a
    # failure early in one phase can't be masked by a later phase still
    # running to completion regardless.
    if bring_stack_up; then
        ready=0
    else
        ready=$?
    fi
    status="${ready}"
    if [ "${ready}" -eq 0 ]; then
        # kupo/vpn-indexer catch-up is normally near-instant on devnet's
        # tiny freshly-genesis'd chain (unlike preprod's real, multi-hour
        # one - see testnet-preprod.sh/docs/testnet-preprod.md), so a short
        # timeout here is a fast-failing sanity check, not a real wait.
        if [ "${skip_sync_check}" = true ]; then
            echo "--skip-sync-check given - not confirming kupo/vpn-indexer have caught up to chain tip." >&2
        else
            if k8s_wait_kupo_sync kupo 300 && k8s_wait_indexer_sync vpn-indexer 300 && k8s_wait_indexer_sync vpn-indexer-openvpn 300; then
                :
            else
                status=1
            fi
        fi
    fi
    if [ "${status}" -eq 0 ]; then
        apply_e2e_job
        # k8s_wait_job (not a bare `kctl wait --for=condition=complete`):
        # that bare form only ever watches Complete becoming True and
        # never returns early when a Job instead transitions to Failed -
        # confirmed directly against a real failed Job. A failing e2e test
        # would otherwise burn the entire timeout doing nothing useful
        # before this diagnostics dump even runs - see k8s_wait_job's own
        # comment in k8s-lib.sh.
        if k8s_wait_job e2e 15m; then
            status=0
        else
            status=1
        fi
        kctl logs job/e2e --all-containers --tail=-1
    fi
    if [ "${status}" != "0" ]; then
        echo "--- diagnostics (failure) ---" >&2
        k8s_dump_diagnostics
    fi
    cluster_down
    exit "${status}"
}

case "${1:-}" in
    up) cmd_up ;;
    down) cmd_down ;;
    logs) shift; cmd_logs "$@" ;;
    test) shift; cmd_test "$@" ;;
    *)
        echo "usage: $0 {up|down|logs [service]|test [--skip-sync-check]}" >&2
        exit 2
        ;;
esac
