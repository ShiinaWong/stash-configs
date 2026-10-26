# v0.4.0：QX 到 Loon 的第二批补充

日期：2026-10-26。此记录区分源码比对、离线验证和手机效果；后者尚待确认。

## 审阅来源

| 来源 | 审阅版本 |
| --- | --- |
| ddgksf2013 AmapAds.conf | V1.0.28 |
| ddgksf2013 amap.js | V1.0.34，提交 `0cddbb6bc31344315afba773ebb4e7ce29f7fd8f`，blob `578533ad02749c09431997fc3ab70421d51953da` |
| ddgksf2013 CaiYunAds.conf / caiyun_json.js | V1.0.8；脚本 blob `e81944020195ff7956598255fe7bfa425d9cbeb1` |
| [ddgksf2013 bdpan.ads.js](https://ddgksf2013.top/scripts/bdpan.ads.js) | V1.0.5，当日读取；仅作接口及字段参考，不远程加载该脚本 |
| [fmz200 blockAdsV2.plugin](https://github.com/fmz200/wool_scripts/blob/c3f8128dd03c6b3cb35821c347968282cc45b34f/Loon/plugin/blockAdsV2.plugin) | 提交 `c3f8128dd03c6b3cb35821c347968282cc45b34f`，blob `0eeb11f1fe45618966ba3d4a2f7c6d9c86b1ee45` |

## 高德

直接调用固定的墨鱼 amap.js，只匹配 QX 原有 MitM 列表中的五个主机：m5.amap.com、m5-zb.amap.com、center.amap.com、amap-aos-info-nogw.amap.com、ai.amap.com。

八类响应入口：

- ws/message/notice/list：底部角标。
- ws/shield/frogserver/aocs/updatable：首页推广与部分 AI 配置。
- ws/shield/search/nearbyrec_smart：附近页活动和优惠模块。
- ws/promotion-web/resource：打车页推广资源。
- ws/faas/amap-navigation/main-page：首页卡片；保留 LoginCard、FrequentLocation。
- ws/msgbox/pull：顶部信息条。
- ws/shield/dsp/profile/index/nodefaas：我的页；保留 MyOrderCard、GdRecommendCard。
- ws/shield/search/new_hotword：搜索热词。

另补充专用信息流、路线规划卡片、搜索场景推荐、Tip 和广告归因请求拦截。

这是一套包含推荐/界面精简的处理，会隐藏部分非广告入口。实际路线计算与地图业务接口不在新增 URL 匹配范围内；这不是对所有 App 功能无影响的承诺。

奶思已经拒绝 m5.amap.com/ws/valueadded/，因此没有添加会被该规则挡住的同路径开屏响应脚本。也没有照搬 QX 中的 optimus-ads DIRECT 或 amdc 处理。

## 彩云天气

奶思的两个 activity 规则继续负责原有活动接口。补充只处理 starplucker.cyapi.cn 的七类推广/推荐响应及 ad.cyapi.cn 的独立广告请求。

参考原脚本字段，自有适配保留响应外层元数据：

- 清空已存在的 homefeatures、banners 数据数组。
- 清空 message_center.messages、cypage.popups/actions。
- 发现页 feeds 沿用“人查看”标记保留文章；缺少已知字段的记录保留。
- features、campaigns 保留 cy:// 原生功能及未知结构，过滤已识别的外链入口。

不接入原脚本会员修改接口，不植入其固定文章和固定驾驶天气卡片。这个版本同样包含推荐精简，并非只删除带“广告”字样的条目。

## 百度网盘

补充三类响应：

1. api/getsyscfg：仅清空名称以 ad_、advertise_、splash_ 开头的配置段中已有的 cfg_list。使用前缀匹配，避免把 download_area 中的 ad_ 误认为广告；保留导航、普通配置及未知字段。
2. feed/cardinfos：仅在识别到 product/recent 卡片时精简已知首页结构，保留这两类和没有 source 字段的未知记录；完全陌生的结构不处理。
3. api/taskscore/tasklist：清空任务推广列表，保留分数及外层元数据。

另拒绝专用热搜、搜索填词、金币通知和短剧列表入口。

没有整体拒绝 getconfig/getsyscfg；未接入游戏会员、账号、文件上传下载、播放倍速或会员状态修改。奶思已有的 afd 和 pcs 广告规则不重复添加。

## 与奶思的静态检查

测试对上述固定奶思版本抽取可解析的 Rewrite/Script URL 正则，确认 18 类新增响应入口的代表性 URL 不被它们再次处理；同时验证刻意保留给奶思的入口没有被本补充匹配。该检查不涵盖其他插件、本地规则、当前手机缓存或将来的奶思更新。

上游 V2 中有 190 条 Script 行使用裸参数形式 enable=xxx，其中 optimizeRequest 未在 Argument 声明。当前官方文档要求动态 Boolean 使用 enable=${xxx}。这是静态兼容性疑点，需要手机实际加载版本和解析日志来判断影响；本项目没有据此宣称 190 条全部失效，也没有重写整个奶思合集。

本版新增参数全部采用官方引用格式。独立补充不能修正另一插件内部的解析错误。若奶思日志出现这些参数相关错误，应先处理奶思加载问题，再评价整套去广告范围。

## 测试与真机验证

共 24 项 Node.js 测试通过，包括已有 11 项微博回归和新增 13 项：URL 范围、开关、状态码、已知奶思冲突、固定高德原脚本执行、彩云/网盘错误数据和未知格式保留等。

合成数据只证明已知结构下的处理逻辑，不证明当前 App 所有广告都使用这些接口。没有执行 Loon 官方解析器或手机抓包回放；需要在手机确认更新、脚本下载、MitM 命中及页面效果。

建议依次验证：

1. 高德：首页、附近、搜索热词，以及一条正常路线规划。
2. 彩云：首页、发现页，以及正常天气预报。
3. 百度网盘：首页推荐、任务入口，以及文件列表和一次普通下载。

有异常先关闭相应应用开关后对照。日志只需要确认 Shiina-高德、Shiina-彩云、Shiina-网盘 标签；公开反馈不要包含账号、Cookie、Token、坐标或个人文件信息。
