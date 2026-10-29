#!/usr/bin/env python3
# Copyright 2026 The Lynx Authors. All rights reserved.
# Licensed under the Apache License Version 2.0 that can be found in the
# LICENSE file in the root directory of this source tree.
"""Lynx TestBench fixture tool: decode, encode, and summarize fixture files."""

import argparse
import base64
import json
import sys
import zlib
from pathlib import Path
from urllib.request import urlopen
from urllib.error import URLError

def fetch_data(source: str) -> bytes:
    if source.startswith("http://") or source.startswith("https://"):
        try:
            with urlopen(source) as resp:
                return resp.read()
        except URLError as e:
            print(f"Error fetching URL: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        return Path(source).read_bytes()


def decode_fixture(data: bytes) -> dict:
    decoded = base64.b64decode(data)
    decompressed = zlib.decompress(decoded)
    return json.loads(decompressed)


def encode_fixture(obj: dict) -> bytes:
    raw = json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    compressed = zlib.compress(raw)
    return base64.b64encode(compressed)


def cmd_decode(args):
    data = fetch_data(args.source)
    fixture = decode_fixture(data)
    output = json.dumps(fixture, ensure_ascii=False, indent=2)
    if args.output:
        Path(args.output).write_text(output, encoding="utf-8")
        print(f"Decoded to {args.output} ({len(output)} bytes)")
    else:
        print(output)


def cmd_encode(args):
    source_path = Path(args.source)
    obj = json.loads(source_path.read_text(encoding="utf-8"))
    encoded = encode_fixture(obj)
    if args.output:
        Path(args.output).write_bytes(encoded)
        print(f"Encoded to {args.output} ({len(encoded)} bytes)")
    else:
        sys.stdout.buffer.write(encoded)


def cmd_summary(args):
    data = fetch_data(args.source)
    fixture = decode_fixture(data)

    print("=== TestBench Fixture Summary ===\n")

    print(f"Top-level keys: {list(fixture.keys())}\n")

    if "Config" in fixture:
        config = fixture["Config"]
        print(f"Config:")
        print(f"  Screen: {config.get('screenWidth', '?')} x {config.get('screenHeight', '?')}")
        print(f"  JSB Settings: {config.get('jsbSettings', {})}")
        print()

    if "Action List" in fixture:
        actions = fixture["Action List"]
        fn_names = {}
        for a in actions:
            fn = a.get("Function Name", "unknown")
            fn_names[fn] = fn_names.get(fn, 0) + 1
        print(f"Action List: {len(actions)} entries")
        for fn, count in sorted(fn_names.items(), key=lambda x: -x[1]):
            print(f"  {fn}: {count}")
        print()

    if "Invoked Method Data" in fixture:
        methods = fixture["Invoked Method Data"]
        module_names = {}
        for m in methods:
            mod = m.get("Module Name", "unknown")
            module_names[mod] = module_names.get(mod, 0) + 1
        print(f"Invoked Method Data: {len(methods)} entries")
        for mod, count in sorted(module_names.items(), key=lambda x: -x[1]):
            print(f"  {mod}: {count}")
        print()

    if "Callback" in fixture:
        print(f"Callback: {len(fixture['Callback'])} entries")
        print()

    if "Component List" in fixture:
        components = fixture["Component List"]
        names = [c.get("name", c.get("Name", "?")) if isinstance(c, dict) else str(c) for c in components]
        print(f"Component List: {names}")
        print()


def cmd_roundtrip(args):
    print(f"1. Reading fixture from {args.source} ...")
    data = fetch_data(args.source)
    fixture = decode_fixture(data)

    decoded_path = Path(args.workdir) / "decoded.json"
    decoded_path.write_text(json.dumps(fixture, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"2. Decoded to {decoded_path} ({decoded_path.stat().st_size} bytes)")
    print(f"   Edit this file, then re-run with: encode {decoded_path} -o encoded.fixture")


def main():
    parser = argparse.ArgumentParser(description="Lynx TestBench fixture tool")
    sub = parser.add_subparsers(dest="command", required=True)

    p_decode = sub.add_parser("decode", help="Decode a fixture to JSON")
    p_decode.add_argument("source", help="URL or file path of encoded fixture")
    p_decode.add_argument("-o", "--output", help="Output file path (stdout if omitted)")
    p_decode.set_defaults(func=cmd_decode)

    p_encode = sub.add_parser("encode", help="Encode JSON back to fixture format")
    p_encode.add_argument("source", help="Path to JSON file")
    p_encode.add_argument("-o", "--output", help="Output file path (stdout if omitted)")
    p_encode.set_defaults(func=cmd_encode)

    p_summary = sub.add_parser("summary", help="Show fixture summary")
    p_summary.add_argument("source", help="URL or file path of encoded fixture")
    p_summary.set_defaults(func=cmd_summary)

    p_roundtrip = sub.add_parser("roundtrip", help="Read and decode for editing (convenience)")
    p_roundtrip.add_argument("source", help="URL or file path of encoded fixture")
    p_roundtrip.add_argument("--workdir", default=".", help="Working directory for decoded file")
    p_roundtrip.set_defaults(func=cmd_roundtrip)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
