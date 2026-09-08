# vpn-frontend

VPN as a Service frontend

## Testing against real infrastructure

Besides the unit tests (`npm run test:run`), this repo can be tested
end-to-end against real `vpn-indexer` and `vpn-contracts` code on a private,
ephemeral Cardano testnet - locally with Docker, k3d, and kubectl, or in CI
(`.github/workflows/testnet-e2e.yml`):

```bash
npm run testnet:test   # up, run the e2e suite, tear down
```

See [`docs/testnet.md`](docs/testnet.md) for how it works and how to extend
the e2e suite.
