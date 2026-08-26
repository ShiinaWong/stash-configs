#!/usr/bin/env python3
"""Build the daily Shiina AdBlock Lite bundle from small audited modules."""

from __future__ import annotations

import argparse
from pathlib import Path

import yaml


VERSION = "1.0.1"
DATE = "2026-08-26"
DEFAULT_MODULES = (
    Path("overrides/modules/startup-ads.stoverride"),
    Path("overrides/bilibili-adblock-lite.stoverride"),
    Path("overrides/apps/cainiao.stoverride"),
    Path("overrides/apps/tieba.stoverride"),
)


def load(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def append_unique(target: list, values: list) -> None:
    for value in values:
        if value not in target:
            target.append(value)


def merge_mapping(target: dict, source: dict, module: Path, section: str) -> None:
    for name, settings in source.items():
        if name in target and target[name] != settings:
            raise ValueError(f"{module}: conflicting {section} entry: {name}")
        target[name] = settings


def build(module_paths: tuple[Path, ...]) -> dict:
    rule_providers: dict = {}
    script_providers: dict = {}
    rules: list = []
    mitm: list = []
    scripts: list = []
    rewrites: list = []

    for path in module_paths:
        module = load(path)
        merge_mapping(rule_providers, module.get("rule-providers", {}), path, "rule provider")
        merge_mapping(script_providers, module.get("script-providers", {}), path, "script provider")
        append_unique(rules, module.get("rules", []))

        http = module.get("http", {})
        append_unique(mitm, http.get("mitm", []))
        append_unique(scripts, http.get("script", []))
        append_unique(rewrites, [*http.get("rewrite", []), *http.get("url-rewrite", [])])

    referenced = {rule["name"] for rule in scripts}
    missing = referenced - script_providers.keys()
    if missing:
        raise ValueError(f"missing script providers: {', '.join(sorted(missing))}")

    result = {
        "name": "🛡️ Shiina AdBlock Lite",
        "desc": (
            f"[v{VERSION}] 内存观察版；精选开屏 + B站 + 菜鸟 + 贴吧，"
            "暂停加载 Core 通用 DNS 广告规则和 Legacy Ultra。"
        ),
        "openUrl": "https://github.com/ShiinaWong/stash-configs/blob/main/docs/shiina-adblock-lite.md",
        "author": "ShiinaWong; upstream rules by their respective authors",
        "homepage": "https://github.com/ShiinaWong/stash-configs",
        "icon": "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Advertising.png",
        "category": "🛡️ AdBlock",
        "date": DATE,
        "version": VERSION,
        "http": {
            "mitm": mitm,
            "script": scripts,
            "url-rewrite": rewrites,
        },
        "script-providers": script_providers,
    }
    if rule_providers:
        result["rule-providers"] = rule_providers
    if rules:
        result["rules"] = rules
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("overrides/shiina-adblock-lite.stoverride"),
    )
    parser.add_argument("modules", nargs="*", type=Path)
    args = parser.parse_args()
    module_paths = tuple(args.modules) or DEFAULT_MODULES
    result = build(module_paths)
    rendered = yaml.safe_dump(
        result,
        allow_unicode=True,
        sort_keys=False,
        width=4096,
        default_flow_style=False,
    )
    banner = (
        "#!name=Shiina AdBlock Lite\n"
        "#!desc=日常稳定模块化去广告覆写\n"
        "#!homepage=https://github.com/ShiinaWong/stash-configs\n"
        "#!author=ShiinaWong\n"
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(banner + rendered, encoding="utf-8")


if __name__ == "__main__":
    main()
