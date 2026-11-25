# Quantumult 与 Loon 对照及 r5 补充

核对日期：2026-11-25。输入为用户提供的 `quantumult_20261125145303.conf`，其 SHA-256 为 `ae05bb4efd531c53dff294a391b47e9bb0ff2872a4a68d0aae97aee7b2ac8976`。原文件含私人参数，未上传。

## 结果

Loon 继续使用奶思基础，主配置仅把 Shiina 插件地址切到 **v0.8.0 版本入口**。机场订阅、亚洲前置自动选择、家宽 SOCKS5 链、DNS、原有分流及证书逐段保持。手机仍为两个插件，新增功能放在 Shiina 内的四个独立开关中。

| Quantumult 项目 | 当前 Loon 对照 | 本次处理 |
| --- | --- | --- |
| Safari Q-Search | 奶思及旧 Shiina 无对应规则 | 移植 32 个常用网页搜索指令，Loon 原生 302；前后缀均可，无指令用 Google |
| General：Google 中国域名跳转 | 无对应规则 | 补入 google.cn / g.cn 及 www 子域，保留路径和查询 |
| Douban 移动网页 | 无对应 HTML 处理 | 引用墨鱼固定版本脚本，限定成功 HTML 和六类网页路径 |
| NeteaseAds | 奶思已有框架、搜索、开屏及多处推广处理 | 补入活动模板、优惠券配置、评论区插入推广三个原 reject-200 接口 |
| B 站 BiliBiliAdsLite | 奶思已有 JSON、protobuf、播放及页面广告处理 | 继续使用奶思；原 .top 入口已返回导航 HTML |
| YouTube | 奶思已有原生二进制响应脚本 | 保留奶思，避免同一响应被重复接管 |
| Spotify | 奶思已有广告、歌手列表及 bootstrap 等处理 | 保留 Loon 原生适配 |
| 小红书、知乎 | 奶思已有开屏、信息流、搜索及页面处理 | 保留奶思；原 .top 脚本入口已返回 HTML |
| 微博、高德、彩云、闲鱼 | 奶思 + 既有 Shiina 已有对应补充 | 保留现有经测试的独立开关和字段处理 |
| 百度网盘去广告 | Shiina 已补首页及任务等页面处理 | 保留现有补充；原 .top 入口已返回 HTML |
| 百度网盘倍速 | 当前未启用对应功能 | 原入口返回 HTML，未找到可验证的同源内容，本次保留缺口 |
| 微信解除链接限制 | 奶思已引用对应 UnblockURLinWeChat 脚本 | 保留奶思 |
| StartUpAds | 奶思已有大量开屏处理 | 原入口返回 HTML，未作为有效新规则导入 |
| adblockplus+ 大合集 | 与奶思存在大量相同 URL 表达式 | 不整包叠加，已核对的缺项单独合并 |
| Cats-Team AdRules | QX 另订阅大型域名黑名单；Loon 使用奶思 rejectAd.list | 保留奶思作为统一广告基础；两套名单内容不完全相同 |
| Unbreak、WeChat、Apple、ASN China 等分流 | Loon 使用国内直连、Google/AI 及境外家宽规则 | 保持用户最新路由要求；旧 Unbreak 含 Google 直连项，不直接照搬 |
| GoogleVoice、Spotify、流媒体及全球代理分流 | 当前境外流量统一走家宽 | 保持现有统一出口，保留国内直连 |
| AI-Extended 与 Copilot 自定义分流 | 当前有奶思 AI 和境外家宽兜底 | 保持链式出口，不恢复旧 QX 裸 Mars 策略 |
| 流媒体查询、节点纯净度查询 | QX 手动工具，依赖其专用 API | 流媒体脚本明确面向 QX；纯净度脚本入口返回 HTML，未直接移植 |
| BoxJS | QX 自身为停用状态 | 继续停用 |
| 地区策略组、DNS、证书设置 | 与当前精简 Loon 方案不同 | 保留已实测可用的 Loon 网络结构和原证书 |

“已有对应功能”按应用和接口核对，不表示两端所有页面调整逐字段相同。网易云其余会员页、升级提示和创作福利等界面修改，本轮没有接管奶思响应脚本。

## 新功能使用

在 **Shiina 功能补充 v0.8.0** 参数里可分别开关 Safari 快捷搜索、Google 中国域名跳转、豆瓣移动网页净化、网易云推广补充。

Safari 快捷搜索沿用原 QX 用法：将 Safari 默认搜索引擎设为 **DuckDuckGo**，输入 `gh loon` 搜 GitHub、`bli 音乐` 搜 B 站、`yt piano` 搜 YouTube；也支持 `loon gh` 等后缀形式。普通关键词转 Google；关闭该开关即保留 DuckDuckGo 原行为。指令前缀优先，支持多词、中文编码、`+` / `%20` 空格及参数顺序变化。

