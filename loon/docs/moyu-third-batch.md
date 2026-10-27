# 第三批：奶思基础上的墨鱼增量（v0.5.0）

审阅与发布日期：2026-10-27。维护方向为奶思 V2 主插件加 Shiina 补充；本次不是把墨鱼全部配置合并。插件固定订阅地址不变。

## 对照来源

奶思基准：[blockAdsV2.plugin](https://github.com/fmz200/wool_scripts/blob/c3f8128dd03c6b3cb35821c347968282cc45b34f/Loon/plugin/blockAdsV2.plugin)，文件日期 2026-10-25，Git blob `0eeb11f1fe45618966ba3d4a2f7c6d9c86b1ee45`。本次读取 main 时该文件内容仍与此基准一致。

墨鱼 GitHub 配置固定在 Rewrite 提交 `dc3ea2c1fb2db870676b26da24006083eb1d44d3`：

| 来源 | 上游版本 | Git blob |
| --- | --- | --- |
| [GoofishAds.conf](https://github.com/ddgksf2013/Rewrite/blob/dc3ea2c1fb2db870676b26da24006083eb1d44d3/AdBlock/GoofishAds.conf) | V1.0.11 | `ce30ad9526c707e5856f16fd6ff421ed1cc902e6` |
| [NeteaseMailAds.conf](https://github.com/ddgksf2013/Rewrite/blob/dc3ea2c1fb2db870676b26da24006083eb1d44d3/AdBlock/NeteaseMailAds.conf) | V1.0.2 | `b255b1813530fe6df1ffbc049981272bdae16aaf` |
| [QiShuiMusicAds.conf](https://github.com/ddgksf2013/Rewrite/blob/dc3ea2c1fb2db870676b26da24006083eb1d44d3/AdBlock/QiShuiMusicAds.conf) | V1.0.6 | `1f835599bc803e447b14df8c0507708b71bf385d` |
| [TaoPiaoPiaoAds.conf](https://github.com/ddgksf2013/Rewrite/blob/dc3ea2c1fb2db870676b26da24006083eb1d44d3/AdBlock/TaoPiaoPiaoAds.conf) | V1.0.5 | `2f0d0e914b7aa26733297145008752770de2aeb7` |

另外读取作者网站两份配置；网站文件没有固定提交，记录下载时 SHA-256，未将源文件镜像进本仓库：

| 来源 | 版本 | SHA-256 |
| --- | --- | --- |
| [TencentDocAds.conf](https://ddgksf2013.top/rewrite/TencentDocAds.conf) | V1.0.2，2026-04-03 | `b5efddc22620ab939560ea5cf6b606a18b556a64677a7bb8e071279d62e1634f` |
| [iDailyAds.conf](https://ddgksf2013.top/rewrite/iDailyAds.conf) | V1.0.1，2026-01-16 | `26f77fd2d9111862e708805bbe8dc2c68efaa035aeaf4cecfaaf0fa0fd0cda64` |

接口和字段来自上述作者配置。新增 JavaScript 为独立实现，提供字段存在性检查、成功响应检查和异常保留；不是直接运行 QX 的 jq 表达式，也不依赖 Script Hub 在线转换。微博、高德继续引用旧版已审阅的固定上游脚本。

## 采用与避让

| 应用 | 本次采用 | 有意不加入 |
| --- | --- | --- |
| 闲鱼 | g-acs 开屏、ad.expose；g-acs 的 strategy.list / search.shade / item.search.activate / search.discover；两主机 item.recommend 中 `mamaAD` 卡片 | 奶思已有的首页/同城/搜索信息流、acs 同名搜索推广、recommend.list；不新增个人页白名单精简、整段买家信息流删除或 AMDC |
| 网易邮箱大师 | page/*conf.do 的四类运营推广字段；任务推广和 function.do 悬浮入口 | 奶思的 /mmad/；保留 masterLoginGuideList、extList；不处理 getRegConfig、user/info、配额或收发信 |
| 汽水音乐 | 两个已知业务主机的 ads / media_ads；me 的 reward_ad_banner、search-block 的 search_chart_block、activities 的 activity_map | 奶思的 card / more-panel / commerce_info；不整段封锁 commerce，不处理位置或 TNC；不按 track 白名单删除歌曲流其他内容 |
| 腾讯文档 | docs.qq.com 下专用 /ad/ 和 /api/advertise/ 路径 | 不匹配查询参数中的 /ad/，不增加通用正文处理或广泛 qq.com 拦截 |
| 淘票票 | 预加载、我的/影院广告；首页 `tpp_banner_loop`；启动营销弹窗 | 奶思的 queryloadingbanner/queryadvertise；保留 `tpp_guess_like`、homeconfig、搜索排行、下单及 AMDC |
| iDaily | honored 中同系应用推广字段；作者列出的 iDaily/iDays 开屏/弹窗/广告接口 | 不添加通配 MitM，不修改新闻、日历正文和其他主机 |

奶思和墨鱼都已有覆盖的 B 站、小宇宙等本轮不重复添加。中国联通、墨迹天气、车来了等其他候选仍需单独审阅，未作为本版已支持内容。

本版净化也包括一些推荐界面：闲鱼搜索发现、汽水热门榜、淘票票启动营销弹窗、iDaily 同系应用推荐。若希望保留这些入口，可关闭对应应用开关；这不影响奶思自己已有的处理。

## 实现边界

- 只增加 12 个精确 MitM 主机，没有通配域名；一共新增 6 条响应配置和 11 条请求复写。
- 新脚本只输出修改后的 body，不访问网络、存储或日志，不改账号、会员状态或请求凭据。
- HTTP 非 200、不合法 JSON、JSONP、未匹配接口、识别出的业务/登录错误均原样通过。业务错误检查覆盖 code、errno、error_code、status_code、success 及 MTOP ret。
- 闲鱼明确广告卡片过滤保留其他类型及未知卡片；列表占位沿用作者的 `[{}]` 意图。
- 淘票票 `life.popup.get` 是精确指定的营销弹窗接口，成功响应时按作者意图把 data 对象清空；它不同于对一般 JSON 的保守字段过滤。预加载列表仅在确为数组时清空。
- iDaily honored 中删除的五个顶层字段来自作者的交叉推广清单；其他顶层字段保留。
- 查询参数不参与文档广告路径判断，防止普通文档 URL 携带跳转地址时误拒绝。
- 新增开关全部使用 Loon 官方 `${参数}` 引用方式。插件仍要求 Loon 3.5.1（983）。

Loon 同一响应最多选一条响应脚本，先匹配的请求拒绝也可能阻止后续响应处理。因此不依靠插件排序解决重复接口，直接避开已知奶思命中。参考：[Script v2](https://nsloon.app/docs/Script/script_v2/)、[Rewrite v2](https://nsloon.app/docs/Rewrite/rewrite_v2/)。

## 验证结果与限制

41 项 Node.js 离线测试通过：原有 24 项回归和本批 17 项。新增 22 个响应 URL、17 个请求 URL，覆盖 HTTP/HTTPS、参数、多个业务主机、开关、HTTP 状态、正常内容保留、幂等和错误封装等。

静态重叠检查扫描固定奶思版本中 Node 能解析的 Rewrite/Script URL 正则，并检查 DOMAIN / DOMAIN-SUFFIX / DOMAIN-KEYWORD 拒绝规则。部分与本批应用无关的上游正则使用 Node 不支持的写法，未将其错误归类为 Loon 无效规则。本检查不是完整 ICU/Loon 解释器，不涵盖其他本地规则或未来上游更新。可莉 BlockAdvertisers 当前公开版本中，也未发现与本批主机相同的 DOMAIN / DOMAIN-SUFFIX 拒绝项；不代表所有插件组合绝无冲突。

没有新增真机响应样本、手机端广告验证或 Loon 官方解析器验证。上游规则也可能针对旧 App 版本；不能据此保证当前每款 App 的全部广告已移除。后续以实际日志和脱敏响应补缺。

## 手机更新与验证

1. 更新原「Shiina 去广告补充（V2）」插件，确认描述显示 v0.5.0，新脚本下载成功。
2. 保持奶思 V2 和 Shiina 启用，停用重复的同 App 墨鱼去广告插件。
3. 退出并重新打开目标 App。先看广告，再检查正常使用：闲鱼搜索/商品、邮箱收发信、汽水播放、文档打开、淘票票电影列表与选座、iDaily 新闻。
4. 在日志查看 `Shiina-闲鱼`、`Shiina-邮箱大师`、`Shiina-汽水音乐`、`Shiina-淘票票`、`Shiina-iDaily` 标签；腾讯文档查看 URL 拒绝记录。
5. 出现异常时关闭对应应用开关做对照。开关不移除 MitM 主机；要完全撤销本补充的影响，停用整个插件。

公开仓库只保存通用规则、通用代码、合成测试和文档，不保存个人完整配置、Mars/机场信息、Cookie、Token 或原始抓包。
