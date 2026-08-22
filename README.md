# stash-configs

用于集中维护 Stash 的覆写、脚本与规则配置，方便直接订阅和后续迭代。

## 目录

- `overrides/`：Stash 覆写配置（`.stoverride`）
- `scripts/`：独立脚本或脚本说明
- `rules/`：规则与规则集
- `docs/`：使用说明与测试记录

## 当前配置

### BiliBili ADBlock Lite

轻量版哔哩哔哩去广告覆写。

基于 [BiliUniverse/ADBlock](https://github.com/BiliUniverse/ADBlock) `v0.6.24`，只保留开屏、首页信息流、搜索、番剧/影视页和直播间的常见广告处理。配置不接管评论、弹幕、视频详情和播放地址接口，以减少对视频加载与日常使用的影响。

- 配置文件：[`overrides/bilibili-adblock-lite.stoverride`](overrides/bilibili-adblock-lite.stoverride)
- 使用说明：[`docs/bilibili-adblock-lite.md`](docs/bilibili-adblock-lite.md)
- Stash 覆写链接：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/bilibili-adblock-lite.stoverride
```

## 上游与许可

本仓库中的 BiliBili ADBlock Lite 基于 [BiliUniverse/ADBlock](https://github.com/BiliUniverse/ADBlock)，上游采用 Apache License 2.0。详见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) 和 [`licenses/BiliUniverse-ADBlock-LICENSE`](licenses/BiliUniverse-ADBlock-LICENSE)。
