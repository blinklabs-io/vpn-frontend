import { defineConfig, devices } from "@playwright/test";

// e2e suite for the ephemeral testnet stack (docker/testnet/). Not part of
// `npm test` (that's vitest, for unit tests) - run via:
//
//   docker/testnet/testnet.sh test
//
// or, against a stack you already have running some other way:
//
//   BASE_URL=http://localhost:8880 npx playwright test
export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:8880",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
