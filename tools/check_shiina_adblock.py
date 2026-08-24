#!/usr/bin/env python3
"""Validate the generated Shiina AdBlock override and optionally check URLs."""

from __future__ import annotations

import argparse
import concurrent.futures
import time
import urllib.error
import urllib.request
from pathlib import Path

import yaml


DEFAULT_CONFIG = Path("overrides/shiina-adblock-ultra.stoverride")
REMOVED_TOKENS = (
    "abchina",
    "bankcomm",
    "biliintl",
    "ccb.com",
    "cmbchina",
    "ecitic",
    "manga.bilibili.com",
    "pingan.com",
    "spdb",
    "v2ex",
)
REQUIRED_BILIBILI_HOSTS = {
    "api.live.bilibili.com",
    "api.vc.bilibili.com",
    "app.bilibili.com",
}


def load(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def validate(config: dict) -> list[str]:
    errors: list[str] = []
    http = config.get("http", {})
    scripts = http.get("script", [])
    providers = config.get("script-providers", {})
    provider_urls = [provider.get("url") for provider in providers.values()]
    rule_provider = config.get("rule-providers", {}).get("🛡️ AdBlock.DNS.Lite")

    if config.get("name") != "🛡️ Shiina AdBlock Ultra":
        errors.append("unexpected config name")
    if len(scripts) < 350:
        errors.append(f"script rule count unexpectedly low: {len(scripts)}")
    if len(http.get("rewrite", [])) < 2000:
        errors.append("rewrite rule count unexpectedly low")
    if len(providers) >= len(scripts):
        errors.append("script providers were not deduplicated")
    if len(provider_urls) != len(set(provider_urls)):
        errors.append("duplicate script provider URLs remain")
    if not rule_provider:
        errors.append("local DNS adblock provider is missing")
    elif "ShiinaWong/stash-configs/main/rules/adblockmihomolite.yaml" not in rule_provider.get("url", ""):
        errors.append("DNS adblock provider must use the repository mirror")
    if config.get("rules") != ["RULE-SET,🛡️ AdBlock.DNS.Lite,REJECT"]:
        errors.append("DNS adblock rule is missing or reordered")

    referenced = {rule.get("name") for rule in scripts}
    missing = sorted(name for name in referenced if name not in providers)
    unused = sorted(name for name in providers if name not in referenced)
    if missing:
        errors.append(f"missing providers: {', '.join(missing)}")
    if unused:
        errors.append(f"unused providers: {', '.join(unused)}")

    searchable = "\n".join(
        [*map(str, http.get("mitm", [])), *map(str, http.get("rewrite", []))]
    ).lower()
    for token in REMOVED_TOKENS:
        if token in searchable:
            errors.append(f"removed rule token is still present: {token}")

    hosts = set(http.get("mitm", []))
    if not REQUIRED_BILIBILI_HOSTS.issubset(hosts):
        errors.append("BiliBili Lite MITM hosts are incomplete")
    bili_rules = [rule for rule in scripts if "BiliBili" in str(rule.get("name"))]
    if len(bili_rules) != 4:
        errors.append(f"expected 4 BiliBili Lite script rules, found {len(bili_rules)}")

    return errors


def check_url(url: str, retries: int = 3) -> tuple[str, str]:
    last_error = "unknown error"
    for attempt in range(retries):
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "Shiina-AdBlock-Health/1.0", "Range": "bytes=0-0"},
        )
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                if 200 <= response.status < 400:
                    return url, str(response.status)
                last_error = f"HTTP {response.status}"
        except urllib.error.HTTPError as error:
            last_error = f"HTTP {error.code}"
        except Exception as error:  # Network failures need a concise CI report.
            last_error = f"{type(error).__name__}: {error}"
        if attempt + 1 < retries:
            time.sleep(2 ** attempt)
    return url, last_error


def remote_errors(config: dict) -> list[str]:
    urls = {
        provider["url"] for provider in config["script-providers"].values()
    }
    urls.update(provider["url"] for provider in config.get("rule-providers", {}).values())
    urls = sorted(urls)
    failures: list[str] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
        for url, result in executor.map(check_url, urls):
            if not result.startswith(("200", "206", "30")):
                failures.append(f"{result}\t{url}")
    return failures


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--remote", action="store_true")
    args = parser.parse_args()

    config = load(args.config)
    errors = validate(config)
    if args.remote:
        errors.extend(remote_errors(config))
    if errors:
        raise SystemExit("\n".join(errors))

    print(
        "validated: "
        f"{len(config['http']['script'])} script rules, "
        f"{len(config['http']['rewrite'])} rewrites, "
        f"{len(config['script-providers'])} unique providers"
    )


if __name__ == "__main__":
    main()
