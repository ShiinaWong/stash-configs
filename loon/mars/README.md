# Loon：公共规则、本地机场、Mars 住宅出口

面向 **Loon 3.5.3**。使用奶思维护的原生 Loon 去广告插件、Repcz 的公开分流规则；机场订阅和住宅代理账号只填写在本地。主配置不作为自动覆盖的远程配置订阅。

**公共入口：[Loon_Mars.template.conf](https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/loon/mars/Loon_Mars.template.conf)**。这是占位模板，未填写本地账号不能使用。已经单独取得私有导入文件的用户，直接导入私有文件，无需再次填账号。

## 文件与更新

| 内容 | 存放和更新方式 |
| --- | --- |
| 机场订阅 | 本地 `[Remote Proxy]`；Loon 向机场原始地址更新，不经过在线转换服务 |
| Mars 连接参数 | 本地 `[Proxy]` 中唯一的 `Mars-ISP` 节点；修改一次影响所有完整链路 |
| 公共规则 | `[Remote Rule]` 中 6 条 GitHub 链接；使用 Loon 的资源更新功能获取 |
| 去广告插件 | `[Plugin]` 中的作者原始链接；可单独更新、停用 |
| 前置节点与完整链路的对应关系 | 本地 `[Proxy Chain]`；节点同名时随订阅使用新参数，新建、删除或改名后需重新生成对应关系 |
| 主配置结构 | 本地保存；更新前备份，不让公共模板覆盖已填好的账号、证书或新增插件 |

公开目录不含真实服务器、订阅令牌、密码、证书或手机日志。私有配置及导入后的 Loon 导出文件包含账号，不能上传 GitHub。公共模板只保留节点显示名称，用于对照当前链路结构。

## 链路和日常策略

```text
AI 服务／指定出口查询
  → AI-Mars
  → Mars-亚洲自动（PCC，检测对象是各条完整代理链）
  → ikuuu 或云梯的一个亚洲节点
  → Mars-ISP
  → 目标服务
```

当前生成 65 条候选：ikuuu 36 条、云梯 29 条。此前的云梯 TUIC 节点没有出现在其 Loon 格式订阅中，因此未纳入；没有接入魔戒。地区按订阅名称识别，未验证真实机房位置。

主配置只有 5 个策略组：

- `AI-Mars`：默认选 `Mars-亚洲自动`；也可直接选某条 `Mars 经 机场 · 节点`，便于固定前置。
- `Mars-亚洲自动`：对完整链路分配连接，默认 PCC；同一主机名倾向保持相同候选。检测间隔 600 秒，超时阈值 8000 毫秒。
- `普通代理`：普通国际服务默认选 `机场自动`，也可在 ikuuu、云梯中手动选节点。
- `机场自动`：从两个订阅的亚洲节点中测速选择，仅用于普通流量。
- `兜底策略`：默认 `AI-Mars`，让未分类流量保守地保留住宅出口；可以手动改为普通代理，但未知新 AI 服务将不再有这一层兜底保护。

需要每个新连接轮换前置时，在 `Mars-亚洲自动` 中把 `algorithm=pcc` 改为 `algorithm=round-robin`，其余候选不变。两种方式都不是多线路带宽叠加，也不会恢复已经断开的 TCP 长连接。住宅服务本身是否固定出口由服务商决定，不由 PCC 保证。

**AI 组没有机场单跳、单独 Mars 或 DIRECT 候选。** Mars 不可用时，设计结果是连接失败。完整链检测、失败剔除以及节点引用失效后的 Loon 实际行为仍须在手机上验收，静态检查不等于已证明运行时不会绕行。

## 分流顺序与范围

依据 Loon 当前文档，域名与 IP 规则分阶段匹配；规则来源优先级为本地、插件、订阅，FINAL 最后生效，不能把所有段落理解成一条普通顺序列表。

