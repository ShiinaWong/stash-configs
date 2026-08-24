# Third-party notices

## APP 启动页去广告 Ultra+

`overrides/shiina-adblock-ultra.stoverride` 以公开的 Ultra+ 聚合覆写为功能基线，对脚本提供器进行了去重，并替换或移除了失效依赖。

- Source: https://yfamilys.com/stoverride/adultraplus.stoverride
- Project: https://github.com/deezertidal/stash-override
- Verification mirror: https://github.com/liuqing2030/magic/blob/2044096cfca8b8d7751959cee05340fa58b7fac8/adultraplus.stoverride

生成的覆写仅引用第三方脚本 URL，不在本仓库镜像这些 JavaScript 文件。原聚合仓库未声明许可证；本仓库保留来源说明，不对第三方内容重新授权。

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
