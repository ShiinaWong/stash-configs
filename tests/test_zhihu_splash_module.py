#!/usr/bin/env python3

from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "overrides/apps/zhihu.stoverride"
config = yaml.safe_load(path.read_text(encoding="utf-8"))
http = config["http"]

assert http["mitm"] == ["api.zhihu.com"]
assert len(http["url-rewrite"]) == 1
assert len(http["script"]) == 1

rule = http["url-rewrite"][0]
assert "commercial_api" in rule
assert "launch_v2|real_time_launch_v2" in rule
assert rule.endswith(" - reject-dict")

feed_rule = http["script"][0]
assert "topstory\\/recommend" in feed_rule["match"]
assert "recommend(?:_v2)?" in feed_rule["match"]
assert feed_rule["type"] == "response"
assert feed_rule["require-body"] is True
assert feed_rule["name"] in config["script-providers"]

for unrelated in ("answer", "article", "comment", "bazaar", "search"):
    assert unrelated not in rule
    assert unrelated not in feed_rule["match"]

print("zhihu conservative: splash and recommendation feed scope verified")
