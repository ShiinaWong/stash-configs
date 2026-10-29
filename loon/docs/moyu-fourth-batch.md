# 第四批：联通、墨迹天气和车来了

版本：v0.6.0，2026-10-29。继续配合奶思 V2；不导入整份 Quantumult 配置。

## 已核对的来源

墨鱼 Rewrite 固定提交：`dc3ea2c1fb2db870676b26da24006083eb1d44d3`。

| 来源 | 作者版本 | Git blob SHA |
| --- | --- | --- |
| [ChinaUnicomAds.conf](https://github.com/ddgksf2013/Rewrite/blob/dc3ea2c1fb2db870676b26da24006083eb1d44d3/AdBlock/ChinaUnicomAds.conf) | V1.0.4，2025-12-11 | `4dd865cc67e7054e8cf4693a4c3f6786b72b349b` |
| [MoJiWeatherAds.conf](https://github.com/ddgksf2013/Rewrite/blob/dc3ea2c1fb2db870676b26da24006083eb1d44d3/AdBlock/MoJiWeatherAds.conf) | V1.0.2，2025-11-03 | `d0b15932dcd18660202edd4de85eb1d4fd722798` |
| [CheLaiLeAds.conf](https://github.com/ddgksf2013/Rewrite/blob/dc3ea2c1fb2db870676b26da24006083eb1d44d3/AdBlock/CheLaiLeAds.conf) | V1.0.2，2025-10-09 | `74802cdaf05868b9b2a1cda3eeaa523e22d6b1ee` |
| [奶思 blockAdsV2.plugin](https://github.com/fmz200/wool_scripts/blob/c3f8128dd03c6b3cb35821c347968282cc45b34f/Loon/plugin/blockAdsV2.plugin) | 文件日期 2026-10-25 | `0eeb11f1fe45618966ba3d4a2f7c6d9c86b1ee45` |

车来了底栏脚本也已检查：[chelaile.js V1.0.2](https://github.com/ddgksf2013/Scripts/blob/0cddbb6bc31344315afba773ebb4e7ce29f7fd8f/chelaile.js)，blob `19310afbb13ac1877762ae6b2355fc1c48bb3673`。本版没有引用或镜像该脚本。

Loon 语法参照官方 [Script v2](https://nsloon.app/docs/Script/script_v2/)、[Rewrite v2](https://nsloon.app/docs/Rewrite/rewrite_v2/)、[插件参数](https://nsloon.app/docs/Plugin/)和 [MitM 指南](https://nsloon.app/docs/MitM/)。

## 采用与保留

| 应用 | 采用 | 明确保留或暂不采用 |
| --- | --- | --- |
| 中国联通 | 已知热搜数组、首页营销背景与商城角标、新人推广接口 | 钱包、积分、彩铃、设备信息、新用户业务数据、客服通知及首页 JavaScript |
| 墨迹天气 | 浮窗、商品推广、`banner区` | `工具区`、`我页面灯泡`、未知区域、天气数据、发现页、短视频及 TNC |
| 车来了 | 四个明确主机的推广位、详情信息流、奶思未覆盖的 adpub 路径 | 公交查询、路线规划、底栏、共享 IP 及已由奶思处理的 atrace |

联通 `HomeFusion.backGroundQuery` 和 `HomeFusion.bottomLabel` 是包含点的字面键名；不会把普通嵌套对象误当成这些键。只清空已存在且为数组的热搜字段。

墨迹作者使用 API 子域名通配。此处限定到 `*.api.moji.com`，规则排除奶思已经拒绝的 `me.api.moji.com` 关键词、`ad.api.moji.com` 和 `fds.api.moji.com` 及后者子域名。排除关键词也包含 `home.api.moji.com` 这样的包含关系，保持与基准奶思行为一致。没有扩大到其他 Moji 主机或所有天气请求。

车来了原脚本按标题白名单保留「首页」「我的」「路线规划」，会删除其他未知底栏项。本版没有采用这种整页精简，也没有采用固定共享 IP 的路径拦截。

航旅纵横的通用业务网关处理继续暂缓；未经字段及真实响应审查，不加入本轮。

## 脚本与匹配

新增自有 `moyu-extra-clean-v0.6.0.js` 只处理联通两个接口、墨迹一个接口。仅成功的 HTTP 200 JSON 对象进入字段处理；已知业务错误、未知结构、JSONP、解析失败保持原响应。无网络调用、存储或正文日志；没有会员修改。

三组墨鱼增量合计 2 条响应脚本、9 条请求复写、6 个 MitM 条目（5 个精确主机和 1 个 API 子域名通配）。微信新增项单列于[微信素材记录](wechat-dxm-assets.md)。此前 36 条 request/response 指令、微博分流及旧脚本保持不变。

与固定奶思版本对照时，解析并检查其全部可由 Node.js 解析的 URL 条件，同时检查 DOMAIN、DOMAIN-SUFFIX、DOMAIN-KEYWORD 拒绝规则；相关的不可解析规则不得静默略过。检查的是这一固定快照，不能保证未来上游变化仍无冲突。

## 验证与回退

新增 12 项离线测试，含 4 个响应 URL 和 15 个请求 URL 的代表样例、邻近路径、主机伪匹配、参数开关、业务错误、正常业务保留及幂等性。墨迹测试主机是合成样例，不宣称其真实存在。本轮这三个 App 没有新真机响应样本，也未运行 Loon 官方解析器。

三组开关默认开启。异常时关闭对应的「中国联通推广」「墨迹天气推广」「车来了广告补充」，再重新打开 App 对照。参数只控制 Script / Rewrite，不移除 MitM 主机；完整停用须关闭整个插件。
