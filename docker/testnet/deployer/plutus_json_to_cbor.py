#!/usr/bin/env python3
"""Encode a Plutus Data JSON value (the same {"constructor":..,"fields":[..]}
schema cardano-cli accepts for --tx-out-inline-datum-file, and that
vpn-contracts/scripts/env.sh's generate_*_json helpers already produce) into
raw CBOR, hex-encoded.

`aiken blueprint apply` takes a validator parameter as hex-encoded CBOR
Plutus Data rather than this JSON notation, so this is the missing
conversion between the two: build the parameter with the JSON schema
already used throughout this codebase, then run it through this script.

Usage: plutus_json_to_cbor.py <file.json|->
"""

import json
import sys


def encode_head(major: int, n: int) -> bytes:
    if n < 24:
        return bytes([(major << 5) | n])
    if n < 2**8:
        return bytes([(major << 5) | 24, n])
    if n < 2**16:
        return bytes([(major << 5) | 25]) + n.to_bytes(2, "big")
    if n < 2**32:
        return bytes([(major << 5) | 26]) + n.to_bytes(4, "big")
    return bytes([(major << 5) | 27]) + n.to_bytes(8, "big")


def encode_int(n: int) -> bytes:
    return encode_head(1, -n - 1) if n < 0 else encode_head(0, n)


def encode_bytes(b: bytes) -> bytes:
    return encode_head(2, len(b)) + b


def encode_array_head(n: int) -> bytes:
    return encode_head(4, n)


def encode_tag(t: int) -> bytes:
    return encode_head(6, t)


def plutus_data(node) -> bytes:
    if "int" in node:
        return encode_int(int(node["int"]))
    if "bytes" in node:
        return encode_bytes(bytes.fromhex(node["bytes"]))
    if "list" in node:
        items = node["list"]
        return encode_array_head(len(items)) + b"".join(
            plutus_data(i) for i in items
        )
    if "map" in node:
        pairs = node["map"]
        body = b"".join(
            plutus_data(p["k"]) + plutus_data(p["v"]) for p in pairs
        )
        return encode_head(5, len(pairs)) + body
    if "constructor" in node:
        idx = int(node["constructor"])
        fields = node.get("fields", [])
        body = encode_array_head(len(fields)) + b"".join(
            plutus_data(f) for f in fields
        )
        if idx <= 6:
            return encode_tag(121 + idx) + body
        if idx <= 127:
            return encode_tag(1280 + (idx - 7)) + body
        # General constructor form: tag 102, [index, fields-array].
        return (
            encode_tag(102)
            + encode_array_head(2)
            + encode_int(idx)
            + body
        )
    raise ValueError(f"unsupported Plutus Data node: {node!r}")


def main() -> None:
    if len(sys.argv) != 2:
        print(f"usage: {sys.argv[0]} <file.json|->", file=sys.stderr)
        sys.exit(2)
    raw = sys.stdin.read() if sys.argv[1] == "-" else open(sys.argv[1]).read()
    print(plutus_data(json.loads(raw)).hex())


if __name__ == "__main__":
    main()
