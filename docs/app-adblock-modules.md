# 按 App 订阅去广告

需要精确控制内存和兼容性时，请关闭 `Shiina AdBlock Lite`，只安装实际使用的 App 模块。每个 App 只有一个覆写入口；同一 App 的 MITM、脚本、Rewrite 和规则都放在该入口中。

| App | MITM | 脚本 | Rewrite | 独立订阅地址 |
|---|---:|---:|---:|---|
| Bilibili | 3 | 4 | 2 | `https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/bilibili-adblock-lite.stoverride` |
| 菜鸟裹裹 | 7 | 2 | 1 | `https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/apps/cainiao.stoverride` |
| 百度贴吧 | 4 | 1 | 3 | `https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/apps/tieba.stoverride` |
| 知乎 | 1 | 1 | 1 | `https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/apps/zhihu.stoverride` |
| 微信公众号文章 | 1 | 1 | 0 | `https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/wechat-official-accounts-adblock.stoverride` |

## 可选合集

下面两项不是单一 App，不加入默认 Lite：

| 合集 | 内容 | 订阅地址 |
|---|---|---|
| Misc Startup Ads | 17 条来源明确但分属不同 App 的开屏/广告接口；整体启停，避免制造 17 个单规则文件 | `https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/modules/startup-ads.stoverride` |
| Core DNS | 5,059 条通用广告域名；覆盖广、常驻规则多 | `https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/modules/core.stoverride` |

Legacy Ultra 仅作为规则仓库，不建议和上述模块同时启用。

## 合并原则

- 同一个 App、同一个返回类型的多个广告接口，优先合成一条正则。
- `reject`、`reject-dict`、`reject-img` 等返回类型不同，必须保留为不同 Rewrite。
- 请求脚本与响应脚本不能合并。
- 不跨 App 合并规则，否则无法独立启停，也难以定位误伤。
- 不为了目录整齐复制 Bilibili 或微信公众号文件，继续保留原订阅地址，避免两份配置漂移。

## 使用组合

- 当前四个常用 App：直接使用 Lite。
- 只用部分 App：关闭 Lite，安装对应独立模块。
- 需要微信公众号文章净化：可单独安装微信公众号模块。
- 需要尝试陌生 App 的开屏拦截：再额外启用 Misc Startup Ads；遇到异常先关闭它验证。
