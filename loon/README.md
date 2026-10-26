# Shiina Loon 去广告补充

配合 fmz200（奶思）广告拦截&净化合集使用的独立补充插件。固定订阅地址不变，采用 Loon Rewrite v2 / Script v2。

## 当前版本：v0.4.0（2026-10-26）

本版在微博补充基础上加入高德、彩云天气和百度网盘。高德直接引用已核对并固定版本的墨鱼脚本；彩云和网盘参考 QX 的接口与数据字段，仅实现所选页面净化。

| 应用 | 本版处理 | 使用时需要了解 |
| --- | --- | --- |
| 微博 | 保留 v0.3.0 的开屏、SDK、信息流处理 | 仍采用墨鱼原脚本；真机效果待反馈 |
| 高德 | 首页/附近/打车/我的页面、热词、角标和专用推广接口 | 沿用原脚本的精简，会隐藏部分推荐、AI 入口及页面卡片 |
| 彩云 | 首页推广、消息/活动弹窗、发现页推荐和外链入口 | 保留可识别的天气文章与原生功能链接；不植入固定文章 |
| 百度网盘 | 已知广告配置、首页推荐、任务推广、热搜/短剧入口 | 已识别的首页信息流保留文件功能和最近记录；未知格式保留 |

新增 3 条响应脚本配置、6 条请求复写和 8 个精确 MitM 主机，总计 10 条响应脚本、9 条请求复写、3 条原有微博分流和 19 个精确主机。最低版本为 **Loon 3.5.1（983）**。

## 安装或更新

固定插件地址：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/loon/shiina-adblock-supplement.plugin
```

[一键导入 Loon](https://www.nsloon.com/openloon/import?plugin=https%3A%2F%2Fraw.githubusercontent.com%2FShiinaWong%2Fstash-configs%2Fmain%2Floon%2Fshiina-adblock-supplement.plugin)

已安装时更新原来的「Shiina 去广告补充（V2）」插件，确认描述显示 **v0.4.0**。确保新脚本下载成功、MitM 已启用、Loon 证书已安装并信任。无需重复添加插件或替换整份配置。

新增三个应用开关默认开启。建议先检查高德，再检查彩云、网盘；如需逐项测试，可暂时关闭另外两个开关。退出对应 App 后重新打开，查看首页和实际使用页面，同时确认地图路线、天气预报和文件列表等正常功能可用。

日志可按以下脚本标签识别实际命中：

- `Shiina-高德-墨鱼页面净化`
- `Shiina-彩云-页面推广`
- `Shiina-网盘-页面推广`

## 与奶思搭配

奶思继续独立订阅。本版对照其固定公开版本检查了新增响应入口，避开已有的高德 valueadded 拦截、彩云 activity 处理和百度通用广告接口。

Loon 同一响应只选择第一条命中的响应脚本；请求拒绝和响应正文复写也可能阻止脚本执行。若另有同 App 专用插件、Script-Hub 转换规则或本地复写，需要再检查重复项，单纯调整插件排序不能解决所有冲突。

本次静态审查还发现奶思 V2 的部分 `enable=参数名` 写法与官方文档的 `enable=${参数名}` 不一致。是否影响手机实际加载须以当前版本和解析日志为准，不能仅凭源码断言全部失效。本补充使用官方参数引用写法，并不自动修改奶思本身。详见[第二批适配记录](docs/qx-second-batch.md)。

## 开关和回退

- 「微博净化脚本与复写」及「微博信息流与详情广告」保留原含义。
- 「高德页面净化」「彩云页面净化」「网盘页面净化」分别控制本插件相应的 Script / Rewrite。
- 应用出现异常时先关闭对应应用开关，重新打开 App 对照。
- 参数不移除固定分流和 MitM。需要完整回退时停用整个补充插件。
- 已缓存的广告或配置不会因更新立即清除，可使用 App 自带清理缓存功能；不要求先卸载应用。

## 验证与范围

**24 项离线测试通过**：包含固定高德原脚本的实际执行、彩云/网盘字段处理、错误和未知数据保留、规则范围、开关及奶思接口冲突检查，并保留 11 项微博回归测试。

这些是 Node.js 合成测试与静态检查，未在本机运行 Loon 官方解析器，也不等同于手机广告已全部消失。第二批没有新的真实响应样本，需在当前 App 版本上验证。

本次只发布补充插件、通用脚本、合成测试和说明；代理链、机场订阅、DNS、完整个人配置以及原始抓包均不属于发布内容。

## 来源与维护

- [第二批适配记录及差异](docs/qx-second-batch.md)
- [微博适配与回放记录](docs/weibo-intl.md)
- [变更记录](CHANGELOG.md)
- [墨鱼高德 QX 配置](https://github.com/ddgksf2013/Rewrite/blob/master/AdBlock/AmapAds.conf)
- [墨鱼彩云 QX 配置](https://github.com/ddgksf2013/Rewrite/blob/master/AdBlock/CaiYunAds.conf)
- [墨鱼百度网盘脚本及规则](https://ddgksf2013.top/scripts/bdpan.ads.js)
- [Loon Script v2](https://nsloon.app/docs/Script/script_v2/)
- [Loon Rewrite v2](https://nsloon.app/docs/Rewrite/rewrite_v2/)

高德、微博外部脚本固定公开提交后引用，不镜像正文。自有脚本文件名包含版本号；后续修订使用新文件名，避免误用旧缓存。

测试（仓库根目录，Node.js 18+，需下载固定的公开上游文件）：

```sh
node --test loon/tests/*.test.cjs
```

离线测试可分别用 WEIBO_UPSTREAM_SCRIPT、AMAP_UPSTREAM_SCRIPT、MILK_PLUGIN 指定已下载文件。测试校验 Git blob SHA，确保比较的是同一版本。

公开仓库不接收原始 HAR/ZIP、登录返回、Cookie、Token、完整个人配置、机场订阅地址或节点凭据。
