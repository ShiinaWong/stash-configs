# 奶思精简主模板

当前版本 **2026.11.25-r6**：[最新版](Loon_奶思家宽_2026.11.25-r6.template.conf)；[上一版 r5 备份](Loon_奶思家宽_2026.11.25-r5_上一版备份.template.conf)。每次交付生成新文件名，核验后只保留这两份，更早的废弃版从当前目录删除。模板仅含占位信息，私人凭据与证书留在本地。

## 填写与使用

1. 将模板保存到本地副本，填写 `[Remote Proxy]` 中云梯、ikuuu 的原始订阅地址。
2. 在 `[Proxy]` 填写家宽 SOCKS5。用户名采用裸写格式，密码保留双引号；这是此前在 Loon 3.5.3（1014）对照试验确认可用的格式。
3. 保留本机原已受信任的 Loon 证书，或在手机生成、安装并信任新证书。真实凭据与证书只保存在私人副本。
4. 导入后更新两个机场订阅，保持分流模式。确认 `机场自动` 有候选，`境外家宽` 仍是两跳。
5. 用出口检查网页核对家宽出口，再检查 Google 和常用应用。

候选筛选依赖机场提供的名称。候选为空时先核对订阅是否更新成功、节点名是否符合亚洲专线条件。`机场自动` 的测速衡量第一跳，完整家宽链的可用性仍需实际请求检查。

## 日常维护

- 机场更新：在 Loon 节点列表维护云梯和 ikuuu 两个远程订阅。
- 家宽变更：只修改本地节点 `家宽出口`。
- 去广告更新：更新奶思和 Shiina 补充两个插件；补充可在插件参数中关闭不用的应用项。旧诊断工具保持停用。
- 模板版本：文件最开头写明版本、北京时间、变更及结构。

本次 GitHub 和 iCloud 均生成 r6。手机请选择 `Loon_奶思家宽_2026.11.25-r6.lcf`，两边均保留 r5 原样备份。主配置只增加一个手动家宽出口检测插件，机场、家宽链、DNS、证书及原有规则保持。检测用法见 [说明](../docs/ipquality.md)。新增功能和 Safari 设置见 [Quantumult 对照记录](../docs/quantum-comparison-20261125.md)。

## 旧方案

旧 R1/R2 本地节点快照、多链展开和生成器均已归档。历史失败原因包括裸订阅节点名在回存时丢失，以及家宽用户名额外引号。新模板通过正式策略组作为链首，保持裸写用户名。完整记录见 [精简前版本](https://github.com/ShiinaWong/stash-configs/tree/371ad47aa94d8fa075ca557ef4352c00527dca27/loon/mars)。

## 来源

- [奶思基础配置](https://github.com/fmz200/wool_scripts/blob/main/Loon/config/Loon.conf)
- [奶思去广告插件](https://github.com/fmz200/wool_scripts/blob/main/Loon/plugin/blockAds.plugin)
- Loon 官方：[订阅](https://nsloon.app/docs/Node/subscription/)、[筛选器](https://nsloon.app/docs/Node/nodefilter/)、[策略组](https://nsloon.app/docs/Policy/policygroup/)、[插件](https://nsloon.app/docs/Plugin/)
