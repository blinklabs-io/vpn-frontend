# Runs the Playwright e2e suite against the testnet stack. Built from the
# repo root (see testnet.sh's/testnet-preprod.sh's own build_and_import_
# images) so it shares this repo's package.json/lockfile instead of
# keeping its own dependency set.
#
# The image tag must track the @playwright/test version in package.json -
# Playwright refuses to drive browsers that don't match its own version.
FROM mcr.microsoft.com/playwright:v1.62.1-jammy

WORKDIR /work
COPY package.json package-lock.json ./
RUN npm ci
COPY playwright.config.ts ./
COPY e2e ./e2e

ENTRYPOINT ["npx", "playwright", "test"]
