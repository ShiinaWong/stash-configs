#!/usr/bin/env python3
"""Build Shiina AdBlock from upstream Ultra, curated StartUpAds and BiliBili Lite.

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


VERSION = "1.2.2"
DATE = "2026-08-25"

CAINIAO_PROVIDER = "📦 Cainiao.Splash.Clean.v1.2.1"
CAINIAO_PROVIDER_URL = (
    "https://raw.githubusercontent.com/ShiinaWong/stash-configs/"
    "main/scripts/cainiao-splash-clean.js?v=1.2.1"
)
CAINIAO_AD_API = "mtop.cainiao.guoguo.nbnetflow.ads."
CAINIAO_HANDLED_ACTIONS = ("show", "mshow", "batch.show")

TIEBA_PROVIDER = "💬 Tieba.Splash.Clean.v1.2.2"
TIEBA_PROVIDER_URL = (
    "https://raw.githubusercontent.com/ShiinaWong/stash-configs/"
    "main/scripts/tieba-splash-clean.js?v=1.2.2"
)

# Conservative additions selected from ddgksf2013/StartUpAds. Only endpoints
# whose path explicitly denotes splash/startup/advertising inventory are kept.
# Broad RPC/body mutations, finance, entitlement and region rules stay out.
CURATED_STARTUP_MITM_HOSTS = (
    "advertise.zhiduodev.com",
    "api-tx.dsocial.xyz",
    "api.qeeniao.com",
    "api.ssp.xcultur.com",
    "api.szy.cn",
    "app.yuebuy.cn",
    "appapi.lvcchong.com",
    "lens.leoao.com",
    "list-app-m.i4.cn",
    "marki.markiapp.com",
    "misc.eol.cn",
    "ossx-link.ztehome.com.cn",
    "rfs-fitness.rfsvr.net",
    "www.biguotk.com",
    "yuudnn.lz-qs.com",
)

CURATED_STARTUP_REWRITES = (
    r"^https?:\/\/api-tx\.dsocial\.xyz\/api\/.*\/ad_ - reject-200",
    r"^https:\/\/acs\.m\.taobao\.com\/gw\/mtop\.fliggy\.crm\.screen\.(allresource|availablesplashstrategies) - reject-200",
    r"^https?:\/\/(discardrp|startup)\.umetrip\.com\/gateway\/api\/umetrip\/native - reject-200",
    r"^https?:\/\/list-app-m\.i4\.cn.*adinfo\.xhtml - reject-200",
    r"^https?:\/\/api\.qeeniao\.com\/nap\/ad - reject-200",
    r"^https?:\/\/yuudnn\.lz-qs\.com.*\/mrtb\/getAdSlotList - reject-200",
    r"^https?:\/\/lens\.leoao\.com\/lens\/.*(Advert|Advertising|queryAppBanners|popup) - reject-200",
    r"^https?:\/\/appapi\.lvcchong\.com\/appBaseApi\/.*vertisement - reject-200",
    r"^https?:\/\/marki\.markiapp\.com\/mkg\/Advertising - reject-200",
    r"^https?:\/\/app\.yuebuy\.cn\/api\/Portal\/startUp - reject-200",
    r"^https?:\/\/rfs-fitness\.rfsvr\.net\/indoor\/v\d\/app\/adverts - reject-200",
    r"^https?:\/\/api\.ssp\.xcultur\.com\/api\/v\d\/ad - reject-200",
    r"^https?:\/\/advertise\.zhiduodev\.com\/adv\/app\/getAdvSpaceInfo - reject-200",
    r"^https?:\/\/api\.szy\.cn\/appOpenServer\/ad - reject-200",
    r"^https?:\/\/ossx-link\.ztehome\.com\.cn.*\/get-ad-position-info - reject-200",
    r"^https?:\/\/www\.biguotk\.com\/api\/advertising - reject-200",
    r"^https?:\/\/misc\.eol\.cn\/js\/target\/move\/zskyApp\/Appqdkp\/.*json - reject-200",
)

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
    "app.biliapi.net",
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
        for token in ("bilibili", "biliapi", "biliintl", "v2ex", *SENSITIVE_FINANCIAL_TOKENS)
    )


def is_cainiao_overlap(value: str) -> bool:
    """Remove only rules superseded by the maintained splash handler."""
    lowered = value.lower().replace("\\", "")
    if CAINIAO_AD_API not in lowered:
        return False
    return (
        any(action in lowered for action in CAINIAO_HANDLED_ACTIONS)
        or lowered.rstrip().endswith(("ads. - reject-200", "ads. - reject"))
        or "(?!.*_home)" in lowered
    )


def is_tieba_deep_script(value: str) -> bool:
    lowered = value.lower().replace("\\", "")
    return "tieba" in lowered and "baidu.com" in lowered


def is_tieba_unsafe_rewrite(value: str) -> bool:
    lowered = value.lower().replace("\\", "")
    return "c.tieba.baidu.com" in lowered and any(
        action in lowered for action in ("newrnsync", "mlog", "(sync|")
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
            or "bilibili" in lowered_match
            or "biliapi" in lowered_match
            or any(token in lowered_match for token in SENSITIVE_FINANCIAL_TOKENS)
            or is_cainiao_overlap(lowered_match)
            or is_tieba_deep_script(lowered_match)
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
    for host in CURATED_STARTUP_MITM_HOSTS:
        if host not in mitm:
            mitm.append(host)
    for host in (
        "guide-acs4miniapp-inner.m.taobao.com",
        "netflow-mtop.cainiao.com",
        "netflow-reply-mtop.cainiao.com",
    ):
        if host not in mitm:
            mitm.append(host)

    rewrites = [
        rule for rule in upstream["http"].get("rewrite", [])
        if not is_removed_rewrite(rule)
        and not is_cainiao_overlap(rule)
        and not is_tieba_unsafe_rewrite(rule)
    ]
    for rule in bilibili["http"].get("url-rewrite", []):
        if rule not in rewrites:
            rewrites.append(rule)
    for rule in CURATED_STARTUP_REWRITES:
        if rule not in rewrites:
            rewrites.append(rule)

    scripts.extend(dict(rule) for rule in bilibili["http"]["script"])
    for name, settings in bilibili["script-providers"].items():
        providers[name] = dict(settings)

    cainiao_match = (
        r"^https?:\/\/(?:cn-acs\.m\.cainiao\.com|netflow(?:-reply)?-mtop\.cainiao\.com|"
        r"(?:guide-)?acs4miniapp-inner\.m\.taobao\.com|guide-acs\.m\.taobao\.com|acs\.m\.taobao\.com)"
        r"\/gw\/mtop\.cainiao\.guoguo\.nbnetflow\.ads\.(?:show(?:\.login)?|batch\.show(?:\.v2)?|mshow)"
    )
    scripts.extend((
        {
            "match": cainiao_match,
            "name": CAINIAO_PROVIDER,
            "type": "request",
            "require-body": False,
            "timeout": 10,
        },
        {
            "match": cainiao_match,
            "name": CAINIAO_PROVIDER,
            "type": "response",
            "require-body": True,
            "timeout": 10,
        },
    ))
    providers[CAINIAO_PROVIDER] = {
        "url": CAINIAO_PROVIDER_URL,
        "interval": 86400,
    }

    scripts.append({
        "match": r"^https?:\/\/(?:tiebac|c\.tieba)\.baidu\.com\/c\/f\/ad\/getSplashAd(?:\?.*)?$",
        "name": TIEBA_PROVIDER,
        "type": "response",
        "require-body": True,
        "timeout": 10,
    })
    providers[TIEBA_PROVIDER] = {
        "url": TIEBA_PROVIDER_URL,
        "interval": 86400,
    }

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
        "rule-providers": {
            "🛡️ AdBlock.DNS.Lite": {
                "type": "http",
                "behavior": "domain",
                "format": "yaml",
                "interval": 28800,
                "url": "https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/rules/adblockmihomolite.yaml",
            }
        },
        "rules": ["RULE-SET,🛡️ AdBlock.DNS.Lite,REJECT"],
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
