# BiliBili ADBlock Lite

这是一个面向 Stash 的轻量版哔哩哔哩去广告覆写，基于 BiliUniverse/ADBlock `v0.6.24`。

## 处理范围

- 开屏广告
- 首页信息流广告与短视频流广告
- 搜索默认词、推荐词和搜索结果广告
- 番剧、影视入口页广告
- 直播间广告与购物信息

## 刻意不处理

- 评论接口
- 弹幕接口
- 视频详情接口
- 视频及番剧播放地址接口
- 动态页接口

这样做是为了减少脚本对高频接口和播放链路的介入。如果仍遇到评论、视频加载或播放异常，请先停用本覆写再复测。

## 安装

在 Stash 的覆写页面添加以下链接：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/bilibili-adblock-lite.stoverride
```

启用后请确保 Stash 已安装并信任本地 CA 证书，否则 HTTPS 脚本无法工作。

## 更新策略

当前脚本资源固定使用 BiliUniverse/ADBlock `v0.6.24`，避免上游更新在未经测试时直接改变行为。升级上游版本时，应重新核对接口范围，并重点测试首页、搜索、评论、弹幕和视频播放。
