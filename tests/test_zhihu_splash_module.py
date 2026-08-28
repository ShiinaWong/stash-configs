#!/usr/bin/env python3

from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "overrides/apps/zhihu.stoverride"
config = yaml.safe_load(path.read_text(encoding="utf-8"))
http = config["http"]

assert http["mitm"] == ["api.zhihu.com"]
assert len(http["url-rewrite"]) == 3
assert len(http["script"]) == 1

rewrites = "\n".join(http["url-rewrite"])
for token in (
    "commercial_api",
    "launch_v2|real_time_launch_v2",
    "answer\\/\\d+\\/bottom-v2",
    "ad-style-service",
    "fringe\\/ad",
    "featured-comment-ad",
    "root\\/window",
    "list-headers",
):
    assert token in rewrites
assert all(rule.endswith(" - reject-dict") for rule in http["url-rewrite"])

feed_rule = http["script"][0]
assert "topstory\\/(?:recommend" in feed_rule["match"]
assert "recommend(?:_v2)?" in feed_rule["match"]
for token in ("questions", "feeds|answers", "moments_v3", "hot-lists", "next-"):
    assert token in feed_rule["match"]
assert feed_rule["type"] == "response"
assert feed_rule["require-body"] is True
assert feed_rule["name"] in config["script-providers"]

for unrelated in ("bazaar", "search", "people"):
    assert unrelated not in rewrites
    assert unrelated not in feed_rule["match"]

print("zhihu adblock: known app ad surfaces verified")
