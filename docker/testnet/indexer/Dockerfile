# Builds vpn-indexer from source (mirrors vpn-indexer's own Dockerfile
# build stage) and wraps it with a startup script (entrypoint.sh) that
# waits for the contracts-deploy Job to publish the addresses/policy IDs
# it needs - a Kubernetes Job completing only guarantees that container
# finished; the values it wrote still need to be sourced into vpn-indexer's
# environment before exec'ing the binary.
#
# The source itself comes from a named build context pointing at the
# vpn-indexer repo (`--build-context vpn-indexer-src=...`, see testnet.sh's/
# testnet-preprod.sh's own build_and_import_images, pinned to a git ref)
# rather than a local checkout, so this runs against current source with
# nothing but Docker installed.
FROM ghcr.io/blinklabs-io/go:1.26.3-1 AS build
WORKDIR /code
COPY --from=vpn-indexer-src go.mod go.sum ./
RUN go mod download
COPY --from=vpn-indexer-src . .
RUN make build

# vpn-indexer's own Dockerfile ships this on chainguard's distroless
# glibc-dynamic image, which has no shell; alpine (still tiny) replaces it
# here so entrypoint.sh has something to run in.
FROM alpine:3.20
RUN apk add --no-cache ca-certificates curl jq
COPY --from=build /code/vpn-indexer /bin/vpn-indexer
COPY --chmod=0755 entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
