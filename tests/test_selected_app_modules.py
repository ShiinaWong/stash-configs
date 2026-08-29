#!/usr/bin/env python3

from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]


def load(name: str) -> dict:
    path = ROOT / "overrides" / "apps" / f"{name}.stoverride"
    return yaml.safe_load(path.read_text(encoding="utf-8"))


for app in ("xianyu", "xiaohongshu", "smzdm", "ctrip", "amap"):
    assert load(app)["http"], app

xhs = yaml.safe_dump(load("xiaohongshu"), allow_unicode=True)
for forbidden in ("watermark", "download", "video/save", "live_photo/save"):
    assert forbidden not in xhs

smzdm = yaml.safe_dump(load("smzdm"), allow_unicode=True)
for forbidden in ("creator_user_center", "user-api.smzdm.com/vip", "wiki_related_modul"):
    assert forbidden not in smzdm

ctrip = yaml.safe_dump(load("ctrip"), allow_unicode=True)
assert "tripAds" in ctrip
assert "getTimeZoneServerIpList" not in ctrip
assert "mbd.baidu.com" not in ctrip

amap = yaml.safe_dump(load("amap"), allow_unicode=True)
for included in ("splash_screen", "ai_rec", "new_hotword", "optimus-ads.amap.com"):
    assert included in amap
for excluded in ("card-service-route-plan", "weather", "nearby", "promotion-web", "order_web"):
    assert excluded not in amap
assert "script-providers" not in load("amap")

print("selected app modules: pure-ad and conservative scopes verified")
