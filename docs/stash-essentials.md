# Shiina Stash Essentials

这是推荐使用的统一 Stash 覆写订阅。目标是在尽量少配置订阅的前提下，只收录经过范围检查、可以明确说明数据来源和影响面的功能。

## 当前版本

`v0.1.0`

## 已包含

### 国内轻量广告域名规则

- 来源：`217heidai/adblockfilters`
- 规则版本：`20260823163609`
- 规模：约 5,000 个国内广告域名
- 工作方式：通过 Stash 规则集拒绝广告域名
- 不需要 HTTPS 解密，不下载或执行广告过滤脚本
- 当前版本固定到经过检查的 Git commit，避免上游内容未经验证自动变化

### BiliBili ADBlock Lite

- 内置独立覆写 `v0.3.1` 的全部功能
- 处理首页广告、推广卡片、小程序入口、导航栏和直播购物信息
- 不匹配评论、弹幕、视频详情和播放地址接口
- MITM 仅保留 3 个必要域名

## 安装

在 Stash 的覆写页面添加以下唯一链接：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/stash-essentials.stoverride
```

如果已经启用了独立的 `bilibili-adblock-lite.stoverride`，请在启用本合集后关闭独立版本，避免同一接口被重复处理。

## 收录原则

- 优先使用规则集，其次才使用 HTTPS 脚本
- 一个功能只保留一个脚本 provider，不重复声明同一远程脚本
- 不收录会员、内购、账户权益或订阅状态篡改
- 不收录数百域名、数百脚本的融合包
- 新增模块前检查远程地址、维护状态、接口范围和配置语法

## 后续计划

下一阶段会把经过审计的网络信息、流媒体检测等实用磁贴加入同一个订阅链接。
