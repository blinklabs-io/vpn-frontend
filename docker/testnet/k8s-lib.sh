# Shared k8s manifest-rendering + kubectl helper library, sourced (not
# executed) by testnet.sh and testnet-preprod.sh. Manifests are plain
# heredocs + shell variable substitution, no Kustomize/Helm/templating
# engine.
#
# Callers set two variables before sourcing/using any function here:
#   K8S_CLUSTER_NAME  - the k3d cluster name (e.g. vpn-testnet)
#   K8S_NAMESPACE     - the namespace everything lives in (e.g. vpn-test)
#
# Deliberately NOT a single mega-parameterized "k8s_deployment" function
# for an arbitrary pod spec: bash has no clean way to pass structured
# per-container fields (multiple env vars, volumes, probes) through
# positional/flag args without either a templating engine or a function
# with a dozen positional parameters that's harder to read than a plain
# heredoc. Instead: each caller writes its own Deployment heredoc directly
# and calls the small, genuinely mechanical helpers below (PVC/ConfigMap/
# Service/apply/wait) for the boilerplate that really is identical across
# every service.

kctl() {
    kubectl --context "k3d-${K8S_CLUSTER_NAME}" -n "${K8S_NAMESPACE}" "$@"
}

# k8s_apply - applies a manifest (or multiple, "---"-separated) read from
# stdin.
k8s_apply() {
    kctl apply -f -
}

# k8s_pvc NAME SIZE
k8s_pvc() {
    local name="$1" size="$2"
    cat <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ${name}
  namespace: ${K8S_NAMESPACE}
spec:
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: ${size}
EOF
}

# k8s_configmap_from_file NAME KEY FILEPATH - a ConfigMap with one key,
# FILEPATH's contents indented under it.
k8s_configmap_from_file() {
    local name="$1" key="$2" filepath="$3"
    cat <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${name}
  namespace: ${K8S_NAMESPACE}
data:
  ${key}: |
$(sed 's/^/    /' "${filepath}")
EOF
}

