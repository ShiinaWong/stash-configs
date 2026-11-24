# Loon Mars：亚洲优质前置，住宅出口

当前版本 **20261124-R2**，适配本次使用的 Loon 3.5.3。机场和住宅代理账号只在本地填写；规则与插件继续引用原作者公开链接。

> 当前状态：R2 手机回存已确认 41 条链均保留机场前置，但用户实测完整链仍全部失败。正在用独立 D1 单链配置诊断，尚不能作为已验证可用配置；详情见 VALIDATION.md。

## 重要修正

R1 的代理链直接引用了订阅内部的节点名。2026-11-24 对照手机保存回 iCloud 的实际文件，发现这些前置没有被保留，链条只剩 Mars-ISP。旧静态检查仅验证“订阅里有这个名字”，漏掉了 Loon 导入后的引用问题，不能再把 R1 当作可用配置。

R2 将每个前置写成 `[Proxy]` 中明确的本地节点，再定义 `本地机场前置 → Mars-ISP`。AI-Mars 和 Mars-亚洲自动只引用这些完整链，没有 DIRECT、单独 Mars 或单跳机场选项。

截至本次订阅快照，共 41 条：**ikuuu 20、云梯 21**。名称须同时满足亚洲地区和 IEPL/IPLC/专线标识，排除免费、下载、普通、直连、视频、试用等标签。名称是供应商标识，不是独立质量认证。普通代理和新加坡流媒体的候选也只引用这批本地优质节点；原始订阅可以保留供获取新数据，原始列表中其他节点不进入策略候选。

## 本地生成

公开占位模板：[Loon_Mars.template.conf](https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/loon/mars/Loon_Mars.template.conf)。里面的机场和 Mars 参数都无效，不能直接当作已配置好的节点使用。

1. 在自己的电脑上准备私有目录。复制 `inputs.example.json` 为私有 `inputs.json`，填写 ikuuu、云梯原始订阅和 Mars 参数。
2. 有旧 Loon 配置时，把手机导出作为 `--source`，可保留原证书、Host、规则与插件状态。新安装可以把公开模板作为 `--source`，生成器会用本地输入替换占位的 Mars 和订阅地址。
3. 运行 Python 3：

```sh
python3 tools/build_premium.py --source private/current-phone.lcf --inputs private/inputs.json --cache-dir private --refresh --output private/Loon_Mars_R2.lcf --manifest private/build_manifest.json
```

`--refresh` 只向机场原始地址获取订阅，不调用在线转换。当前支持原生 Loon 节点文本，以及本次使用的 SS/VMess URI；遇到不能安全处理的 URI 参数会报错，不静默降级。

已有私人源配置的 Mars 参数以源文件为准；`inputs.json` 中的 Mars 用于从公开占位模板新建。已有 P12、密码和插件状态原样保留。覆盖已有输出之前自动备份，私人输出权限为 0600。

## 更新的边界

**链路采用本地节点快照。** 仅在手机更新机场订阅，不会更新这些本地前置的服务器、密码等参数。机场改参数、节点新增/删除/改名时，应从原始订阅重新生成，再同步/导入新配置。这样原始订阅变化不会把现有链静默缩成单独 Mars。

住宅代理只需修改本地 Mars-ISP；所有完整链都引用它。正常规则、插件仍可在 Loon 中分别更新。私人配置包含订阅、节点凭据，可能还有 CA 私钥，不能上传公开仓库。公开模板整体更新也不应自动覆盖手机私人配置。

## 使用与手机验证

保持规则模式。AI-Mars 默认选 Mars-亚洲自动（PCC，检测完整链，600 秒间隔，10 秒超时），也可手动固定某条完整链。普通国际流量使用普通代理；未知流量的兜底默认仍为 AI-Mars。Mars 和完整链禁止业务 UDP，不回退直连；HY2 前置自身的 UDP 传输与业务 UDP 是不同层次。

首次导入后必须保存，再检查 `[Proxy Chain]`：每条仍应有 `前置 · 机场 · 节点,Mars-ISP` 两跳。两跳不完整就停用，不能只看配置导入成功。

然后测试 api.ipify.org 出口、ChatGPT/Gemini/Grok 和流式回答；检查失败前置切换、Mars 失效时不绕行、锁屏与 Wi-Fi/蜂窝恢复。**R2 目前只有静态检查和桌面辅助证据，手机导入回存及连通性仍待确认。**

源配置若已有受信任的 Loon P12，保留同一证书后通常不用重装；没有证书的模板用户应在手机生成、安装并完全信任自己的证书。只解密去广告确需的主机，AI 域名不解密。证书步骤见 [Apple 官方说明](https://support.apple.com/zh-cn/102390)。

## 去广告和墨鱼扩展

公开基础模板引用奶思原生 Loon 插件、Repcz 分流规则及官方 Script Hub；以旧配置为源时保留该文件自己的插件列表。本次私人修订沿用原有 Shiina/墨鱼微博与微信补充、SideStore 和其他已启用工具，没有另外叠加一套微博处理。

作者提供原生 `.plugin`/`.lpx` 时添加原始 URL；只有公开 QX 重写时，通过本机 Script Hub 转换。不要向任何转换入口提交含订阅、节点密码或证书的完整配置。同一 App 的去广告不要盲目叠加。

恢复时切回先前备份的可用配置。R1 已发现丢前置问题，不能作为“已验证可用”的回退目标；可使用此前已工作的 Egern 或更早的 Loon 原配置。

## 依据

- [Loon 本地节点格式](https://nsloon.app/docs/Node/)
- [Loon 官方示例](https://github.com/Loon0x00/LoonExampleConfig/blob/master/example2.lcf)
- [策略组](https://nsloon.app/docs/Policy/policygroup/)、[订阅](https://nsloon.app/docs/Node/subscription/)
- [奶思](https://github.com/fmz200/wool_scripts/tree/main/Loon)、[Repcz](https://github.com/Repcz/Tool/tree/X/Loon/Rules)、[Script Hub](https://github.com/Script-Hub-Org/Script-Hub)、[墨鱼](https://ddgksf2013.top)
