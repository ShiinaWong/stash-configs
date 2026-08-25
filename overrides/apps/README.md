# App modules

每个文件只处理一个 App，可以单独订阅，也会由 `tools/build_shiina_adblock_lite.py` 合并到 Lite。

- BiliBili：`../bilibili-adblock-lite.stoverride`（保留原订阅地址）
- 菜鸟裹裹：`cainiao.stoverride`
- 百度贴吧：`tieba.stoverride`

新模块应优先使用本地维护脚本，仅匹配明确广告接口，并避免登录、评论、详情、支付和同步链路。
