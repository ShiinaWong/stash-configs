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
    app_scope,
    build,
)


expected = {
    "bilibili": (3, 4, 2),
    "cainiao": (7, 2, 1),
    "tieba": (4, 1, 3),
    "zhihu": (1, 1, 1),
    "wechat-official": (1, 1, 0),
}

assert tuple(APP_MODULES) == (*DEFAULT_APPS, "wechat-official")
assert DEFAULT_MODULES == tuple(APP_MODULES[name] for name in DEFAULT_APPS)

for name, relative_path in APP_MODULES.items():
    path = ROOT / relative_path
    assert path.is_file(), f"missing App module: {name}"
    config = yaml.safe_load(path.read_text(encoding="utf-8"))
    http = config["http"]
    counts = (
        len(http.get("mitm", [])),
        len(http.get("script", [])),
        len(http.get("url-rewrite", [])),
    )
    assert counts == expected[name], (name, counts)

    # A single App should not split rules that return the same response type.
    actions = [rule.rsplit(" - ", 1)[-1] for rule in http.get("url-rewrite", [])]
    assert len(actions) == len(set(actions)), (name, actions)

    bundle = build((path,))
    assert app_scope((path,)) in bundle["desc"]

startup = yaml.safe_load(
    (ROOT / OPTIONAL_MODULES["startup-ads"]).read_text(encoding="utf-8")
)
assert len(startup["http"]["mitm"]) == 18
assert len(startup["http"]["url-rewrite"]) == 17
assert OPTIONAL_MODULES["startup-ads"] not in DEFAULT_MODULES

print("app modules: independent scopes and merged rewrite actions verified")
