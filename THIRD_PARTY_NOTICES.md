# Third-party notices

## BiliUniverse/ADBlock

`overrides/bilibili-adblock-lite.stoverride` 基于以下项目的 Stash 模板与发布脚本：

- Project: BiliUniverse/ADBlock
- Source: https://github.com/BiliUniverse/ADBlock
- Version: v0.6.24
- License: Apache License 2.0

本仓库对上游配置进行了删减，只保留开屏、首页、搜索和直播间相关规则，并关闭或移除评论、弹幕、视频详情、动态页和播放地址接口。

Apache License 2.0 全文见 `licenses/BiliUniverse-ADBlock-LICENSE`。

## ddgksf2013/BiliBiliAdsLite

界面净化的功能范围参考了 ddgksf2013 的 BiliBiliAdsLite 使用体验，包括首页 Tab、“我的”页面与顶部活动入口净化。本仓库使用独立实现，并明确排除了原脚本中的 VIP 和账户权益字段修改。

- Source: https://ddgksf2013.top/rewrite/BiliBiliAdsLite.conf
- Author: ddgksf2013

## 217heidai/adblockfilters

`overrides/stash-essentials.stoverride` 远程引用该项目生成的国内轻量广告域名规则，不在本仓库重新分发规则内容。

- Project: 217heidai/adblockfilters
- Source: https://github.com/217heidai/adblockfilters
- Snapshot commit: cc26e315e0b2082f6d51286bb8dbbc5bc25bb89a
- Rule file: rules/adblockmihomolite.yaml
- Rule version: 20260823163609
- License: GNU General Public License v3.0
