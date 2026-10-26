# 微博国际版：对照 Quantumult 的修订 v0.3.0

## 找到的配置来源

本地提供的 Quantumult 导出启用了：

```text
https://github.com/ddgksf2013/Rewrite/raw/master/AdBlock/WeiboAds.conf
```

同时启用了墨鱼开屏合集、Cats-Team 广告域名过滤，并有本地 `sdkapp.uve.weibo.com` 的 DIRECT 规则。本次确认微博专用配置的引用关系，读取其当前公开脚本；导出文件不包含当时缓存的远程脚本正文，因此不能证明历史缓存与今天的公开版本完全相同。

本次核对：
- `WeiboAds.conf` V2.0.114，Git blob：`a754f7e62bdb44c36e7bdb56967e8e7f2fa24bc6`。
- `weibo_json.js` V2.0.142，Git blob：`2e2fcb24a34b6b60ea9b23c1af049947660e0061`。
- 固定引用提交：`0cddbb6bc31344315afba773ebb4e7ce29f7fd8f`。
- 原作者：ddgksf2013；上游声明基于 zmqcherish 的原创脚本优化。

## v0.2.0 与 QX 实际处理的差别

| 接口或功能 | v0.2.0 | QX 原脚本 / v0.3.0 |
| --- | --- | --- |
| 开屏 `ad/preload` | 清空 ads 数组 | 保留广告条目和 ID；调整展示日期，展示时长、每日/总次数置 0；间隔设为 86400 |
| `get_coopen_ads` | display_ad 置 0，只清空部分数组，保留广告平台与场景配置 | 将整个 data 替换为 `{display_ad:1}` |
| `open_app` | 按字段名称推测五个广告开关置 0 | 删除 close_ad_setting，清空存在的 detail_banner_ad |
| 信息流 | 没有时间线正文过滤 | 原脚本根据广告标记过滤 statuses、cards、items，并清理部分推荐元素 |
| 旧广告 SDK | 没有处理 | 接入 sdkad.php 与 wbpullad.lua；PHP SDK 响应保留 OK 后缀 |
| 实时开屏、专用广告接口 | 没有处理 | 加入 QX 对应的请求复写 |

`display_ad:1` 是原脚本与整体替换 data 配套的返回值，不能仅凭这个字段的名字推断应该改成 0。v0.2.0 的字段修改本地执行成功，并不说明客户端会按预想行为工作。已收到该版仍有开屏和信息流广告的反馈。

本版直接引用同一上游脚本，移除旧自写脚本。没有宣称完整移植 QX 的所有净化功能：个人主页、会员皮肤、热搜/搜索页整体改造等入口未加入。

## 当前匹配范围

- 开屏：三个精确 boot 主机的版本化 `/ad/preload`，以及 `/ad/realtime` 拒绝规则。
- 广告配置：`weibointl.api.weibo.cn/com` 的 `get_coopen_ads`。
- 详情横幅：`weibointl.api.weibo.cn/portal.php?a=open_app`。上游函数分派要求 a 为首个参数；配置保留这个限制，不假装支持未实现的参数换序。
- 旧 SDK：`sdkapp.uve.weibo.com/interface/sdk/sdkad.php` 与 `wbapp.uve.weibo.com/wbapplua/wbpullad.lua`。
- 信息流：api/mapi.weibo.cn/com 的 friends_timeline、friends/timeline、unread_friends_timeline、unread_hot_timeline、groups/timeline、cardlist、container_timeline、container_timeline_topic、video_mixtimeline。
- 拒绝：实时开屏、版本化 `ad/preload` / `ad/weibointl`、sdkconfig.php。
- 三条分流沿用 QX 的 SDK DIRECT、adstrategy.biz.weibo.com REJECT、api.touch-moblie.com 后缀 REJECT。
- 11 个精确 MitM 主机，没有泛化为整个 *.weibo.com。

脚本自身会清理一些推荐、热推和推广 UI，因此并非仅对带广告标记的帖子做最小过滤。登录接口、用户中心、个人主页、普通长文接口没有新增脚本入口；正常业务仍需真机复核。

## 与其他插件配合

核对奶思 `blockAdsV2.plugin`，Git blob `0eeb11f1fe45618966ba3d4a2f7c6d9c86b1ee45`。其中只有 `overseas.weico.cc/portal.php?a=get_coopen_ads` 的 Weico 条目，本版不接管该主机。

奶思独立 `weibo.plugin` 与大合集不同，可能与本版重复。Loon 官方说明：Request / Response 各自最多选一条脚本，按原配置顺序命中；Response Body Rewrite 命中也会禁止 Response Script。因此不要把两份微博专用净化同时打开后假定它们串行执行。

已有广告域名过滤可能在请求到达响应脚本之前阻断主机。QX 的 SDK DIRECT 被保留；若 Loon 日志显示其他本地规则先 REJECT，应先排查具体冲突。没有完整的当前 Loon 配置，不能保证所有已装插件都已核对。

## 验证记录

11 项合成测试直接运行固定版本的上游脚本，并校验其 Git blob SHA；覆盖匹配范围、开关、SDK OK 后缀、开屏展示限制、配置整体替换、详情横幅、时间线和卡片过滤。合成数据均不来自用户会话正文。

私有抓包包含 101 组会话，客户端标识为 WeiboOverseas/7.2.2 和 Weibo intl./7.2.2.1。本地回放：
- 匹配并修改 4 个成功响应，脚本异常为 0；97 个其他会话不匹配。
- 两个开屏响应分别保留 16、15 个广告条目及其 ID，全部展示次数与时长归零，并更新展示日期。
- 广告配置的 data 最终为 `{display_ad:1}`。
- open_app 原响应存在 close_ad_setting，脚本已删除；该样本不存在 detail_banner_ad。
- 抓包没有信息流广告卡片的响应正文；信息流只完成合成测试，不能据此声称真机已去除。

本地 Node VM 回放验证的是规则匹配与脚本输出，不能代替 Loon 解析、MitM、脚本下载、缓存以及手机展示结果的验证。原脚本遇到坏 JSON 或未预料结构仍可能抛错，本版不改写其异常行为。

## 手机检查与回退

1. 更新「Shiina 去广告补充（V2）」，确认描述为 v0.3.0，两个开关开启，上游脚本已下载。
2. 保持 Loon MitM 和证书信任正常，停用重复的微博专用插件；奶思大合集可继续开启。
3. 退出微博国际版，重新打开等待配置请求完成，再测试冷启动及刷新信息流。有内置清理缓存功能时可清理旧广告缓存。
4. 若仍有广告，下一步核对相应请求是否命中本版条目、是否完成 MitM、脚本是否报错及最终响应。不要只看未修改的原始正文或继续盲目叠规则。
5. 信息流显示异常时可关闭第二个开关；完整回退需停用插件，再重启 App 获取原始配置。

插件两个参数只控制 Script / Rewrite，不撤销固定分流和 MitM。已缓存的 App 数据也不会自动回滚。

## 上游与文档

- [墨鱼 QX 微博配置](https://github.com/ddgksf2013/Rewrite/blob/master/AdBlock/WeiboAds.conf)
- [本版使用的墨鱼脚本](https://github.com/ddgksf2013/Scripts/blob/0cddbb6bc31344315afba773ebb4e7ce29f7fd8f/weibo_json.js)
- [Loon Script 执行规则](https://nsloon.app/docs/Script/script_v2/)
- [Loon Rewrite v2](https://nsloon.app/docs/Rewrite/rewrite_v2/)

