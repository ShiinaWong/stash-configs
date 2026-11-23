# 公开入口、本地节点、远程规则

入口：[Egern.yaml](https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/egern/public/Egern.yaml)

这是一个不含真实账号的单链起始配置：`设备 → Upstream-A → Mars-via-A → AI 服务`。下载并导入一次，在 Egern 本地填写节点；后续规则按公开链接更新。公开文件只有示例地址、通用策略和域名规则，不包含机场订阅、私人服务器、密码、证书或个人诊断记录。

## 首次配置

1. 保存手机当前配置副本。用入口链接下载 YAML 并导入 Egern。
2. 在本地编辑 `Upstream-A`：填机场节点的地址、端口、加密方式、密码。此模板使用 Shadowsocks；其他协议必须换成对应的 Egern 节点类型，保留 `Upstream-A` 名称。
3. 在本地编辑 `Mars-via-A`：填 SOCKS5 地址、端口、用户名、密码；保留 `prev_hop: Upstream-A`。
4. `AI-Mars` 只选 `Mars-via-A`。未填真实参数前，示例地址不能联网。
5. 保持规则分流模式，不打开全局 MITM。启动后复测 AI 与出口查询；请求链应为 `Upstream-A → Mars-via-A`。

机场订阅也只在本地添加。本入口采用固定机场节点：从订阅中选一个可用节点，将其参数保存为 `Upstream-A`。订阅改名不会改变这个固定快照；机场更换地址或密码时，需要更新本地节点。这里没有宣称机场订阅会自动重填快照，也没有使用在线转换服务。

## 更新方式

| 内容 | 保存位置 | 更新方式 |
| --- | --- | --- |
| 机场节点、Mars 账号和前置关系 | 导入后的本地配置 | 本地编辑 |
| AI、Apple、国内服务、邮件域名 | 本仓库 `rules/` | Egern 按 `update_interval: 86400` 获取 |
| 主配置的策略顺序和默认出口 | 本地配置 | 需要调整时备份后迁移 |
| 去广告模块 | 后续独立公开模块链接 | 单独添加、停用及更新；当前未启用 |

**不要开启整份主配置的 `auto_update`，也不要反复下载入口覆盖已填好参数的配置。** 官方示例有整份配置更新字段，但未明确保证更新时合并保留本地节点。本方案只为规则集配置远程更新；下载规则无需上传本地配置，规则文件也不能携带节点定义。

GitHub 上修改域名列表后，手机会按规则集更新周期获取；这不等于立即推送。首次下载、缓存和更新后的实际行为仍需在 Egern 上检查。若网络无法获取规则，应先排查资源加载，不通过删除 AI 前置或改成 DIRECT 解决。

## 分流与限制

- 本地 AI 基线规则在所有直连/邮件规则之前；远程 AI 补充也位于这些例外之前。AI 和指定出口验证走 `AI-Mars`。
- iCloud、CloudKit、App Store 及指定 Apple 账户/证书端点的 TCP/HTTP(S) 直连。没有将整个 `apple.com` 设成直连。
- 三个 Private Relay 建连主机拒绝，避免额外中继隐藏最终访问目标并改变出口；这和普通 iCloud 同步是不同功能。
- 国内服务按明确域名直连；Gmail 的 IMAP/SMTP/POP 主机走机场 `Upstream-A`。
- 未分类 TCP 仍走完整 Mars 链，属于保守兜底，可能增加 Mars 流量。远程规则没有载入时，本地已知 AI 保护仍存在；不保证未知新 AI 在宽泛国内域名中的分类。
- UDP/QUIC 尚未启用代理转发；语音需要单独验收。DNS 保留引擎内部直连的 Proxy DNS，不宣称所有 DNS 都经 Mars。
- 不启用广告、重写、脚本或 MITM。后续仅逐个添加微博、淘宝、哔哩哔哩的独立广告模块。

回退：重新启用导入前保存的配置。需要恢复规则历史版本时，可将对应规则 URL 的 `main` 替换为经过核查的提交 SHA，然后重新加载规则。

## 检查

安装 PyYAML 后运行 `python validate.py`。检查范围为 YAML、公开示例参数、策略引用、AI 保护及远程规则增删的路由用例；不是 Egern 官方解析器或手机网络测试。

来源与署名见 [sources.json](sources.json)。官方依据：[规则](https://egernapp.com/docs/configuration/rules/)、[DNS 规则集更新](https://egernapp.com/docs/configuration/dns/)、[模块](https://egernapp.com/docs/configuration/modules/)、[完整配置](https://egernapp.com/docs/configuration/example/)。
