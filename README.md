# stash-configs

用于集中维护 Stash 的覆写、脚本与规则配置，方便直接订阅和后续迭代。

## 目录

- `overrides/`：Stash 覆写配置（`.stoverride`）
- `scripts/`：独立脚本或脚本说明
- `rules/`：规则与规则集
- `docs/`：使用说明与测试记录
- `quantumult/`：原 Quantumult X 去广告上游归档，供后续比对与同步

## 当前配置

### ChatGPT 出口 IP 检测

显示 ChatGPT 实际路由出口的 IP、地区、ASN/运营商及住宅网络判断，并识别常见机房、VPN、代理和 Tor 标记。

- 配置文件：[`overrides/chatgpt-ip-check.stoverride`](overrides/chatgpt-ip-check.stoverride)
- 使用说明：[`docs/chatgpt-ip-check.md`](docs/chatgpt-ip-check.md)
- Stash 覆写链接：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/chatgpt-ip-check.stoverride
```

### Shiina AdBlock Ultra（综合版）

面向直接订阅的广覆盖综合去广告覆写。基于公开 Ultra 规则进行脚本源去重、失效修复，并整合本仓库的 BiliBili ADBlock Lite。仓库会定时检查所有远程脚本依赖。

`v1.2.0` 在仓库镜像的国内轻量 DNS 广告规则基础上，选择性补入 StartUpAds 中接口明确的开屏广告规则。B 站加入旧 Quantumult X 配置中的 1080P/高码率账户能力，但仍不接管评论、详情、相关推荐、播放或 gRPC 链路。

- 配置文件：[`overrides/shiina-adblock-ultra.stoverride`](overrides/shiina-adblock-ultra.stoverride)
- 使用与维护说明：[`docs/shiina-adblock-ultra.md`](docs/shiina-adblock-ultra.md)
- Stash 订阅链接：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/shiina-adblock-ultra.stoverride
```

该版本已经包含 BiliBili ADBlock Lite，不要再同时启用下面的独立 B 站覆写。

### Shiina Stash Essentials（推荐）

统一订阅入口，当前包含国内轻量广告域名规则、BiliBili ADBlock Lite，以及远程依赖健康检查磁贴。

- 配置文件：[`overrides/stash-essentials.stoverride`](overrides/stash-essentials.stoverride)
- 使用说明：[`docs/stash-essentials.md`](docs/stash-essentials.md)
- 唯一推荐订阅链接：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/stash-essentials.stoverride
```

### BiliBili ADBlock Lite

轻量版哔哩哔哩去广告与界面净化覆写。

当前覆写版本为 `v0.4.0`。广告处理基于 [BiliUniverse/ADBlock](https://github.com/BiliUniverse/ADBlock) `v0.6.24`，并加入首页横幅、小程序/游戏卡片、推广卡片、首页 Tab、“我的”页面、顶部活动入口净化及旧 Quantumult X 规则的 1080P/高码率账户能力。MITM 域名保持精简，不接管备用 API 主机、gRPC 搜索、评论、弹幕、视频详情和播放地址接口。

- 配置文件：[`overrides/bilibili-adblock-lite.stoverride`](overrides/bilibili-adblock-lite.stoverride)
- 使用说明：[`docs/bilibili-adblock-lite.md`](docs/bilibili-adblock-lite.md)
- Stash 覆写链接：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/bilibili-adblock-lite.stoverride
```

## 上游与许可

本仓库中的 BiliBili ADBlock Lite 基于 [BiliUniverse/ADBlock](https://github.com/BiliUniverse/ADBlock)，统一订阅中的轻量广告域名规则来自 [217heidai/adblockfilters](https://github.com/217heidai/adblockfilters)。详见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)、[`licenses/BiliUniverse-ADBlock-LICENSE`](licenses/BiliUniverse-ADBlock-LICENSE) 和 [`licenses/217heidai-adblockfilters-LICENSE`](licenses/217heidai-adblockfilters-LICENSE)。
