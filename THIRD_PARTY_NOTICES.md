# Third-party notices

## APP 启动页去广告 Ultra+

`overrides/shiina-adblock-ultra.stoverride` 以公开的 Ultra+ 聚合覆写为功能基线，对脚本提供器进行了去重，并替换或移除了失效依赖。

- Source: https://yfamilys.com/stoverride/adultraplus.stoverride
- Project: https://github.com/deezertidal/stash-override
- Verification mirror: https://github.com/liuqing2030/magic/blob/2044096cfca8b8d7751959cee05340fa58b7fac8/adultraplus.stoverride

生成的覆写仅引用第三方脚本 URL，不在本仓库镜像这些 JavaScript 文件。原聚合仓库未声明许可证；本仓库保留来源说明，不对第三方内容重新授权。

## BiliUniverse/ADBlock

`overrides/bilibili-adblock-lite.stoverride` 和生成的 `overrides/shiina-adblock-lite.stoverride` 基于以下项目的 Stash 模板与发布脚本：

- Project: BiliUniverse/ADBlock
- Source: https://github.com/BiliUniverse/ADBlock
- Version: v0.6.24
- License: Apache License 2.0

本仓库对上游配置进行了删减，只保留开屏、首页、搜索和直播间相关规则，并关闭或移除评论、弹幕、视频详情、动态页和播放地址接口。为避免 Stash 下载 GitHub Release 重定向失败，`request.bundle.js` 与 `response.bundle.js` 的 `v0.6.24` 原始发布文件镜像在 `vendor/biliuniverse-adblock/`；脚本内容未经修改。

Apache License 2.0 全文见 `licenses/BiliUniverse-ADBlock-LICENSE`。

## ddgksf2013/BiliBiliAdsLite

界面净化的功能范围参考了 ddgksf2013 的 BiliBiliAdsLite 使用体验，包括首页 Tab、“我的”页面与顶部活动入口净化。本仓库使用独立实现，并明确排除了原脚本中的 VIP 和账户权益字段修改。

- Source: https://ddgksf2013.top/rewrite/BiliBiliAdsLite.conf
- Author: ddgksf2013

## 217heidai/adblockfilters

`rules/adblockmihomolite.yaml` 是该项目生成的国内轻量广告域名规则镜像，同时供 Core、Lite、Essentials 与 Ultra 使用。镜像不修改规则内容，需要时通过保留的手动工作流同步。

- Project: 217heidai/adblockfilters
- Source: https://github.com/217heidai/adblockfilters
- Rule file: rules/adblockmihomolite.yaml
- License: GNU General Public License v3.0

GPL-3.0 全文见 `licenses/217heidai-adblockfilters-LICENSE`。

## ddgksf2013/StartUpAds

`overrides/modules/startup-ads.stoverride` 从 StartUpAds 中选取接口语义明确的开屏和广告重写，没有整体复制上游配置，也没有引入会员、地区、金融或宽泛 RPC 修改。

- Project: ddgksf2013/Rewrite
- Source: https://github.com/ddgksf2013/Rewrite/blob/master/AdBlock/StartUpAds.conf
- Author: ddgksf2013
