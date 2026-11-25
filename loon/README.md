# Loon：奶思基础 + 机场自动 + 家宽出口

当前公开模板：**2026.11.25-r6**。日常只维护一份主配置，去广告启用奶思 `blockAds.plugin` 与 Shiina 补充，另启用家宽出口手动检测，共三个插件。

```text
手机 → 机场自动（云梯 + ikuuu 的亚洲专线候选）→ 家宽 SOCKS5 → 境外网站
```

## 当前入口

| 内容 | 用途 |
| --- | --- |
| [公开主模板](mars/Loon_奶思家宽_2026.11.25-r6.template.conf) | 1 个自动组、1 个筛选器、1 条家宽链、2 个去广告插件（奶思 + Shiina）及 1 个手动检测插件；只含占位参数 |
| [家宽出口手动检测](docs/ipquality.md) | 基础信息、风险、流媒体与 AI；当前分流、隐藏 IP、手动运行 |
| [填写与维护](mars/README.md) | 在本地填写机场和家宽，之后在手机更新订阅 |
| [Shiina 补充](shiina-adblock-supplement-v0.8.0.plugin) | 补充奶思尚未覆盖的已核对样例；r5 新增四项 Quantumult 对应功能 |
| [本次核对与精简记录](docs/naisi-cleanup-20261125.md) | 上游版本、保留理由、归档范围及验证方式 |
| [变更记录](CHANGELOG.md) | 模板与可选补充的版本历史 |

已有私人配置继续使用本地/iCloud 文件。公开模板里的订阅、家宽参数均为无效占位，使用前在本地填写；证书也在本人设备生成或保留。公开模板不自动覆盖手机配置。

## 文件版本与保留方式

每次交付新建带版本号的文件，文件头同步写明版本、北京时间和变更。日常目录只保留最新版与上一版备份；新文件和备份核验完成后移除更早的废弃版。

- [最新版 r6](mars/Loon_奶思家宽_2026.11.25-r6.template.conf)
- [上一版 r5 备份](mars/Loon_奶思家宽_2026.11.25-r5_上一版备份.template.conf)

GitHub 文件为公开占位模板。手机私人配置单独同步到 iCloud，文件名同样带版本号；两边的“上一版”取各自上次实际交付的版本。

## 机场与家宽维护

- 云梯、ikuuu 保留为两个独立远程订阅，在 Loon 的节点页面更新或编辑。
- `亚洲前置` 从节点名称筛选香港、日本、新加坡、台湾、韩国的 IEPL/IPLC/专线节点，并排除免费、下载、试用等标签。
- `机场自动` 每 600 秒测速，切换容差 50 ms；测速目标是机场节点自身，完整家宽链仍需实际请求检查。
- `境外家宽` 固定引用 `机场自动,家宽出口`。更新订阅后重新筛选候选，无需生成大量本地节点或代理链。
- 国内规则直连；Google、出口检查及境外兜底使用家宽链。保持分流模式。

## 去广告：奶思与 Shiina 补充

r4 已在奶思基础上启用 Shiina 补充。补充提供独立的接口和字段处理，涵盖：微博、高德、彩云、百度网盘、闲鱼、网易邮箱大师、汽水音乐、腾讯文档、淘票票、iDaily、中国联通、墨迹天气、车来了、微信素材。

r5 已包含下面的版本化插件地址。补充插件 **v0.8.0** 新增 Safari 快捷搜索、Google 中国域名跳转、豆瓣网页净化和网易云三处推广拦截。完整对照、搜索用法和未迁移项见 [Quantumult 对照记录](docs/quantum-comparison-20261125.md)。

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/loon/shiina-adblock-supplement-v0.8.0.plugin
```

各应用开关默认开启；可按需关闭不用的项。停用整个插件可同时移除其分流与 MitM。避免同时启用相同 App 的另一套响应脚本。微信素材处理可能留下文字或占位；普通图片、视频异常时关闭该项对照。

[SideStore 本地回环](https://github.com/ShiinaWong/loon-plugins) 是独立功能，继续保留在原仓库；本主模板没有默认启用它。

## 旧方案与回退

旧多链生成器、旧链路诊断面板、分批补充说明已退出主分支，完整内容保存在 [归档分支](https://github.com/ShiinaWong/stash-configs/tree/archive/loon-before-naisi-20261125/loon)。精简前提交为 [`371ad47`](https://github.com/ShiinaWong/stash-configs/tree/371ad47aa94d8fa075ca557ef4352c00527dca27/loon)，本机另有完整 Git bundle 备份。

原 `mars-ai-check.plugin` 地址保留为停用说明入口，更新后没有执行项。已安装旧版的设备可直接停用或删除该插件；新结构不再使用其硬编码策略名与诊断面板。

## 验证

77 项离线测试使用固定奶思和墨鱼快照，涵盖代表性 URL 重叠、开关、字段保留、异常响应和脚本行为。测试在仓库根目录运行：

```sh
node --test loon/tests/*.test.cjs
```

默认下载固定公开上游；离线时可用 `MILK_PLUGIN`、`WEIBO_UPSTREAM_SCRIPT`、`AMAP_UPSTREAM_SCRIPT`、`DOUBAN_UPSTREAM_SCRIPT`、`IPQUALITY_CORE` 指定原始文件，测试会校验 Git blob SHA。测试范围见核对记录，手机上的完整链和广告效果仍以实测为准。

上一版 r5 保留原样。当前 r6 新增一个手动检测插件，原奶思与 Shiina 功能补充保持；日常刷新插件即可。SideStore 未启用。
