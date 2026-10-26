# Shiina Loon 去广告补充

这是配合 fmz200（奶思）广告拦截&净化合集使用的独立补充插件。沿用 Loon Rewrite v2 / Script v2 配置方式，不复制或镜像奶思合集。

## 当前状态

- 版本：v0.1.0（2026-10-26）。
- 生效规则、脚本、额外 MitM 主机均为 **0**。
- 已建立固定订阅入口。当前没有任何 App 的新增去广告效果，也没有宣称已完成手机端导入测试。
- 要求 Loon 3.5.1（983）或以上；这是新版 Script 语法的最低版本。
- 奶思主插件继续独立订阅，补充插件仅维护确认需要的差异。

## 订阅与安装

固定地址：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/loon/shiina-adblock-supplement.plugin
```

[一键导入 Loon](https://www.nsloon.com/openloon/import?plugin=https%3A%2F%2Fraw.githubusercontent.com%2FShiinaWong%2Fstash-configs%2Fmain%2Floon%2Fshiina-adblock-supplement.plugin)

作为插件添加并启用；不要作为完整配置或节点订阅导入。后续更新这个插件资源即可获取变更，不必重复安装。当前版本没有规则，插件排列顺序不影响效果；以后如有顺序要求，会随对应规则明确说明。

## 后续如何添加规则

1. 接收 App 名称及版本、广告出现位置、复现步骤和相关抓包；原始材料仅用于分析，不提交到此公开仓库。
2. 区分原始响应与最终响应：广告字段存在或 HTTP 200 本身不等于广告最终展示。先核对奶思当时版本是否已处理、是否命中，以及脚本执行是否报错。
3. 只补充确认遗漏的接口，按 App 分组。匹配精确主机和路径，必要时再加请求方法、响应类型及结构条件；避免为处理一个广告封锁整个业务域名。
4. 每个 App 的 Rewrite / Script 按需绑定独立开关。关闭开关不一定移除 MitM 主机；完整回退可停用整个补充插件。只加入所需的精确 MitM 主机，不配置通配解密。
5. 对响应体处理使用合成或彻底脱敏的样本检查：去掉广告、保留正常业务数据；缺字段、非预期结构或解析异常时保留原响应。
6. 提交后记录为“待真机验证”，由用户更新订阅，检查广告效果和正常功能，再记录实测结果。播放、登录、评论、支付等功能需按改动范围检查。
7. 奶思后续覆盖同一接口时，重新比对并移除多余补充。修改日期、版本及变更记录；固定订阅 URL 不变。

## 与奶思同时使用时的边界

Loon 官方文档指出：同一响应最多选择一条 Response Script，并保持原配置顺序。因此不能假定“奶思先处理一次，补充脚本再处理一次”。

遇到相同接口时，先确认现有 Rewrite 和 Script 的交互与执行顺序。优先采用不重叠的补充；确实需要接管时，应明确替代范围、保留原有必要功能，并说明禁用/调整哪些重复条目。不要仅靠拖动顺序宣称兼容。

本项目不做账户权限修改，也不以屏蔽正常业务功能代替去广告。新增规则以稳定和可回退为目标。

## 公开内容范围

此目录仅存放通用匹配规则、脚本、合成测试样本和维护说明。
不得提交原始 HAR/PCAP/ZIP/持久化记录、完整个人配置、Cookie、Authorization、Token、设备/用户标识、带鉴权查询参数的 URL、机场订阅地址或 Mars 节点凭据。
公开的匹配规则只保留功能必需的通用域名、路径和字段。

## 已发布规则

暂无。收到新的抓包并完成分析后再添加。

## 参考

- [Loon 插件](https://nsloon.app/docs/Plugin/)
- [Loon Rewrite v2](https://nsloon.app/docs/Rewrite/rewrite_v2/)
- [Loon Script v2](https://nsloon.app/docs/Script/script_v2/)
- [奶思项目](https://github.com/fmz200/wool_scripts)
- [变更记录](CHANGELOG.md)
