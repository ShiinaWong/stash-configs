# 2026-11-25 精简与奶思对照记录

## 当前基准

- 主模板版本：`2026.11.25-r2`；可选补充：`v0.7.1`。
- 奶思文件：`Loon/plugin/blockAds.plugin`，文件头日期 `2026-11-16 22:26:12`。
- [固定上游提交](https://github.com/fmz200/wool_scripts/blob/58f6cce6dbd5c5fe50c2998938f9c2ba631a7c18/Loon/plugin/blockAds.plugin)：`58f6cce6dbd5c5fe50c2998938f9c2ba631a7c18`。
- 文件 Git blob SHA：`a699c8de8b6e82be3d46c03fc126a1749fe002f4`。测试使用原始下载字节，避免换行转换影响指纹。
- 此前测试使用 `blockAdsV2.plugin`、提交 `c3f8128dd03c6b3cb35821c347968282cc45b34f`。本次全部切换到上面的新基准。

## 对照结果

旧补充是在奶思已有处理之外补接口；新版奶思与补充处理同一 App 时，仍有不同的路径和字段。保留的 61 项测试在新版基准下通过。现有 URL 样例的重叠检查支持保留这些独立能力，主模板依照当前精简方案只启用奶思。

| 部分应用 | 奶思已有处理示例 | 补充仍处理的示例 |
| --- | --- | --- |
| 高德 | `valueadded`、开屏初始化 | `message/notice/list`、附近推荐与部分推广入口 |
| 彩云 | `wrapper.cyapi.cn/v1/activity` | `starplucker.cyapi.cn` 的首页与发现页推广 |
| 百度网盘 | `pcs/adx`、活动入口 | `api/getsyscfg`、`feed/cardinfos`、任务推广 |
| 闲鱼 | 信息流、部分 `acs` 搜索接口 | 已收窄的 `g-acs` 搜索入口和 `item.recommend` 广告 |
| 汽水音乐 | `card`、`more-panel` 等 | `me`、`search-block`、`activities` 的指定字段 |
| 淘票票 | `queryadvertise`、`queryloadingbanner` | 预加载、其他横幅与营销弹窗接口 |
| 中国联通 | 开屏及通用广告接口 | 热搜、营销背景、商城角标和新人推广 |
| 微信 | 其他微信广告处理 | `wximg` 指定素材目录与 `wxsmw` 广告前缀视频 |

表中是代表性差异。测试采用合成响应和固定 URL 样例，未运行 Loon 官方解析器；手机上的新版去广告效果需要实际使用反馈。未来上游改变规则后，应重新核对对应入口。

可选补充仍为 18 条响应脚本指令、31 条请求复写、3 条分流、39 个 MitM 条目；原生效部分及三个自有处理脚本保持原样。

## 本次删减

- 公开主模板从旧多组、多链结构改为 1 个自动组、1 个筛选器、1 条代理链，默认插件只有奶思。
- 删除主分支的旧 `build.py`、`build_premium.py`、重复底包、旧输入示例、旧基准清单和过期验证记录。
- 归档旧 Mars 面板源码、构建工具、测试及两个构建脚本产物；原插件 URL 改为无执行项的停用说明。
- 将旧的六份诊断/分批适配说明退出当前目录，当前维护说明集中到本文件与主 README。
- 保留可选补充原订阅地址、三个脚本和五份测试；测试指向固定新版奶思。
- SideStore 位于独立仓库，功能与去广告无关，原样保留。
- Stash、Egern、Quantumult 内容保持原样。

## 恢复和历史来源

精简前提交为 [`371ad47aa94d8fa075ca557ef4352c00527dca27`](https://github.com/ShiinaWong/stash-configs/tree/371ad47aa94d8fa075ca557ef4352c00527dca27/loon)，另建 [归档分支](https://github.com/ShiinaWong/stash-configs/tree/archive/loon-before-naisi-20261125/loon)，本机已校验完整 bundle 备份。

历史来源、字段取舍和回放记录可在该提交的 [docs 目录](https://github.com/ShiinaWong/stash-configs/tree/371ad47aa94d8fa075ca557ef4352c00527dca27/loon/docs) 找到。微博与高德仍直接引用固定版本的墨鱼脚本，作者信息保留在插件头；本次没有复制这些第三方脚本。
