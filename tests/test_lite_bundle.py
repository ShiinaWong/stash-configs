#!/usr/bin/env python3

from pathlib import Path
import sys

import yaml


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from build_shiina_adblock_lite import (  # noqa: E402
    APP_MODULES,
    DEFAULT_APPS,
    DEFAULT_MODULES,
    OPTIONAL_MODULES,
    build,
)


config = build(tuple(ROOT / path for path in DEFAULT_MODULES))
http = config["http"]
generated = yaml.safe_load(
    (ROOT / "overrides/shiina-adblock-lite.stoverride").read_text(encoding="utf-8")
)

assert config["version"] == "1.3.0"
assert generated == config
assert "rule-providers" not in config
assert config["rules"] == [
    "DOMAIN,mobads.baidu.com,REJECT",
    "DOMAIN,afd.baidu.com,REJECT",
    "DOMAIN,ma-adx.ctrip.com,REJECT",
]
assert len(http["mitm"]) <= 35
assert len(http["script"]) == 13
assert len(http["url-rewrite"]) <= 15
assert len(config["script-providers"]) == 10
assert len(http["mitm"]) == len(set(http["mitm"]))
assert len(http["url-rewrite"]) == len(set(http["url-rewrite"]))
assert len(http["mitm"]) == 33
assert len(http["url-rewrite"]) == 13
provider_urls = [provider["url"] for provider in config["script-providers"].values()]
assert len(provider_urls) == len(set(provider_urls))

serialized = yaml.safe_dump(config, allow_unicode=True)
for token in (
    "bilibili.com",
    "cainiao.com",
    "tieba.baidu.com",
    "Cainiao.Splash.Clean",
    "Tieba.Splash.Clean",
    "mobads.baidu.com",
    "afd.baidu.com",
    "api.zhihu.com",
    "real_time_launch_v2",
    "Zhihu.Feed.Clean",
    "questions",
    "featured-comment-ad",
    "guide-acs.m.taobao.com",
    "api.m.jd.com",
    "functionId=start",
    "api.pinduoduo.com",
    "cappuccino",
    "t-dsp.pinduoduo.com",
    "Ecommerce.Splash.Clean",
    "acs.m.goofish.com",
    "idlecommerce",
    "Xianyu.Feed.Clean",
    "edith.xiaohongshu.com",
    "Xiaohongshu.Ad.Clean",
    "homepage-api.smzdm.com",
    "SMZDM.Ad.Clean",
    "m.ctrip.com",
    "tripAds",
):
    assert token in serialized

for unsafe in (
    "newRnSync",
    "c/f/pb/page",
    "x/v2/reply",
    "view/detail",
    "grpc",
    "bankcomm",
    "api-tx.dsocial.xyz",
    "startup.umetrip.com",
    "rfs-fitness.rfsvr.net",
    "optimus-ads.amap.com",
    "card-service-route-plan",
    "getTimeZoneServerIpList",
    "watermark",
    "video/save",
):
    assert unsafe not in serialized

# App selection is explicit; unrelated optional bundles never enter daily Lite.
assert DEFAULT_MODULES == tuple(APP_MODULES[name] for name in DEFAULT_APPS)
assert OPTIONAL_MODULES["startup-ads"] not in DEFAULT_MODULES
assert APP_MODULES["wechat-official"] not in DEFAULT_MODULES
assert APP_MODULES["amap"] not in DEFAULT_MODULES

# Keep Core available as an explicit rollback module, but never load it by default.
core = ROOT / OPTIONAL_MODULES["core-dns"]
assert core not in tuple(ROOT / path for path in DEFAULT_MODULES)
with_core = build((core, *(ROOT / path for path in DEFAULT_MODULES)))
assert "🛡️ AdBlock.DNS.Lite" in with_core["rule-providers"]
assert with_core["rules"] == [
    "RULE-SET,🛡️ AdBlock.DNS.Lite,REJECT",
    "DOMAIN,mobads.baidu.com,REJECT",
    "DOMAIN,afd.baidu.com,REJECT",
    "DOMAIN,ma-adx.ctrip.com,REJECT",
]

print(
    "lite bundle: "
    f"{len(http['mitm'])} MITM hosts, "
    f"{len(http['script'])} scripts, "
    f"{len(http['url-rewrite'])} rewrites, "
    f"{len(config['script-providers'])} providers"
)
