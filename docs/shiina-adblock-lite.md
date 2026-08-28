# Shiina AdBlock Lite

日常使用的模块化 Stash 去广告覆写。它不是从零维护的空配置，而是从 Ultra 和已审核上游中只选择范围明确、实际需要的模块。

## 订阅地址

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/shiina-adblock-lite.stoverride
```

## v1.0.4 已包含

- Startup Ads：17 条接口语义明确的开屏/广告规则。
- BiliBili Lite：开屏、首页、搜索、直播间、导航与 1080P 账户能力；不接管评论、详情和播放。
- 菜鸟裹裹：仅处理明确的开屏与 `flyad` 广告接口。
- 百度贴吧：保留开屏、Feed 广告、广告素材和 `getAdInfo`，并定向拒绝 `mobads.baidu.com`、`afd.baidu.com` 两个广告主机；不修改帖子、评论、图片和同步。
- 知乎：拦截开屏、悬浮层、顶部横幅、回答/文章底部卡片、评论顶部及明确广告接口；在首页推荐、问题/话题回答流、关注流、热榜和详情页后续内容中，仅删除带 `feed_advert`、`adjson`、`promotion_extra`、`ad_info` 或明确“广告/合作推广”标签的卡片。普通回答、文章、评论、盐选和会员内容保持不变。

## 内存观察与回滚

- `v1.0.1` 起暂停在日常 Lite 中加载 Core 的 5,059 条通用 DNS 广告域名规则，以观察 Stash 的内存警告是否改善。
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

后续可以通过调整生成器的模块列表来改变 Lite 收录范围，而不需要手工维护一个数千行文件。
