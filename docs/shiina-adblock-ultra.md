# Shiina AdBlock Ultra

自维护的 Stash 综合去广告覆写。它以 APP 启动页去广告 Ultra+ 的公开规则为功能基线，修复失效依赖、合并重复脚本下载，并整合本仓库的 BiliBili ADBlock Lite。

## 订阅地址

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/shiina-adblock-ultra.stoverride
```

在 Stash 中通过 URL 安装后，请确认已安装并信任 Stash CA 证书，否则 HTTPS 响应脚本无法生效。

## v1.0.1 调整

- 加强对带 `goto: ad_*`、`cm` 或 `is_ad` 标记的 B 站首页推广卡片识别。
- 保持精简 MITM 范围，不新增备用 API、评论、详情或播放接口。

## v1.0.0 调整

- 保留原 Ultra 的大范围 App 去广告规则。
- 将 368 个数字脚本提供器按实际 URL 去重；排除失效和金融接口后保留 113 个第三方提供器，并加入 3 个 BiliBili Lite 提供器。
- 网易云音乐原有 23 个重复下载项改为共用一个提供器。
- 替换已经失效的什么值得买、小红书和闲鱼脚本地址。
- 移除已失效且缺少可靠替代的 V2EX 脚本。
- 移除 BiliBili 国际版地区/SIM 参数修改和漫画开屏规则。
- 默认排除银行与信用卡域名及对应重写，避免影响登录、交易、证书校验或风控流程。
- 合并国内版 BiliBili Lite：处理开屏、首页信息流、搜索、直播间、首页 Tab 和“我的”页面；不接管评论、弹幕、视频详情或播放地址，也不修改账户权益。

## 使用建议

这是广覆盖版本，MITM 域名和重写规则很多。若某个 App 出现登录、支付、加载或接口异常，请先停用本覆写确认是否恢复，再记录 App 名称和异常页面，按 App 对相关规则做收窄或移除。

不要同时启用独立的 `bilibili-adblock-lite.stoverride`，其功能已包含在本覆写中。

## 维护

仓库的定时健康检查会验证：

- 配置能否被 YAML 正确解析；
- 每条脚本规则是否存在对应 provider；
- provider URL 是否完成去重；
- 已移除的 BiliBili 国际版、漫画和 V2EX 规则是否意外回归；
- 所有远程脚本是否仍能下载。

远程脚本返回 404、5xx 或连续超时时，GitHub Actions 会标记失败。上游脚本逻辑与 App 接口是否仍然匹配，仍需结合实际使用情况验证。

## 来源说明

- 功能基线：`https://yfamilys.com/stoverride/adultraplus.stoverride`
- 可核验镜像：`liuqing2030/magic` 中的 `adultraplus.stoverride`
- 国内版 BiliBili：`BiliUniverse/ADBlock v0.6.24` 与本仓库独立 UI 净化脚本

本仓库不镜像第三方 JavaScript 文件，运行时仍从各作者公开地址加载。各脚本的权利和许可归对应上游作者所有。
