# stash-configs

用于集中维护 Stash 的覆写、脚本与规则配置，方便直接订阅和后续迭代。

## 目录

- `overrides/`：Stash 覆写配置（`.stoverride`）
- `scripts/`：独立脚本或脚本说明
- `rules/`：规则与规则集
- `docs/`：使用说明与测试记录

## 当前配置

### Shiina Stash Essentials（推荐）

统一订阅入口，当前包含国内轻量广告域名规则与 BiliBili ADBlock Lite，后续实用磁贴也会继续加入同一个链接。

- 配置文件：[`overrides/stash-essentials.stoverride`](overrides/stash-essentials.stoverride)
- 使用说明：[`docs/stash-essentials.md`](docs/stash-essentials.md)
- 唯一推荐订阅链接：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/stash-essentials.stoverride
```

### BiliBili ADBlock Lite

轻量版哔哩哔哩去广告与界面净化覆写。

当前覆写版本为 `v0.3.1`。广告处理基于 [BiliUniverse/ADBlock](https://github.com/BiliUniverse/ADBlock) `v0.6.24`，并加入首页横幅、小程序/游戏卡片、推广卡片、首页 Tab、“我的”页面与顶部活动入口净化。MITM 域名收窄为首页/UI 和直播所需范围，不接管 gRPC 搜索、评论、弹幕、视频详情和播放地址接口，也不修改 VIP 或账户权益字段。

- 配置文件：[`overrides/bilibili-adblock-lite.stoverride`](overrides/bilibili-adblock-lite.stoverride)
- 使用说明：[`docs/bilibili-adblock-lite.md`](docs/bilibili-adblock-lite.md)
- Stash 覆写链接：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/bilibili-adblock-lite.stoverride
```

## 上游与许可

本仓库中的 BiliBili ADBlock Lite 基于 [BiliUniverse/ADBlock](https://github.com/BiliUniverse/ADBlock)，统一订阅中的轻量广告域名规则来自 [217heidai/adblockfilters](https://github.com/217heidai/adblockfilters)。详见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) 和 [`licenses/BiliUniverse-ADBlock-LICENSE`](licenses/BiliUniverse-ADBlock-LICENSE)。
