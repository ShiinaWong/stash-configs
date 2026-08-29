# Shiina AdBlock Lite

日常使用的模块化 Stash 去广告覆写。它不是从零维护的空配置，而是从 Ultra 和已审核上游中只选择范围明确、实际需要的模块。

## 订阅地址

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/shiina-adblock-lite.stoverride
```

## v1.3.0 已包含

- BiliBili Lite：开屏、首页、搜索、直播间、导航与 1080P 账户能力；不接管评论、详情和播放。
- 菜鸟裹裹：仅处理明确的开屏与 `flyad` 广告接口。
- 百度贴吧：保留开屏、Feed 广告、广告素材和 `getAdInfo`，并定向拒绝 `mobads.baidu.com`、`afd.baidu.com` 两个广告主机；不修改帖子、评论、图片和同步。
- 知乎：拦截开屏、悬浮层、顶部横幅、回答/文章底部卡片、评论顶部及明确广告接口；在首页推荐、问题/话题回答流、关注流、热榜和详情页后续内容中，仅删除带 `feed_advert`、`adjson`、`promotion_extra`、`ad_info` 或明确“广告/合作推广”标签的卡片。普通回答、文章、评论、盐选和会员内容保持不变。
- 淘宝：清空图片和视频开屏广告字段，保留启动响应中的其他数据。
- 京东：清空 `start` 响应中的开屏图片，并拒绝两个语义明确的启动广告接口；不处理商品、订单和支付。
- 拼多多：拒绝 `cappuccino/splash` 开屏接口及 `t-dsp.pinduoduo.com` 专用广告请求；不处理首页商品流。
- 闲鱼：拒绝明确的开屏/广告上报接口；在首页、同城、搜索及商品推荐响应中只删除带广告标记的卡片，不修改交易、消息、账号与发布功能。
- 小红书：清理开屏配置、信息流明确广告卡片、详情广告组件和营销弹窗；不启用上游脚本中的去水印、强制下载、画质增强与关注页改造。
- 什么值得买：处理开屏、首页、好价、百科、搜索和详情页广告字段；不修改会员状态，也不删除普通 Wiki/相关文章。
- 携程：拒绝专用广告主机 `ma-adx.ctrip.com` 和 `tripAds` 接口；不采用旧规则中的时区服务器拦截和百度通用广告接口。

同一 App 内返回类型相同的 Rewrite 已尽量用正则合并；不同返回类型、请求/响应阶段或脚本 provider 不强行拼接。淘宝和京东共用一个本地开屏清理脚本 provider；淘宝主机已和菜鸟模块复用。当前合计为 33 个 MITM 主机、13 条脚本、13 条 Rewrite 和 10 个脚本 provider。

高德地图保守模块已经提供，但不进入默认 Lite。它只处理开屏、首页推荐、搜索推广和专用广告图片域名，不处理路线规划、天气、附近、打车、订单、定位，也不加载上游混淆脚本：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/apps/amap.stoverride
```

## 按 App 使用

- 省事模式：只启用本 Lite，获得上述七个 App 的合并配置。
- 严格按需模式：关闭 Lite，按 [`App 独立订阅目录`](app-adblock-modules.md) 只安装实际使用的 App。
- 不要同时启用 Lite 和 Lite 已包含的独立 App 模块，否则同一响应可能被重复处理。
- 微信公众号和杂项开屏不属于 Lite，可作为独立模块按需叠加。

## 内存观察与回滚

- `v1.0.1` 起暂停在日常 Lite 中加载 Core 的 5,059 条通用 DNS 广告域名规则，以观察 Stash 的内存警告是否改善。
- `v1.1.0` 起移除默认的 17 条跨 App 精选开屏规则；对应模块仍完整保留，可独立安装。
- App 精准规则、脚本和 MITM 范围不变；主代理订阅中的分流规则不受影响。
- `overrides/modules/core.stoverride` 和 `rules/adblockmihomolite.yaml` 均继续保留。需要回滚时，将 Core 重新加入 Lite 生成器的默认模块列表并重新生成即可。

## 与 Ultra 的关系

- Lite 是推荐日常订阅，只合并已选模块。
- Ultra 继续保留为 Legacy 全量规则库，不会因本次拆分丢失规则。
- 不要同时启用 Lite 与 Ultra，否则同一请求可能被重复处理。
- 新 App 可以先从 Legacy Ultra 抽取已有规则，审核和测试后再加入 Lite，无需每次从零抓包。

## 模块与生成

- 通用模块：`overrides/modules/`
- App 模块：`overrides/apps/`
- Lite 生成器：`tools/build_shiina_adblock_lite.py`

生成命令：

```bash
python3 tools/build_shiina_adblock_lite.py
```

也可以按 App 生成自定义合集：

```bash
python3 tools/build_shiina_adblock_lite.py \
  --apps bilibili tieba zhihu \
  --output overrides/my-adblock.stoverride
```

后续可以通过调整生成器的模块列表来改变 Lite 收录范围，而不需要手工维护一个数千行文件。
