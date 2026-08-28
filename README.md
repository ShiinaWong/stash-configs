# stash-configs

用于集中维护 Stash 的覆写、脚本与规则配置，方便直接订阅和后续迭代。

## 目录

- `overrides/`：Stash 覆写配置（`.stoverride`）
- `scripts/`：独立脚本或脚本说明
- `rules/`：规则与规则集
- `docs/`：使用说明与测试记录
- `quantumult/`：原 Quantumult X 去广告上游归档，供后续比对与同步

## 当前配置

### Shiina AdBlock Lite（日常推荐）

按模块生成的日常稳定版，当前包含精选开屏广告、B 站、菜鸟裹裹、百度贴吧，以及知乎开屏和推荐列表显式广告净化。不加载 Ultra 中数百个未选 App 的 MITM、脚本和重写。为观察 Stash 内存压力，`v1.0.1` 暂停默认加载 Core 的 5,059 条通用 DNS 广告规则；Core 模块及规则文件仍保留，可随时恢复。

- 配置文件：[`overrides/shiina-adblock-lite.stoverride`](overrides/shiina-adblock-lite.stoverride)
- 使用与模块说明：[`docs/shiina-adblock-lite.md`](docs/shiina-adblock-lite.md)
- Stash 订阅链接：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/shiina-adblock-lite.stoverride
```

不要同时启用 Lite、Ultra 或已被 Lite 包含的独立 App 覆写。

### WeChat Official Accounts AdBlock（独立可选）

微信公众号文章广告的独立覆写。仅 MITM `mp.weixin.qq.com`，并只处理 `/mp/getappmsgad` 广告响应；不加入 Lite，方便单独观察文章兼容性和内存变化。

- 配置文件：[`overrides/wechat-official-accounts-adblock.stoverride`](overrides/wechat-official-accounts-adblock.stoverride)
- 使用说明：[`docs/wechat-official-accounts-adblock.md`](docs/wechat-official-accounts-adblock.md)
- Stash 订阅链接：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/wechat-official-accounts-adblock.stoverride
```

它可以和 Shiina AdBlock Lite 同时启用，但不保证处理微信原生小程序或第三方小程序广告。

### Shiina AdBlock Ultra（Legacy 全量版）

广覆盖规则库和兼容订阅。基于公开 Ultra 规则进行脚本源去重、失效修复，并整合本仓库的 BiliBili ADBlock Lite。它继续保留作为后续抽取 App 规则的来源，不再作为日常首选。

`v1.2.0` 在仓库镜像的国内轻量 DNS 广告规则基础上，选择性补入 StartUpAds 中接口明确的开屏广告规则。B 站加入旧 Quantumult X 配置中的 1080P/高码率账户能力，但仍不接管评论、详情、相关推荐、播放或 gRPC 链路。

- 配置文件：[`overrides/shiina-adblock-ultra.stoverride`](overrides/shiina-adblock-ultra.stoverride)
- 使用与维护说明：[`docs/shiina-adblock-ultra.md`](docs/shiina-adblock-ultra.md)
- Stash 订阅链接：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/shiina-adblock-ultra.stoverride
```

该版本已经包含 BiliBili ADBlock Lite，不要再同时启用下面的独立 B 站覆写。

### Shiina Stash Essentials（兼容保留）

旧版精简合集，包含国内轻量广告域名规则、BiliBili ADBlock Lite 和依赖健康检查磁贴。原订阅地址继续有效；新的日常去广告请使用 Shiina AdBlock Lite。

- 配置文件：[`overrides/stash-essentials.stoverride`](overrides/stash-essentials.stoverride)
- 使用说明：[`docs/stash-essentials.md`](docs/stash-essentials.md)
- 兼容订阅链接：

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
