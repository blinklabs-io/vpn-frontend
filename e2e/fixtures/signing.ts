// Node-side signing helpers for the e2e suite, built on the same
// @harmoniclabs/cardano-ledger-ts dependency the app itself uses to sign
// transactions in the browser (src/stores/walletStore.ts's
// `signWithCip30Wallet`). Used two ways:
//
//  - directly, by tests that talk to the API without going through the UI
//    (signup-flow.spec.ts): build/sign/submit a transaction with plain
//    Node calls.
//  - via mock-wallet.ts, which bridges a page-injected CIP-30 `signTx` to
//    `signWitnessSet` below through `page.exposeFunction`, for tests that
//    drive the actual wallet-connect UI.
import { readFileSync } from "node:fs";
import { PrivateKey, Tx } from "@harmoniclabs/cardano-ledger-ts";
import { XPrv } from "@harmoniclabs/bip32_ed25519";

/** A cardano-cli signing key file's JSON envelope. */
interface CardanoCliSkey {
  type: string;
  description: string;
  cborHex: string;
}

/** Either shape `Tx.signWith` accepts - see `loadSigningKey` below. */
export type SigningKey = PrivateKey | XPrv;

/**
 * Loads a cardano-cli-compatible payment signing key, plain or extended:
 *
 *  - plain (not bip32/HD) - `cardano-cli address key-gen`'s output, which
 *    is what docker/testnet/deployer/deploy.sh generates for the devnet
 *    stack's test wallets. The cborHex is a CBOR byte string wrapping the
 *    raw 32-byte seed: `5820` (bytestring, length 32) + the seed itself.
 *  - extended (bip32/HD, type "PaymentExtendedSigningKeyShelley_
 *    ed25519_bip32") - what `bursa wallet restore` derives from a seed
 *    phrase for the preprod stack's `--seed-phrase` option (docker/
 *    testnet/preprod/wallet-setup.sh). The cborHex is `5880` (bytestring,
 *    length 128) + the 64-byte extended private key, 32-byte public key,
 *    and 32-byte chain code, in that order (bursa's own layout - the
 *    public key is redundant here and not used, `XPrv.fromExtended` only
 *    needs the private key and chain code).
 */
export function loadSigningKey(skeyPath: string): SigningKey {
  const envelope: CardanoCliSkey = JSON.parse(readFileSync(skeyPath, "utf8"));
  const cborHex = envelope.cborHex;
  if (cborHex.startsWith("5820") && cborHex.length === 68) {
    return new PrivateKey(cborHex.slice(4));
  }
  if (cborHex.startsWith("5880") && cborHex.length === 260) {
    const body = Buffer.from(cborHex.slice(4), "hex");
    return XPrv.fromExtended(body.subarray(0, 64), body.subarray(96, 128));
  }
  throw new Error(
    `unexpected signing key CBOR shape (want a bare 32-byte bytestring, or a 128-byte extended key): ${cborHex}`,
  );
}

/**
 * Signs a transaction (hex-encoded CBOR) with a single key and returns the
 * CBOR of the resulting witness set - i.e. exactly what a CIP-30 wallet's
 * `signTx(cbor, true)` returns, per @harmoniclabs/cardano-ledger-ts's own
 * `Cip30LikeSignTx` contract. Not the signed transaction itself.
 */
export function signWitnessSet(txCborHex: string, key: SigningKey): string {
  const tx = Tx.fromCbor(txCborHex);
  tx.signWith(key);
  return tx.witnesses.toCbor().toString();
}

/** Signs a transaction end-to-end and returns the fully signed tx's CBOR. */
export function signTx(txCborHex: string, key: SigningKey): string {
  const tx = Tx.fromCbor(txCborHex);
  tx.signWith(key);
  return tx.toCbor().toString();
}
