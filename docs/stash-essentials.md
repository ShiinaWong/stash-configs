# Shiina Stash Essentials

这是推荐使用的统一 Stash 覆写订阅。目标是在尽量少配置订阅的前提下，只收录经过范围检查、可以明确说明数据来源和影响面的功能。

## 当前版本

`v0.4.0`

## 已包含

### 国内轻量广告域名规则

- 来源：`217heidai/adblockfilters`
- 规模：约 5,000 个国内广告域名
- 工作方式：通过 Stash 规则集拒绝广告域名
- 不需要 HTTPS 解密，不下载或执行广告过滤脚本
- 规则镜像到本仓库，由每日同步任务更新并在写入前进行格式与体积检查

### BiliBili ADBlock Lite

- 内置独立覆写 `v0.4.0` 的全部功能
- 广告域名规则和 B 站发布脚本均从本仓库镜像地址下载，避免跨项目 Release 重定向失败
- 处理首页广告、推广卡片、小程序入口、导航栏和直播购物信息
- 不匹配评论、弹幕、视频详情和播放地址接口
- 在账户信息响应中启用旧 Quantumult X 规则的 1080P/高码率能力
- MITM 仅保留 3 个必要域名

### Essentials 健康检查磁贴

- 检查统一覆写、健康磁贴、B 站界面脚本、轻量广告规则和 B 站上游脚本是否可下载
- 每 6 小时自动检查一次，也可以手动刷新
- 使用小范围请求降低流量消耗
- 只访问本合集已经依赖的 GitHub 资源，不接触账户 Cookie，也不需要 MITM

## 安装

在 Stash 的覆写页面添加以下唯一链接：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/stash-essentials.stoverride
```

如果已经启用了独立的 `bilibili-adblock-lite.stoverride`，请在启用本合集后关闭独立版本，避免同一接口被重复处理。

## 收录原则

- 优先使用规则集，其次才使用 HTTPS 脚本
- 一个功能只保留一个脚本 provider，不重复声明同一远程脚本
- 除明确保留的 B 站 1080P/高码率兼容能力外，不收录会员、内购或订阅状态修改
- 不收录数百域名、数百脚本的融合包
- 新增模块前检查远程地址、维护状态、接口范围和配置语法

## 版本记录

- `v0.4.0`：同步 BiliBili ADBlock Lite v0.4.0，加入旧 Quantumult X 规则的 1080P/高码率账户能力。
- `v0.3.0`：广告域名规则和 BiliUniverse 固定版本脚本改为本仓库镜像，统一依赖入口。
- `v0.2.1`：修复健康磁贴对 GitHub Release 跳转链接的误报。
- `v0.2.0`：加入 Essentials 依赖健康检查磁贴。
- `v0.1.0`：加入国内轻量广告域名规则和 BiliBili ADBlock Lite。
