# Shiina Loon 去广告补充

配合 fmz200（奶思）广告拦截&净化合集使用的独立补充插件。固定订阅地址不变，采用 Loon Rewrite v2 / Script v2。

## 当前版本：v0.3.0（2026-10-26）

微博部分改为直接引用 Quantumult 配置所用的墨鱼 `weibo_json.js`，替换 v0.2.0 的自写字段处理。规则、脚本的原作者为 **ddgksf2013、zmqcherish**；本项目维护 Loon 匹配范围与整合配置。

- 开屏预加载：保留广告条目及 ID，沿用原脚本的展示日期、时长、次数处理。
- 国际版广告配置：沿用原脚本整体替换 `data` 的处理。
- 新增实际时间线、卡片和两种旧 SDK 的脚本入口；处理实时开屏与专用广告接口。
- `open_app` 改为原脚本的详情横幅处理，不再猜测五个广告配置开关。
- 仅选择广告相关入口；没有接入原脚本的会员皮肤、个人主页、搜索页整体改造入口。
- 7 条响应脚本配置共享同一个上游脚本，3 条请求复写、3 条微博分流规则、11 个精确 MitM 主机。
- 最低版本：Loon 3.5.1（983）。本版没有修改代理链、机场订阅或 DNS 设置。
- 11 项测试通过；101 条私有会话本地回放，匹配并修改 4 条，无脚本异常，其余 97 条不匹配。
- **v0.2.0 已收到真机仍有广告的反馈；v0.3.0 的真机效果仍待验证。**

## 安装或更新

固定插件地址：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/loon/shiina-adblock-supplement.plugin
```

[一键导入 Loon](https://www.nsloon.com/openloon/import?plugin=https%3A%2F%2Fraw.githubusercontent.com%2FShiinaWong%2Fstash-configs%2Fmain%2Floon%2Fshiina-adblock-supplement.plugin)

已安装时更新原插件，确认描述显示 **v0.3.0**，无需重复添加。保持两个插件参数开启、Loon MitM 和证书信任正常；更新时要让新增的上游脚本下载成功。退出微博国际版后重新启动，再检查冷启动和下拉刷新。

奶思大合集继续独立订阅。本次比对的大合集只有另一主机 `overseas.weico.cc` 的 Weico 条目，与本版脚本入口不重叠。若另外启用了微博专用插件或 Script-Hub 转换的微博重写，应先停用其重复条目。本插件不是同一响应的“第二遍处理”：Loon 同一响应只选择第一条命中的响应脚本，响应正文复写也可能阻止响应脚本执行。

## 开关和回退

- 「微博净化脚本与复写」控制本插件的微博 Script / Rewrite。
- 「微博信息流与详情广告」单独控制时间线、卡片及 `open_app`。
- **两个参数都不移除固定分流和 MitM。完整回退请停用整个补充插件。**
- 与 QX 相同，`sdkapp.uve.weibo.com` 使用 DIRECT 以供脚本处理；另有两条专用广告域名拒绝规则。若其他本地规则或插件先拦截此主机，应检查冲突。
- 原脚本也会清理部分推荐、热推与推广 UI；这不等同于只删除所有标为“广告”的内容。需要回退信息流净化时关闭第二个开关。
- 已缓存的广告或配置不会因停用/更新插件立即从 App 存储中删除。有内置清理缓存功能时可使用，无需先卸载 App。

## 维护与隐私

只发布通用匹配规则、合成测试、公开上游地址及脱敏结论。原始 HAR/ZIP、登录返回、Cookie、Token、完整个人配置、订阅地址和节点凭据不得进入公开仓库。

新增补充先比对现有合集和实际接口，确认匹配范围、脚本冲突和正常业务影响。合成测试或本地回放通过后，仍须真机验证，不能仅凭 HTTP 200 或原始正文判定广告是否显示。

## 来源与测试

- [本版微博对比与验证记录](docs/weibo-intl.md)
- [墨鱼微博 QX 配置](https://github.com/ddgksf2013/Rewrite/blob/master/AdBlock/WeiboAds.conf)
- [本版实际引用的墨鱼脚本](https://github.com/ddgksf2013/Scripts/blob/0cddbb6bc31344315afba773ebb4e7ce29f7fd8f/weibo_json.js)
- [Loon Script v2](https://nsloon.app/docs/Script/script_v2/)
- [Loon Rewrite v2](https://nsloon.app/docs/Rewrite/rewrite_v2/)
- [变更记录](CHANGELOG.md)

脚本固定到已核对的公开提交，不随上游 master 自动变化；后续更新先核对再调整版本。仓库不镜像脚本正文。

测试（仓库根目录，Node.js 18+，联网下载上述固定脚本）：

```sh
node --test loon/tests/weibo-qx-compat.test.cjs
```

也可指定提前下载的同一脚本：`WEIBO_UPSTREAM_SCRIPT=/path/to/weibo_json.js`。测试会校验 Git blob SHA，防止拿不同版本误报通过。

