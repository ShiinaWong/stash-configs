# App modules

每个文件只处理一个 App，可以单独订阅；默认选择会由 `tools/build_shiina_adblock_lite.py` 合并到 Lite。

- BiliBili：`../bilibili-adblock-lite.stoverride`（保留原订阅地址）
- 菜鸟裹裹：`cainiao.stoverride`
- 百度贴吧：`tieba.stoverride`
- 知乎：`zhihu.stoverride`
- 淘宝：`taobao.stoverride`
- 京东：`jd.stoverride`
- 拼多多：`pinduoduo.stoverride`
- 微信公众号：`../wechat-official-accounts-adblock.stoverride`（独立可选，不进默认 Lite）

跨 App 的精选开屏合集位于 `../modules/startup-ads.stoverride`，它作为一个整体可选，不再默认加入 Lite。Core DNS 和 Legacy Ultra 也不属于 App 模块。

新模块应优先使用本地维护脚本，仅匹配明确广告接口，并避免登录、支付和同步链路。同一 App 内相同返回类型的 Rewrite 应用正则合并；不同响应类型或脚本阶段不得为了减少行数而强行合并。
