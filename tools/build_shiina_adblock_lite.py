#!/usr/bin/env python3
"""Build the daily Shiina AdBlock Lite bundle from small audited modules."""

from __future__ import annotations

import argparse
from pathlib import Path

import yaml


VERSION = "1.3.0"
DATE = "2026-08-29"
APP_MODULES = {
    "bilibili": Path("overrides/bilibili-adblock-lite.stoverride"),
    "cainiao": Path("overrides/apps/cainiao.stoverride"),
    "tieba": Path("overrides/apps/tieba.stoverride"),
    "zhihu": Path("overrides/apps/zhihu.stoverride"),
    "taobao": Path("overrides/apps/taobao.stoverride"),
    "jd": Path("overrides/apps/jd.stoverride"),
    "pinduoduo": Path("overrides/apps/pinduoduo.stoverride"),
    "xianyu": Path("overrides/apps/xianyu.stoverride"),
    "xiaohongshu": Path("overrides/apps/xiaohongshu.stoverride"),
    "smzdm": Path("overrides/apps/smzdm.stoverride"),
    "ctrip": Path("overrides/apps/ctrip.stoverride"),
    "amap": Path("overrides/apps/amap.stoverride"),
    "wechat-official": Path("overrides/wechat-official-accounts-adblock.stoverride"),
}
APP_LABELS = {
    "bilibili": "B站",
    "cainiao": "菜鸟",
    "tieba": "贴吧",
    "zhihu": "知乎",
    "taobao": "淘宝",
    "jd": "京东",
    "pinduoduo": "拼多多",
    "xianyu": "闲鱼",
    "xiaohongshu": "小红书",
    "smzdm": "什么值得买",
    "ctrip": "携程",
    "amap": "高德地图",
    "wechat-official": "微信公众号",
}
DEFAULT_APPS = (
    "bilibili",
    "cainiao",
    "tieba",
    "zhihu",
    "taobao",
    "jd",
    "pinduoduo",
    "xianyu",
    "xiaohongshu",
    "smzdm",
    "ctrip",
)
DEFAULT_MODULES = tuple(APP_MODULES[name] for name in DEFAULT_APPS)
OPTIONAL_MODULES = {
    "startup-ads": Path("overrides/modules/startup-ads.stoverride"),
    "core-dns": Path("overrides/modules/core.stoverride"),
}


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


def app_scope(module_paths: tuple[Path, ...]) -> str:
    selected = []
    for path in module_paths:
        normalized = path.as_posix()
        match = next(
            (
                name for name, module in APP_MODULES.items()
                if normalized.endswith(module.as_posix())
            ),
            None,
        )
        if match is None:
            return "自定义模块"
        selected.append(APP_LABELS[match])
    return " + ".join(selected)


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

    scope = app_scope(module_paths)
    result = {
        "name": "🛡️ Shiina AdBlock Lite",
        "desc": (
            f"[v{VERSION}] App 按需版；{scope}精准广告规则。"
            "默认包不加载杂项开屏、Core 通用 DNS 广告规则和 Legacy Ultra。"
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
    parser.add_argument(
        "--apps",
        nargs="+",
        choices=tuple(APP_MODULES),
        help="build a custom bundle from audited App modules",
    )
    parser.add_argument("modules", nargs="*", type=Path)
    args = parser.parse_args()
    if args.apps and args.modules:
        parser.error("use either --apps or explicit module paths, not both")
    module_paths = (
        tuple(APP_MODULES[name] for name in args.apps)
        if args.apps
        else (tuple(args.modules) or DEFAULT_MODULES)
    )
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
