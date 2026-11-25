# 奶思精简主模板

当前版本 **2026.11.25-r2**，保留原 [Loon_Mars.template.conf](Loon_Mars.template.conf) 地址。模板采用当前私人配置的结构，并把全部订阅、家宽信息替换为占位值，省去私人证书。

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
- 去广告更新：更新奶思插件；主模板不加载额外补充、诊断工具或独立定时脚本。
- 模板版本：文件最开头写明版本、北京时间、变更及结构。

本次更新的是 GitHub 公开模板；已有 iCloud 私人配置保持原样。请先备份私人配置，再按需要采用模板变化。

## 旧方案

旧 R1/R2 本地节点快照、多链展开和生成器均已归档。历史失败原因包括裸订阅节点名在回存时丢失，以及家宽用户名额外引号。新模板通过正式策略组作为链首，保持裸写用户名。完整记录见 [精简前版本](https://github.com/ShiinaWong/stash-configs/tree/371ad47aa94d8fa075ca557ef4352c00527dca27/loon/mars)。

## 来源

- [奶思基础配置](https://github.com/fmz200/wool_scripts/blob/main/Loon/config/Loon.conf)
- [奶思去广告插件](https://github.com/fmz200/wool_scripts/blob/main/Loon/plugin/blockAds.plugin)
- Loon 官方：[订阅](https://nsloon.app/docs/Node/subscription/)、[筛选器](https://nsloon.app/docs/Node/nodefilter/)、[策略组](https://nsloon.app/docs/Policy/policygroup/)、[插件](https://nsloon.app/docs/Plugin/)