1. 本地已知 AI 域名与出口查询明确指向 `AI-Mars`，即使远程 AI 规则下载失败也保留。
2. 私有订阅更新地址、指定普通 Apple 服务和 Gmail 邮件有本地例外；Private Relay 的三个建连域名拒绝。
3. 插件负责广告请求和脚本处理；远程订阅依次提供 AI 补充、广告域名、iCloud、Apple 国内服务、国内域名和普通国际流量。
4. 国内 IP 直连，未分类请求按 `兜底策略`，默认保留完整 Mars 链。

iCloud、App Store 的正常基础服务以直连为主。`gateway.icloud.com` 等 Apple 共享主机没有承诺 Apple Intelligence 的 Mars 出口；本次重点是 ChatGPT、Gemini、Grok 等明确可分流服务。

本次以 IPv4/TCP/HTTPS 为起点，Mars 节点和每条链都设置 `udp=false`，`udp-fallback-mode=REJECT`；配置还限制 QUIC。HY2 前置自身用 UDP 传输与让 AI 使用 UDP 是不同层次。AI 语音、STUN、UDP、QUIC 尚未验收，不通过 DIRECT 回退来解决。DNS 使用国内 DNS/DoH 引导，不宣称所有 DNS 查询经过 Mars。

`disconnect-on-policy-change=true`：主动切换策略后会关闭旧连接，App 需要重新建立连接。Wi-Fi／蜂窝切换和锁屏恢复需要手机测试。

## 导入和证书

1. 在手机保存现有 Loon 配置副本；也保留当前可用的 Egern 配置。
2. 将私有 `.lcf` 文件发送到自己的 iPhone“文件”App，通过分享菜单交给 Loon，或在 Loon 配置管理中从文件导入，保存为新的本地配置。不要覆盖唯一的旧配置。
3. 使用规则分流模式，启用两个机场订阅并更新资源；检查没有解析失败或空订阅。保持 `AI-Mars → Mars-亚洲自动`。
4. 启动 Loon，先确认出口与 AI 正常。需要启用去广告内容处理时，在 Loon 配置中的证书／MitM 功能生成并安装自己的证书。
5. 在 iPhone“设置 → 通用 → VPN 与设备管理”中安装刚下载的证书描述文件；然后进入“设置 → 通用 → 关于本机 → 证书信任设置”，对该 Loon 根证书开启完全信任。
6. 回到 Loon，确认相关插件、复写、脚本和 MitM 功能已启用。只使用插件明确列出的主机，不开启全局 MITM，不添加 `*`。

