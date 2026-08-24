#!/usr/bin/env python3
"""Mirror selected, pinned-safe upstream assets into this repository."""

from __future__ import annotations

import argparse
import hashlib
import tempfile
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ASSETS = {
    "rules/adblockmihomolite.yaml": {
        "url": "https://raw.githubusercontent.com/217heidai/adblockfilters/main/rules/adblockmihomolite.yaml",
        "minimum_size": 100_000,
        "marker": b"payload:",
    },
    "vendor/biliuniverse-adblock/request.bundle.js": {
        "url": "https://github.com/BiliUniverse/ADBlock/releases/download/v0.6.24/request.bundle.js",
        "minimum_size": 15_000,
        "marker": b"BiliBili",
        "sha256": "97d9fb226beb0b21622880be788ae16a381d6c0394d9e0f9636f75f0d7df898a",
    },
    "vendor/biliuniverse-adblock/response.bundle.js": {
        "url": "https://github.com/BiliUniverse/ADBlock/releases/download/v0.6.24/response.bundle.js",
        "minimum_size": 500_000,
        "marker": b"BiliBili",
        "sha256": "dc73776f0c0ce1f7c243b97861c3ec9bd9f919cad54cd3106f67240d81858965",
    },
}


def download(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "Shiina-Upstream-Sync/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate local mirrors without downloading")
    args = parser.parse_args()

    for relative_path, spec in ASSETS.items():
        target = ROOT / relative_path
        content = target.read_bytes() if args.check else download(str(spec["url"]))
        content = content.rstrip(b"\n") + b"\n"
        if len(content) < int(spec["minimum_size"]):
            raise SystemExit(f"{relative_path}: unexpectedly small ({len(content)} bytes)")
        if bytes(spec["marker"]) not in content:
            raise SystemExit(f"{relative_path}: expected marker is missing")

        digest = hashlib.sha256(content).hexdigest()
        expected_digest = spec.get("sha256")
        if expected_digest and digest != expected_digest:
            raise SystemExit(
                f"{relative_path}: pinned asset hash changed "
                f"(expected {expected_digest}, got {digest})"
            )
        if not args.check and (not target.exists() or target.read_bytes() != content):
            target.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as temporary:
                temporary.write(content)
                temporary_path = Path(temporary.name)
            temporary_path.replace(target)
            print(f"updated {relative_path}: sha256={digest}")
        else:
            print(f"verified {relative_path}: sha256={digest}")


if __name__ == "__main__":
    main()
