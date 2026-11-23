# Egern：Mars 双跳代理与分批去广告

流量路径：`iPhone → 机场前置 → Mars SOCKS5 → AI`。

本目录维护不含私人连接参数的 Egern 原生配置模板、独立模块和校验工具。真实节点、机场订阅、证书以及手机导出的完整配置只保留在自己的设备上。不要把私有 YAML 或 ZIP 提交到仓库。

## 当前状态

- 模板按 2026-11-23 的 Egern 官方文档准备。用户已确认 Egern Pro 2.21.0（798），并已提供原生请求详情作为单链路径证据。
- 静态检查与桌面辅助连通性测试已有结果。手机请求详情已显示出口查询和 OpenAI 均经过 `Upstream-A → Mars-via-A` 并命中 `AI-Mars`；用户反馈的出口经本机比对符合 Mars。单链运行路径和出口已验证；用户已反馈 Gemini、Grok、ChatGPT 输出正常，单链基础验收通过。主备切换、网络切换和长期稳定性尚未验收。
- 已解析用户提供的 2026-11-23 22:21:40 Quantumult X 导出：18 个启用的远程重写、11 个启用的远程分流资源，没有本地重写。导出文件只留在用户本机，不进入仓库。
- 已在本机确认导出的 Mars 四项连接参数与已准备的 Egern 配置一致，公开记录不展示参数。
- **当前只推进代理链验收。通过后仅试点微博、淘宝、哔哩哔哩，三者无异常后再扩大去广告。** 现阶段不启用 App 模块，也不把旧客户端的“资源已启用”当作 Egern 效果证明。执行顺序见 [`CHAIN_FIRST.md`](CHAIN_FIRST.md)。

## 配置

| 模板 | 用途 |
| --- | --- |
| `templates/Egern_01_SingleChain.yaml` | 先验证一条完整 Mars 链，无去广告 |
| `templates/Egern_02_Fallback.yaml` | 增加第二条完整链，先 A 后 B |
| `templates/Egern_Mars_Adblock.yaml` | 双链基础上增加一份通用广告规则 |

**模板中的地址和密码都是无效示例，不能直接联网。** 用 `tools/render_private.py` 在本机填入自己的参数；输出必须放到不受版本管理的私有目录。

```sh
python3 -m venv .venv
.venv/bin/pip install PyYAML==6.0.3
.venv/bin/python tools/render_private.py \
  --template templates/Egern_01_SingleChain.yaml \
  --credentials /本机私有目录/egern-credentials.private.json \
  --output private/Egern_01_SingleChain.private.yaml
```

凭据 JSON 的结构见 `credentials.example.json`。只在自己的设备上创建真实版本；脚本不打印连接参数，覆盖输出前会备份，并将文件权限设为 0600。它只替换节点参数，不改变链路引用和规则。

## 链路与失败行为

`AI-Mars` 只包含 `Mars-Fallback`、`Mars-via-A`、`Mars-via-B`；两条 SOCKS5 节点分别通过 `prev_hop` 指向 `Upstream-A/B`。两条 Mars 必须使用同一组参数。

`Mars-Fallback` 检测两个完整候选，每 120 秒一次，单次超时 10 秒，使用 HTTPS 204 地址。没有机场单跳、无前置 Mars 或 DIRECT 备用。Mars 本身失效时应明确失败；实际 Egern 行为须用测试副本验证。

`close_connections_on_policy_change: true` 会关闭旧节点上的连接，应用需要重连，流式回答可能中断。切换不是无缝迁移。健康检测成功也不代表 AI 账户权限或模型调用成功。

未知 TCP 流量默认走 `AI-Mars`，常用国内域名单独直连。已知 AI 域名优先于腾讯、百度等大域名直连规则。默认也走 Mars 会增加其带宽消耗。远程 DNS 默认路径经完整链，但引擎内部 Proxy DNS 强制直连，不宣称所有 DNS 都经过 Mars。

当前只做 TCP/HTTPS 基线：关闭代理 UDP relay 和 QUIC，明确拒绝 AI 和未验收公网数据报；语音等需要单独验证，不能通过增加全部 UDP DIRECT 规避失败。

## 去广告与来源

通用规则引用 Repcz/Tool 的固定 Egern Reject 版本；AI 采用其 AI 快照加服务专属域名。快照来源及校验值见 `sources.json`。广告规则可以单独停用。

当前阶段顺序：单链验收 → 双链故障测试 → 微博、淘宝、哔哩哔哩逐个试点 → 三者验收后再扩展通用/App/小程序覆盖。第三份通用去广告模板保留为候选，暂不作为部署入口。AI 正常代理不需要 MITM；后续模块只允许明确的去广告域名，不开启全局 HTTPS 解密。

当前官方资料：[代理](https://egernapp.com/docs/configuration/proxies/)、[策略组](https://egernapp.com/docs/configuration/policy_groups/)、[完整配置](https://egernapp.com/docs/configuration/example/)、[模块](https://egernapp.com/docs/configuration/modules/)。

## 检查与维护

```sh
.venv/bin/python -m unittest discover -s tests -v
```

这些检查验证结构和安全约束，不替代 Egern 官方解析器或手机实测。详见 `VALIDATION.md`。

前置使用固定别名与节点快照，远程订阅改名不会自动重写链路。机场换地址/密码后，在本机受控更新参数并重新验收；无法找到前置时停止更新，不自动改为 DIRECT。

发布仅包含模板、通用规则/模块和脱敏记录。每次推送前扫描连接参数、订阅 URL、证书和原始抓包。上游内容保留来源署名，不重新授权第三方规则。
