# Quantumult X：AI 经 Mars ISP 出口

本仓库在墨鱼（ddgksf2013）的 `Ai.yaml` 基础上生成扩充版，保留上游全部规则，并补充上游暂未覆盖的 AI 服务专属域名。补充规则刻意不加入 `amazonaws.com`、`cloudflare.com` 一类新的共享云域名，以免把大量非 AI 流量送入 Mars。

## 订阅地址

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/quantumult/rules/Ai-Extended.yaml
```

在 Quantumult X 的“资源 → 分流”中添加该地址：

- 资源标签：`Shiina-AI-Extended`
- 策略偏好：开启，并选择 `Mars-ISP`
- 资源解析器：开启
- 插入资源：无需开启

若通过文本配置维护，对应条目为：

```ini
[filter_remote]
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/quantumult/rules/Ai-Extended.yaml#via=0, tag=Shiina-AI-Extended, force-policy=Mars-ISP, update-interval=86400, opt-parser=true, enabled=true
```

`#via=0` 是 KOP-XIAO 资源解析器参数：为解析后的分流规则添加 `via-interface=%TUN%`，用于代理链，并非指定订阅文件直连下载。`force-policy=Mars-ISP` 则将命中规则的策略指定为 Mars 落地节点；本地仍需保留 Mars 服务器地址指向前置代理的规则。

参数依据：https://github.com/KOP-XIAO/QuantumultX/blob/master/Scripts/resource-parser.js

## 与原墨鱼订阅的关系

这是替代订阅，不要同时启用原 `https://ddgksf2013.top/filter/Ai.yaml`，否则规则重复。生成脚本每天检查一次墨鱼上游；上游新增内容会保留，本仓库补充项会去重后追加。

Mars 节点、用户名、密码和前置代理都只保存在个人 Quantumult X 配置中，不应提交到公开仓库。

## 维护

- 上游：`https://ddgksf2013.top/filter/Ai.yaml`
- 人工补充：`quantumult/ai-supplement.list`
- 生成文件：`quantumult/rules/Ai-Extended.yaml`
- 本地生成：`python tools/sync_ai_rules.py`
- 校验：`python tools/sync_ai_rules.py --check`
