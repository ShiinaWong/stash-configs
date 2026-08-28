#!/usr/bin/env python3

from pathlib import Path
import sys

import yaml


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from build_shiina_adblock_lite import DEFAULT_MODULES, build  # noqa: E402


config = build(tuple(ROOT / path for path in DEFAULT_MODULES))
http = config["http"]
generated = yaml.safe_load(
    (ROOT / "overrides/shiina-adblock-lite.stoverride").read_text(encoding="utf-8")
)

assert config["version"] == "1.0.3"
assert generated == config
assert "rule-providers" not in config
assert config["rules"] == [
    "DOMAIN,mobads.baidu.com,REJECT",
    "DOMAIN,afd.baidu.com,REJECT",
]
assert len(http["mitm"]) <= 35
assert len(http["script"]) == 8
assert len(http["url-rewrite"]) <= 30
assert len(config["script-providers"]) == 6
assert len(http["mitm"]) == len(set(http["mitm"]))
assert len(http["url-rewrite"]) == len(set(http["url-rewrite"]))
assert len(http["mitm"]) == 32
assert len(http["url-rewrite"]) == 26
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
):
    assert token in serialized

for unsafe in (
    "newRnSync",
    "c/f/pb/page",
    "x/v2/reply",
    "view/detail",
    "grpc",
    "bankcomm",
    "comment_v5",
):
    assert unsafe not in serialized

# Keep Core available as an explicit rollback module, but never load it by default.
core = ROOT / "overrides/modules/core.stoverride"
assert core not in tuple(ROOT / path for path in DEFAULT_MODULES)
with_core = build((core, *(ROOT / path for path in DEFAULT_MODULES)))
assert "🛡️ AdBlock.DNS.Lite" in with_core["rule-providers"]
assert with_core["rules"] == [
    "RULE-SET,🛡️ AdBlock.DNS.Lite,REJECT",
    "DOMAIN,mobads.baidu.com,REJECT",
    "DOMAIN,afd.baidu.com,REJECT",
]

print(
    "lite bundle: "
    f"{len(http['mitm'])} MITM hosts, "
    f"{len(http['script'])} scripts, "
    f"{len(http['url-rewrite'])} rewrites, "
    f"{len(config['script-providers'])} providers"
)
