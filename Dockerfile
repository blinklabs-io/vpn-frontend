# Builds the frontend and serves it behind an nginx reverse proxy that
# forwards /api to a vpn-indexer instance. Used by the ephemeral-testnet
# compose stack (docker/testnet/) and usable standalone:
#
#   docker build -t vpn-frontend .
#   docker run -p 8080:8080 -e API_PROXY_TARGET=http://indexer-host:8080 vpn-frontend
#
# Build-time protocol config (baked in by Vite, see .env.example):
#   --build-arg VITE_CARDANO_NETWORK=preprod
#   --build-arg VITE_WIREGUARD_ENABLED=true
#   --build-arg VITE_OPENVPN_REGION="us east-1"

# Debian-based, not alpine: vite-plugin-imagemin's native deps (mozjpeg,
# pngquant, gifsicle) ship prebuilt glibc binaries and fall back to
# compiling from source (needing autoconf/automake/etc., not present here)
# on musl.
FROM node:24 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_CARDANO_NETWORK
ARG VITE_WIREGUARD_ENABLED
ARG VITE_OPENVPN_REGION
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
# Picked up by nginx's stock docker-entrypoint.sh, which envsubst's every
# /etc/nginx/templates/*.template into /etc/nginx/conf.d/*.conf on boot.
ENV API_PROXY_TARGET=http://vpn-indexer:8080
EXPOSE 8080
