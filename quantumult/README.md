# Quantumult X 上游归档

这里归档原 Quantumult X 配置中与当前 Shiina AdBlock Ultra 维护直接相关的三个公开上游地址，便于后续检查更新、比较差异并选择性移植到 Stash。

> 本目录只保存公开上游索引，不保存本地导出配置、代理订阅、MITM 证书或其他私密信息。以下地址是 Quantumult X 格式，不能直接作为 Stash 覆写订阅。

## 上游地址

### 1. Ultra+ 通用去广告

```text
https://yfamilys.com/rewrite/adultraplus.conf
```

- 用途：通用广告、应用广告和部分页面净化规则。
- 本仓库对应：`overrides/shiina-adblock-ultra.stoverride` 的主要上游基线。
- 同步原则：排除银行、证券、支付、账户权益和风险较高的宽泛改写。

### 2. StartUpAds 开屏广告

```text
https://ddgksf2013.top/rewrite/StartUpAds.conf
```

- 用途：补充各应用的开屏与启动页广告规则。
- 本仓库对应：作为 Shiina AdBlock Ultra 的增量候选来源。
- 同步原则：优先移植接口明确的开屏广告规则，不整体导入响应体修改、账户修改或非广告功能。

### 3. BiliBili Ads Lite

```text
https://ddgksf2013.top/rewrite/BiliBiliAdsLite.conf
```

- 用途：哔哩哔哩轻量去广告。
- 本仓库对应：`overrides/bilibili-adblock-lite.stoverride`。
- 同步原则：用于比对广告接口变化；按用户要求保留 1080P/高码率账户能力，但不扩大到评论、详情、相关推荐、播放地址或 gRPC 链路。

## 后续同步检查

同步时至少检查以下内容：

1. 上游规则和 MITM 主机是否新增、删除或改名。
2. 新规则是否确实属于广告处理，而不是解锁、账户修改或区域修改。
3. B 站规则是否会接管评论、详情、相关推荐或播放链路。
4. 转换为 Stash 格式后是否通过本仓库测试。

机器可读的原始地址列表见 [`upstreams.txt`](upstreams.txt)。
