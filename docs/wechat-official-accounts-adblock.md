# WeChat Official Accounts AdBlock

微信公众号文章广告的独立 Stash 覆写，不属于 Shiina AdBlock Lite 默认模块。

## 订阅地址

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/overrides/wechat-official-accounts-adblock.stoverride
```

## 处理范围

- 仅 MITM `mp.weixin.qq.com`。
- 仅在 `mp.weixin.qq.com/mp/getappmsgad` 返回广告数据时执行修改。
- 将 `advertisement_num` 设为 `0`、清空 `advertisement_info`，并移除广告响应中的 `appid`。
- JSON 无法解析或响应中没有广告字段时保持原响应，不影响其他公众号接口。

接口识别参考 NobyDa 的 Quantumult X `Wechat.js`，脚本在本仓库中重新实现并增加了无广告响应和解析失败时的保守回退。

## 使用和回滚

1. 在 Stash 中添加并启用该覆写，可与 Shiina AdBlock Lite 同时使用。
2. 确认 Stash 的 MITM 证书已经安装并信任。
3. 完全关闭微信后重新打开公众号文章，避免命中旧广告缓存。
4. 如果公众号文章加载异常、出现空白或内存压力明显增加，关闭本覆写并重新启动 Stash 即可回滚。

该覆写针对微信公众号文章，不保证处理微信原生小程序广告或小程序开发者接入的第三方广告。
