#!/usr/bin/env python3
"""Build Shiina AdBlock from an upstream Ultra override plus local BiliBili Lite.

The builder intentionally keeps third-party scripts remote. It deduplicates Stash
script providers by URL, replaces known dead upstream URLs, removes obsolete V2EX
and BiliBili International rewrites, then merges the repository's maintained
BiliBili Lite rules.
"""

from __future__ import annotations

import argparse
import hashlib
import re
from pathlib import Path
from urllib.parse import urlparse

import yaml


VERSION = "1.0.0"
DATE = "2026-08-24"

REPLACEMENTS = {
    "https://raw.githubusercontent.com/ZenmoFeiShi/Qx/main/Smzdm.js":
        "https://raw.githubusercontent.com/fmz200/wool_scripts/main/Scripts/smzdm/Smzdm.js",
    "https://raw.githubusercontent.com/ddgksf2013/Scripts/refs/heads/master/redbook_json.js":
        "https://raw.githubusercontent.com/fmz200/wool_scripts/main/Scripts/xiaohongshu/xiaohongshu.js",
    "https://klraw.pages.dev/kelv1n1n/script/refs/heads/main/js/goofish.js?token=209863":
        "https://raw.githubusercontent.com/ishowshu/qx/refs/heads/main/script/goofish.js",
}

REMOVED_PROVIDER_URLS = {
    "https://raw.githubusercontent.com/ddgksf2013/Scripts/refs/heads/master/v2ex.js",
}

REMOVED_MITM_HOSTS = {
    "app.bilibili.com",
    "app.biliintl.com",
    "manga.bilibili.com",
    "passport.biliintl.com",
    "*.v2ex.com",
}

# Banking and credit-card traffic is deliberately outside the scope of an
# advertising override. Intercepting these hosts can interfere with login,
# transaction, certificate, or risk-control flows.
SENSITIVE_FINANCIAL_TOKENS = (
    "abchina",
    "bankcomm",
    "ccb.com",
    "cmbchina",
    "ecitic",
    "pingan.com",
    "spdb",
)


def load_yaml(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def provider_name(url: str) -> str:
    path = urlparse(url).path.rstrip("/")
    stem = Path(path).stem or "script"
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", stem).strip("-.").lower() or "script"
    digest = hashlib.sha256(url.encode()).hexdigest()[:8]
    return f"Ultra.{slug}.{digest}"


def is_removed_rewrite(rule: str) -> bool:
    lowered = rule.lower()
    return any(
        token in lowered
        for token in ("bilibili", "biliintl", "v2ex", *SENSITIVE_FINANCIAL_TOKENS)
    )


def build(upstream: dict, bilibili: dict) -> dict:
    source_providers = upstream["script-providers"]
    old_to_url = {
        name: REPLACEMENTS.get(provider["url"], provider["url"])
        for name, provider in source_providers.items()
    }

    scripts = []
    used_urls: dict[str, dict] = {}
    for rule in upstream["http"]["script"]:
        url = old_to_url[rule["name"]]
        lowered_match = rule["match"].lower()
        if (
            url in REMOVED_PROVIDER_URLS
            or "v2ex" in lowered_match
            or any(token in lowered_match for token in SENSITIVE_FINANCIAL_TOKENS)
        ):
            continue
        rewritten = dict(rule)
        rewritten["name"] = provider_name(url)
        scripts.append(rewritten)
        used_urls.setdefault(url, {"url": url, "interval": 86400})

    providers = {
        provider_name(url): settings
        for url, settings in sorted(used_urls.items(), key=lambda item: provider_name(item[0]))
    }

    mitm = [
        host for host in upstream["http"]["mitm"]
        if host not in REMOVED_MITM_HOSTS
        and not any(token in host.lower() for token in SENSITIVE_FINANCIAL_TOKENS)
    ]
    for host in bilibili["http"]["mitm"]:
        if host not in mitm:
            mitm.append(host)

    rewrites = [
        rule for rule in upstream["http"].get("rewrite", [])
        if not is_removed_rewrite(rule)
    ]
    for rule in bilibili["http"].get("url-rewrite", []):
        if rule not in rewrites:
            rewrites.append(rule)

    scripts.extend(dict(rule) for rule in bilibili["http"]["script"])
    for name, settings in bilibili["script-providers"].items():
        providers[name] = dict(settings)

    return {
        "name": "🛡️ Shiina AdBlock Ultra",
        "desc": (
            f"[v{VERSION}] 自维护综合去广告覆写；Ultra 广覆盖规则经脚本源去重与失效修复，"
            "并整合 BiliBili ADBlock Lite。"
        ),
        "openUrl": "https://github.com/ShiinaWong/stash-configs/blob/main/docs/shiina-adblock-ultra.md",
        "author": "ShiinaWong; upstream rules by their respective authors",
        "homepage": "https://github.com/ShiinaWong/stash-configs",
        "icon": "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Advertising.png",
        "category": "🛡️ AdBlock",
        "date": DATE,
        "version": VERSION,
        "http": {
            "mitm": mitm,
            "script": scripts,
            "rewrite": rewrites,
        },
        "script-providers": providers,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--upstream", required=True, type=Path)
    parser.add_argument(
        "--bilibili",
        default=Path("overrides/bilibili-adblock-lite.stoverride"),
        type=Path,
    )
    parser.add_argument(
        "--output",
        default=Path("overrides/shiina-adblock-ultra.stoverride"),
        type=Path,
    )
    args = parser.parse_args()

    result = build(load_yaml(args.upstream), load_yaml(args.bilibili))
    banner = (
        "#!name=Shiina AdBlock Ultra\n"
        "#!desc=自维护综合去广告覆写：依赖去重、失效修复、整合 BiliBili Lite\n"
        "#!homepage=https://github.com/ShiinaWong/stash-configs\n"
        "#!author=ShiinaWong\n"
    )
    rendered = yaml.safe_dump(
        result,
        allow_unicode=True,
        sort_keys=False,
        width=4096,
        default_flow_style=False,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(banner + rendered, encoding="utf-8")


if __name__ == "__main__":
    main()
