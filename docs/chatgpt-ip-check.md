# ChatGPT 出口 IP 检测

这是一个面向 Stash 的 ChatGPT 出口检测磁贴。它先访问 ChatGPT 的 Cloudflare Trace 获取 ChatGPT 路由实际使用的出口 IP，再查询该 IP 的 ASN、运营商和常见网络风险标记。

## 显示内容

- ChatGPT 是否可达
- ChatGPT 实际看到的出口 IPv4 或 IPv6
- 国家或地区
- ASN 与运营商/网络组织
- 机房、VPN、代理、Tor、移动网络标记
- 疑似家庭/运营商宽带判断及置信度
- Cloudflare 接入节点与 WARP 状态

## 住宅网络判断说明

免费公共 IP 数据不能百分之百证明一个 IP 是家庭宽带。磁贴仅在该 IP 未被标记为机房、VPN、代理、Tor 或移动网络时显示“疑似家庭/运营商宽带”，并明确标注中等置信度。

如果显示的是普通电信运营商 ASN，同时没有机房或匿名网络标记，可以把它视为较强的住宅宽带迹象；如果显示云服务商、托管商或 VPN，则不是普通家庭宽带出口。

## 隐私与外部依赖

- `https://chatgpt.com/cdn-cgi/trace`：取得 ChatGPT 路由看到的出口 IP、地区和 Cloudflare 节点。
- `https://api.ipapi.is/`：查询该出口 IP 的 ASN、运营商和网络类型标记。

第二个服务会收到需要查询的出口 IP。磁贴不会读取或上传 ChatGPT Cookie、账户信息、聊天内容或 Stash 配置。

## 安装

在 Stash 的覆写页面添加：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/chatgpt-ip-check.stoverride
```

启用后在 Stash 首页添加“ChatGPT 出口检测”磁贴。磁贴每小时自动刷新，也可以手动点击刷新。
