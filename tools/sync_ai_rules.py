#!/usr/bin/env python3
"""Merge ddgksf2013's AI rules with Shiina's conservative supplements."""

from __future__ import annotations

import argparse
import re
import tempfile
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
UPSTREAM_URL = "https://ddgksf2013.top/filter/Ai.yaml"
SUPPLEMENT = ROOT / "quantumult/ai-supplement.list"
TARGET = ROOT / "quantumult/rules/Ai-Extended.yaml"
RULE_RE = re.compile(
    r"^\s*-?\s*(DOMAIN(?:-SUFFIX|-KEYWORD|-WILDCARD)?|IP-CIDR6?|IP-ASN),\s*([^,\s]+)"
    r"(?:\s*,.*)?$",
    re.IGNORECASE,
)


def download(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "Shiina-AI-Rule-Sync/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read().decode("utf-8-sig")


def parse_rules(text: str, source: str) -> list[tuple[str, str]]:
    rules: list[tuple[str, str]] = []
    for line_number, raw_line in enumerate(text.splitlines(), 1):
        line = raw_line.strip()
        if not line or line.startswith("#") or line == "payload:":
            continue
        match = RULE_RE.match(line)
        if not match:
            raise SystemExit(f"{source}:{line_number}: unsupported rule: {raw_line}")
        rules.append((match.group(1).upper(), match.group(2).lower()))
    return rules


def upstream_updated(text: str) -> str:
    match = re.search(r"^#\s*UPDATED:\s*(.+?)\s*$", text, re.MULTILINE | re.IGNORECASE)
    return match.group(1) if match else "unknown"


def render(upstream_text: str, supplement_text: str) -> str:
    upstream = parse_rules(upstream_text, UPSTREAM_URL)
    if len(upstream) < 60:
        raise SystemExit(f"upstream unexpectedly small: {len(upstream)} rules")

    supplement = parse_rules(supplement_text, str(SUPPLEMENT.relative_to(ROOT)))
    combined: list[tuple[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for rule in upstream + supplement:
        if rule not in seen:
            combined.append(rule)
            seen.add(rule)

    required = {
        ("DOMAIN-SUFFIX", "chatgpt.com"),
        ("DOMAIN-SUFFIX", "chatgpt.site"),
        ("DOMAIN-SUFFIX", "claude.ai"),
        ("DOMAIN-SUFFIX", "gemini.google"),
        ("DOMAIN-SUFFIX", "githubcopilot.com"),
    }
    missing = sorted(required - seen)
    if missing:
        raise SystemExit(f"required AI rules are missing: {missing}")

    header = [
        "# NAME: Shiina AI Extended Rules",
        "# UPSTREAM: https://ddgksf2013.top/filter/Ai.yaml",
        f"# UPSTREAM-UPDATED: {upstream_updated(upstream_text)}",
        "# SUPPLEMENT: quantumult/ai-supplement.list",
        "# FORMAT: Clash classical rule-provider (Quantumult X via resource parser)",
        f"# RULES: {len(combined)} ({len(upstream)} upstream + {len(combined) - len(upstream)} unique supplements)",
        "",
        "payload:",
    ]
    body = [f"  - {rule_type},{value}" for rule_type, value in combined]
    return "\n".join(header + body) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate the generated file")
    args = parser.parse_args()

    supplement_text = SUPPLEMENT.read_text(encoding="utf-8")
    if args.check:
        if not TARGET.exists():
            raise SystemExit(f"missing generated file: {TARGET.relative_to(ROOT)}")
        generated = TARGET.read_text(encoding="utf-8")
        parse_rules(generated, str(TARGET.relative_to(ROOT)))
        for required in ("chatgpt.site", "gemini.google", "githubcopilot.com"):
            if required not in generated:
                raise SystemExit(f"generated file is missing {required}")
        print(f"verified {TARGET.relative_to(ROOT)}")
        return

    upstream_text = download(UPSTREAM_URL)
    output = render(upstream_text, supplement_text)
    if TARGET.exists() and TARGET.read_text(encoding="utf-8") == output:
        print(f"unchanged {TARGET.relative_to(ROOT)}")
        return

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=TARGET.parent, delete=False) as temporary:
        temporary.write(output)
        temporary_path = Path(temporary.name)
    temporary_path.replace(TARGET)
    print(f"updated {TARGET.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