证书信任依据：[Apple 官方说明](https://support.apple.com/zh-cn/102390)。本配置不附带他人的证书、私钥或示例 CA。Egern 的证书不会自动成为 Loon 的可用证书。

## 去广告与墨鱼插件

默认启用：

| 资源 | 用途 |
| --- | --- |
| 奶思 `rejectAd.list` | 通用广告域名拦截 |
| 奶思 `blockAds.plugin` | 常见 App／小程序广告处理，包含淘宝和哔哩哔哩等处理；效果随 App 接口变化 |
| 奶思 `weibo.plugin` | 微博广告和界面净化；本配置排除 `new.vip.weibo.*` 解密，避免其会员图标／皮肤接口处理 |
| Script Hub | 以后导入其他格式的公开规则和重写；不是机场订阅转换服务 |

微信小程序独立补充默认关闭，避免和奶思合集重复。墨鱼 Safari 搜索、B 站字幕简体也预留为关闭的可选条目，未宣称已在手机验证。

添加模块时：

1. 作者提供 Loon 原生 `.plugin` 或 `.lpx`：在 Loon 插件页面添加原始链接即可；扩展名不是唯一依据，要看作者标明的客户端格式。
2. 作者只提供 Quantumult X `.conf`：先确认 Script Hub 插件和 VPN 已启动，打开 `https://script.hub`，选择源格式 QX Rewrite、目标 Loon Plugin，输入**公开资源 URL**，再使用生成的链接添加插件。
3. 不能把机场订阅或含 Mars 密码的完整配置提交给转换服务。这里预留的转换链接只有墨鱼公开资源地址。
4. 添加同一 App 的另一套去广告前，先停用原有对应处理。奶思合集部分 App 有参数开关，但开关可能只管脚本，不会同时关掉该 App 的所有 Rule/Rewrite；无法干净排除重叠时，不要并开两套合集。
5. 插件中的 `PROXY` 映射一般选 `普通代理`；明确属于 AI 的资源应选 `AI-Mars`。带旁路、Host 或 DNS 修改的插件还可能改变主配置行为，添加后检查请求策略。

预留两项的说明：Safari 搜索需要将 Safari 默认搜索引擎设为 DuckDuckGo；B 站字幕简体只处理字幕，不是另一套 B 站去广告。资源转换在本机 Script Hub 环境中执行的实际效果尚待验证。

## 更换机场／住宅 IP

只换住宅账号：编辑本地 `Mars-ISP` 的服务器、端口、用户名和密码，保留名称及 `udp=false`。所有链条都引用这一节点，不需要修改 65 处。

机场同名节点更新参数：更新订阅即可。机场新增、改名、删除节点或新增另一家机场：运行本地生成器重建完整候选，不把“普通机场池自动扩展”误认为“完整 Mars 链自动扩展”。

把 `inputs.example.json` 复制为电脑上的私有 `inputs.json`，填写原始机场订阅和 Mars 参数。安装 Python 3 后，在本目录运行：

```sh
chmod 600 private/inputs.json
python3 tools/build.py --inputs private/inputs.json --cache-dir private --refresh --output private/Loon_Mars.private.lcf --manifest private/build_manifest.json
```

生成器仅访问输入的机场原始地址，不上传配置；使用 Loon 标识请求订阅，支持原生 Loon 节点及常见节点 URI。它会拒绝不识别的格式和同名歧义，并在覆盖输出前备份。它不转换任意 Clash YAML，也不保证新协议自动可用。

**重新生成会产生新的完整主配置，不会自动合并你后来在手机增加的插件或证书。** 使用前保留手机导出副本，把自定义 `[Plugin]` 条目迁入新文件，或只把新生成的订阅、链路和策略段合并到原本地配置。

## 验证与恢复

导入后打开 `https://api.ipify.org`，请求应命中 `AI-Mars`，链路包含机场节点和 `Mars-ISP`；返回出口需与你已知的 Mars 出口一致。然后测试 ChatGPT、Gemini、Grok 和一个较长的流式回答。

完整手机检查清单见 [VALIDATION.md](VALIDATION.md)。现在已完成的是订阅获取、文件结构／引用／分流模型检查和部分脚本语法检查，不是 Loon 引擎测试或手机验收。

常见问题入口：订阅或插件下载失败查资源详情；AI 失败查连接记录中的命中规则、策略、代理链；广告无效查插件是否启用、证书是否完全信任及目标是否在 MITM 范围。普通登录、图片或视频异常时先停用对应插件，保留代理链设置以区分问题来源。

回退时关闭 Loon，重新启用之前保存的 Loon 配置，或启用此前工作的 Egern 配置。不要同时启动两个 VPN。仅在不再使用相关解密功能时移除对应证书。

## 来源

- [Loon 官方示例](https://github.com/Loon0x00/LoonExampleConfig/blob/master/example2.lcf)
- [Loon 策略组](https://nsloon.app/docs/Policy/policygroup/)、[规则优先级](https://nsloon.app/docs/Rule/)、[订阅格式](https://nsloon.app/docs/Node/subscription/)、[MITM](https://nsloon.app/docs/MitM/)
- [奶思 Loon](https://github.com/fmz200/wool_scripts/tree/main/Loon)
- [Repcz Loon 规则](https://github.com/Repcz/Tool/tree/X/Loon/Rules)
- [Script Hub](https://github.com/Script-Hub-Org/Script-Hub)
- [墨鱼资源](https://github.com/ddgksf2013/Rewrite)、[墨鱼手记](https://ddgksf2013.top)

本目录只维护连接结构、必要的本地 AI 基线及使用说明。第三方广告脚本不在此重新打包发布，仍由原作者维护。资源抓取日期与检查范围：2026-11-24。