# k8s_configmap_from_dir NAME DIRPATH - a ConfigMap with one key per
# regular file directly inside DIRPATH (non-recursive), key = basename.
# Used for docker/testnet/preprod/*.sh, delivered this way instead of a
# bind mount now that there's no host filesystem in the loop.
k8s_configmap_from_dir() {
    local name="$1" dirpath="$2" f base
    cat <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${name}
  namespace: ${K8S_NAMESPACE}
data:
EOF
    for f in "${dirpath}"/*; do
        [ -f "${f}" ] || continue
        base="$(basename "${f}")"
        echo "  ${base}: |"
        sed 's/^/    /' "${f}"
    done
}

# k8s_service NAME PORT TARGET_PORT TYPE [NODE_PORT]
# selector is always {app: NAME} - every Deployment heredoc in this repo
# uses that same convention (matchLabels/labels app=NAME), so this can
# stay a plain, non-configurable selector rather than another parameter.
k8s_service() {
    local name="$1" port="$2" target_port="$3" type="$4" node_port="${5:-}"
    cat <<EOF
apiVersion: v1
kind: Service
metadata:
  name: ${name}
  namespace: ${K8S_NAMESPACE}
spec:
  type: ${type}
  selector: { app: ${name} }
  ports:
    - port: ${port}
      targetPort: ${target_port}
EOF
    if [ -n "${node_port}" ]; then
        echo "      nodePort: ${node_port}"
    fi
}

# k8s_dump_diagnostics - describe + logs (current and --previous) for
# every pod in the namespace. Called on any rollout/job wait failure, and
# from cmd_test's own failure path - the replacement for compose's
# `docker compose logs --tail 500`, now covering every workload rather
# than whatever the caller happened to ask for.
k8s_dump_diagnostics() {
    echo "--- kubectl get all -n ${K8S_NAMESPACE} ---" >&2
    kctl get deployments,jobs,pods,pvc 2>&1 >&2 || true
    local pod
    for pod in $(kctl get pods -o jsonpath='{.items[*].metadata.name}' 2>/dev/null); do
        echo "--- describe pod/${pod} ---" >&2
        kctl describe pod "${pod}" >&2 2>&1 || true
        echo "--- logs pod/${pod} (--all-containers, tail 300) ---" >&2
        kctl logs "${pod}" --all-containers --tail=300 >&2 2>&1 || true
        echo "--- logs pod/${pod} --previous (if it restarted) ---" >&2
        kctl logs "${pod}" --all-containers --previous --tail=300 >&2 2>&1 || true
    done
}

# k8s_rollout_wait NAME [TIMEOUT=5m] - waits for a Deployment to finish
# rolling out (≈ compose's `condition: service_healthy` when the
# Deployment has a readinessProbe; ≈ `condition: service_started` when it
# doesn't - a pod with no readinessProbe is considered Ready as soon as
# it's Running, same as compose's own default).
k8s_rollout_wait() {
    local name="$1" timeout="${2:-5m}"
    if ! kctl rollout status "deployment/${name}" --timeout="${timeout}"; then
        echo "[k8s-lib] deployment/${name} never became ready within ${timeout}" >&2
        k8s_dump_diagnostics
        return 1
    fi
}

# _k8s_duration_to_secs DURATION - converts a kubectl-style duration
# string ("10m", "30s", "1h", or a bare number of seconds) to seconds.
# Only the units actually used by callers in this repo (s/m/h) - not a
# general kubectl-duration parser.
_k8s_duration_to_secs() {
    local d="$1"
    case "${d}" in
        *h) echo $(( ${d%h} * 3600 )) ;;
        *m) echo $(( ${d%m} * 60 )) ;;
        *s) echo "${d%s}" ;;
        *) echo "${d}" ;;
    esac
}

# k8s_wait_job NAME [TIMEOUT=10m] - waits for a Job to complete
# (≈ compose's `condition: service_completed_successfully`). Polls the
# Job's own Complete/Failed conditions directly rather than a single
# `kubectl wait --for=condition=complete` call - confirmed directly that
# call does NOT return early when a Job instead transitions to Failed (a
# Job that had already failed 28 minutes earlier still made `kubectl wait
# --for=condition=complete --timeout=5s` time out rather than return
# immediately - it only ever watches for Complete becoming True). Without
# this, any failing Job burns the *entire* TIMEOUT doing nothing useful
# before this function's own diagnostics-on-failure logic even runs - for
# a real preprod e2e run with TIMEOUT bumped to 60m (see
# testnet-preprod.sh's apply_e2e_job_and_run) that's up to 60 wasted
# minutes reporting a failure Kubernetes already knew about instantly.
k8s_wait_job() {
    local name="$1" timeout="${2:-10m}"
    local timeout_secs deadline
    timeout_secs=$(_k8s_duration_to_secs "${timeout}")
    deadline=$(($(date +%s) + timeout_secs))
    while true; do
        local status
        status=$(kctl get "job/${name}" -o jsonpath='{.status.conditions[?(@.type=="Complete")].status}{" "}{.status.conditions[?(@.type=="Failed")].status}' 2>/dev/null)
        case "${status}" in
            "True "*) return 0 ;;
            *"True")
                echo "[k8s-lib] job/${name} failed" >&2
                k8s_dump_diagnostics
                return 1
                ;;
        esac
        if [ "$(date +%s)" -ge "${deadline}" ]; then
            echo "[k8s-lib] job/${name} never completed within ${timeout}" >&2
            k8s_dump_diagnostics
            return 1
        fi
        sleep 5
    done
}

# k8s_wait_kupo_sync NAME [TIMEOUT_SECS=14400] [TOLERANCE_SLOTS=1000] - kupo
# runs its own independent chain-follower (a separate Haskell process from
# vpn-indexer's own Go one, both starting from the same fixed --since
# intersect point but at very different, unrelated throughputs) and is the
# txbuilder's own UTxO source (TXBUILDER_KUPO_URL) - it being behind is
# exactly what produced a real "choose input UTxOs: not enough funds"
# failure even though the wallet plainly held funds on-chain (see
# docs/testnet-preprod.md). "Caught up" is inherently fuzzy since the real
# tip keeps advancing while we poll - TOLERANCE_SLOTS is how close is close
# enough, not exact equality. No jq dependency: kupo's /health response is
# small and flat enough that grep/sed extracts the two fields we need
# without adding a new required tool.
k8s_wait_kupo_sync() {
    local name="${1:-kupo}" timeout_secs="${2:-14400}" tolerance="${3:-1000}"
    local deadline=$(($(date +%s) + timeout_secs)) tick=0
    echo "[k8s-lib] waiting for deployment/${name} (kupo) to catch up to chain tip (within ${tolerance} slots)..." >&2
    while true; do
        local health checkpoint tip
        health=$(kctl exec "deployment/${name}" -- wget -qO- http://localhost:1442/health 2>/dev/null)
        checkpoint=$(echo "${health}" | grep -o '"most_recent_checkpoint":[0-9]*' | grep -o '[0-9]*$')
        tip=$(echo "${health}" | grep -o '"most_recent_node_tip":[0-9]*' | grep -o '[0-9]*$')
        if [ -n "${checkpoint}" ] && [ -n "${tip}" ] && [ $((tip - checkpoint)) -le "${tolerance}" ]; then
            echo "[k8s-lib] deployment/${name} (kupo) caught up: checkpoint ${checkpoint}, tip ${tip}" >&2
            return 0
        fi
        if [ $((tick % 4)) -eq 0 ]; then
            if [ -n "${checkpoint}" ] && [ -n "${tip}" ]; then
                echo "[k8s-lib] kupo catch-up in progress: checkpoint ${checkpoint}, tip ${tip} ($((tip - checkpoint)) slots behind)" >&2
            else
                echo "[k8s-lib] kupo /health not reachable yet, retrying..." >&2
            fi
        fi
        tick=$((tick + 1))
        if [ "$(date +%s)" -ge "${deadline}" ]; then
            echo "[k8s-lib] deployment/${name} (kupo) never caught up within ${timeout_secs}s" >&2
            k8s_dump_diagnostics
            return 1
        fi
        sleep 15
    done
}

# k8s_wait_indexer_sync NAME [TIMEOUT_SECS=14400] - vpn-indexer's own chain
# follower logs "caught up to chain tip" exactly once, the moment its own
# (kupo-independent) catch-up finishes - there's no dedicated field for
# this in its /healthcheck (that only reports process liveness), so this
# greps logs for that one-time marker instead. Deliberately NOT `--tail=N`:
# an early version of this used --tail=500, which works right after the
# transition but silently breaks once enough later log volume (steady CRL-
# ConfigMap-update lines, API request logging, etc.) pushes that one-time
# line out of the window - the check would then spin until its own
# timeout even though the indexer has been caught up the whole time. Full,
# untailed history is the only way to reliably find a marker that's only
# ever logged once per container lifetime; `kubectl logs` (no --previous)
# already scopes to the current container instance, so this still
# resolves correctly after a mid-catch-up restart (a real, self-healing
# occurrence - see docs/testnet-preprod.md's SQLITE_BUSY note) once the new
# instance re-logs its own transition.
k8s_wait_indexer_sync() {
    local name="$1" timeout_secs="${2:-14400}"
    local deadline=$(($(date +%s) + timeout_secs)) tick=0
    echo "[k8s-lib] waiting for deployment/${name} to catch up to chain tip..." >&2
    while true; do
        local logs logs_status
        logs=$(kctl logs "deployment/${name}" 2>&1)
        logs_status=$?
        if [ "${logs_status}" -eq 0 ] && echo "${logs}" | grep -q "caught up to chain tip"; then
            echo "[k8s-lib] deployment/${name} caught up to chain tip" >&2
            return 0
        fi
        if [ $((tick % 4)) -eq 0 ]; then
            if [ "${logs_status}" -ne 0 ]; then
                # Surfaced, not swallowed: a transient `kubectl logs` failure
                # (API server hiccup, etc.) looks identical to "still
                # catching up" to the caller either way (this just retries
                # next tick), but silently treating an actual error as "no
                # match yet" made a real bug (see the --tail=500 note above)
                # much harder to diagnose than it needed to be.
                echo "[k8s-lib] deployment/${name}: kubectl logs failed (will retry): ${logs}" >&2
            else
                echo "[k8s-lib] deployment/${name} still catching up..." >&2
            fi
        fi
        tick=$((tick + 1))
        if [ "$(date +%s)" -ge "${deadline}" ]; then
            echo "[k8s-lib] deployment/${name} never caught up within ${timeout_secs}s" >&2
            k8s_dump_diagnostics
            return 1
        fi
        sleep 15
    done
}