移植的网页指令：`yd trc tre trj tt db zh wb wx up sspai ssp tw gh gu gc so se wa rd zdm yt bli gd af bd wk wz yh gi by ios`。`yd` 与 `zh` 目的地使用 HTTPS。原配置的 App Store 地区切换、购物 App 私有跳转协议及未核验聚合搜索入口未启用。

豆瓣沿用原作者脚本，用于移动网页净化；离线验证了推广块清理、隐藏唤起 App 横幅的样式和正文保留。仅匹配 `home_guide / movie / tv / book / group / music`，响应需状态 200 且为 `text/html`。本轮没有实测额外观影入口。

网易云严格限定以下三个接口，沿用原作者的空 200 响应，支持 `interface` 与 `interface0` 至 `interface9` 的 `api/eapi` 路径：

- `/content/activity/music/jar/template/list`
- `/vipmall/couponcfg/get`
- `/comment/feed/inserted/resources`

只增加 17 个精确 MitM 主机；没有扩大到 `www.google.com` 或支付服务。现用证书保留，手机需继续保持其原有安装和信任状态。

## 来源与边界

- [奶思 blockAds.plugin 固定核对版本](https://github.com/fmz200/wool_scripts/blob/58f6cce6dbd5c5fe50c2998938f9c2ba631a7c18/Loon/plugin/blockAds.plugin)，git blob `a699c8de8b6e82be3d46c03fc126a1749fe002f4`。
- [墨鱼 Q-Search](https://github.com/ddgksf2013/Rewrite/blob/dc3ea2c1fb2db870676b26da24006083eb1d44d3/Html/Q-Search.conf)，V2.0(136)。
- [墨鱼 General](https://github.com/ddgksf2013/Rewrite/blob/dc3ea2c1fb2db870676b26da24006083eb1d44d3/Html/General.conf)。
- [墨鱼 Douban 配置](https://github.com/ddgksf2013/Rewrite/blob/dc3ea2c1fb2db870676b26da24006083eb1d44d3/Html/Douban.conf)；[固定版本脚本](https://github.com/ddgksf2013/Scripts/blob/203e38b7b8dd1082ececbd17de3aeb587ac2826c/douban.js)，blob `1b4e988aec077c64c7385daf54604796bfaf5551`。保留作者归属，直接引用原文件。
- [墨鱼 NeteaseAds](https://github.com/ddgksf2013/Rewrite/blob/dc3ea2c1fb2db870676b26da24006083eb1d44d3/AdBlock/NeteaseAds.conf)，V1.0.33。
- Loon 官方：[Rewrite v2](https://nsloon.app/docs/Rewrite/rewrite_v2/)、[Script v2](https://nsloon.app/docs/Script/script_v2/)。捕获使用 `as` 和 `${name.1}`；响应脚本保持 URL Guard、状态和内容类型检查。

资源共核对 31 个公开入口。发现 7 条 `.top` 入口返回 HTTP 200 的导航 HTML：纯净度工具、BiliBiliAdsLite、StartUpAds、知乎、小红书、网盘广告、网盘倍速。HTML 已排除出有效脚本或规则。

adblockplus+ 解析出 2729 条 URL 复写，其中 1734 条在奶思中存在归一化后相同的正则表达式；这项统计不比较动作和开关，也不把其余表达式差异直接当作缺功能。AdRules 已完整下载约 8.6 MB，解析出 214618 个去重域名/后缀条目。大合集没有整包加入；本次补充以明确来源、对应功能和不抢现有处理接口为准。

## 验证与回退

70 项离线测试通过，包括原有 61 项业务保护测试和 9 项迁移测试组：URL 命中、搜索重定向目标、指令冲突顺序、开关、相邻路径、异常响应、网易云业务接口保留、豆瓣合成 HTML、与固定奶思样例重叠及 MitM 范围。

测试用 Node 验证规则表达式和脚本行为，并非 Loon App 内置解析器。手机实际效果需要切换 r5 后确认，Safari 功能还取决于默认搜索引擎设置。没有宣称已在手机验证新增项。

r5 使用 `shiina-adblock-supplement-v0.8.0.plugin`；r4 原样备份继续引用旧 `shiina-adblock-supplement.plugin`（v0.7.2），旧文件本轮逐字保持。两份主配置均保留原奶思在线更新入口。这样切回 r4 可撤回此次 Shiina 新增项，奶思上游自身的后续更新仍按原订阅运行。

本地与 iCloud 日常目录保留 r5 和 r4 上一版；公开模板同样保留两份。私人参数、订阅及证书仅留本地/iCloud，没有写入本报告、测试或 GitHub。
