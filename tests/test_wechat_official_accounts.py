#!/usr/bin/env python3

from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "overrides/wechat-official-accounts-adblock.stoverride"
config = yaml.safe_load(path.read_text(encoding="utf-8"))
version = config["version"]
provider_name = f"💬 WeChat.Official.Accounts.Ads.Clean.v{version}"

assert f"[v{version}]" in config["desc"]
assert config["http"]["mitm"] == ["mp.weixin.qq.com"]

rules = config["http"]["script"]
assert len(rules) == 1
rule = rules[0]
assert "mp\\.weixin\\.qq\\.com\\/mp\\/getappmsgad" in rule["match"]
assert rule["type"] == "response"
assert rule["require-body"] is True
assert rule["name"] == provider_name

provider = config["script-providers"][provider_name]
assert provider["url"].endswith(f"?v={version}")

print("wechat official accounts: minimal MITM and exact endpoint verified")
