# Mars AI 链路快检：GitHub 订阅版

当前版本：**v1.0.2**。提供手机面板、香港入口选择、当前出口与 AI HTTP 探测，按现有配置 `Mars-链式 = 香港手动策略,Mars-ISP` 使用。

## v1.0.2 更新

- 修正候选解析：兼容 Loon 常见的 JSON 对象数组，只提取名称；保留字符串数组及旧 API 名称兼容。
- IP 响应兼容 UTF-8 字节数组、BOM、纯 IP 文本；异常时记录正文类型、格式、长度和 Content-Type，不导出正文。
- 结果默认紧凑展示，解释折叠；“复制排障摘要”每项一行，也能在未检查时复制节点读取诊断。
- 新增独立“GPT 专项检查”，检查 iOS 服务域名、公开认证配置与 Apple App Attest 连接。

## 1. 一次添加插件链接

[一键导入 Loon](https://www.nsloon.com/openloon/import?plugin=https%3A%2F%2Fraw.githubusercontent.com%2FShiinaWong%2Fstash-configs%2Fmain%2Floon%2Fmars-ai-check.plugin)

固定订阅地址：

```text
https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/loon/mars-ai-check.plugin
```

1. 使用上面的一键导入，或把固定地址填入 Loon 的插件添加入口并启用。需要 Loon **3.5.1（Build 983）或更新版本**。
2. Loon 按插件里的 HTTPS 地址获取配套 JS，**不需要下载 ZIP，也不需要手动安装本地 JS**。
3. 保留现有 `香港手动策略`、`Mars-ISP`、`Mars-链式`，以及指向 Mars 的 AI 和 `api.ipify.org` 分流规则。
4. 保持 Loon 运行，在分流模式下打开 **[http://mars.loon.test/](http://mars.loon.test/)**。
5. 面板页脚应显示 **v1.0.2**；先检查当前入口，再按需切换并重新检查。

如果以前已安装本地版，先停用同名本地插件或 README 中手动添加的面板脚本入口，再启用本订阅版，避免本地旧脚本先命中。无需删除其他插件或替换整份主配置。

### 更新方式

插件订阅地址保持不变。发布新版本时，插件会改为引用新版本号的 JS 文件；在 Loon 更新该插件并确认配套脚本获取成功后，刷新面板核对版本。是否定时更新、具体更新时间由 Loon 的资源更新设置决定；这里不承诺每次打开都会重新下载。

当前脚本：[`mars-ai-check-v1.0.2.js`](../scripts/mars-ai-check-v1.0.2.js)。将脚本与插件放在同一公开仓库，是为了让 Loon 通过普通 HTTPS 资源加载它们。文件中没有节点密码、订阅 Token、证书私钥或完整个人配置。

插件仅提供本地域名的 Host 与直连规则，以及面板和 Generic 手动脚本入口；没有新增 AI 分流、MitM 域名或定时探测。面板由 Loon 的请求脚本返回，不需要单独运行 Web 服务器。

本插件使用 Loon 官方支持的远程脚本路径，见 [Script 文档](https://nsloon.app/docs/Script/script_v2/)。

## 2. 日常使用

1. 打开面板，核对当前选中的香港入口。
2. 选择“AI 快检”（8 项）或“GPT 专项检查”（7 项），等待这一轮完成。最大并发 **3**，每项超时约 **6.5 秒**。
3. 需要更换入口时，在候选下拉列表中选择节点并执行切换；再运行新一轮检查作比较。
4. 点击“复制排障摘要”，保存精简文本。每项只保留状态、耗时和必要诊断；未检查时也能复制节点读取情况。若浏览器限制自动复制，使用可见文本框手动复制。

检查只在你手动触发时运行，没有后台轮询。单项失败不会自动变成持续重试，也不会通过生成文本、图片或消息来测试服务。

如果 Loon 的 HTTP 接口没有在时限内回调，脚本会停止启动后续请求，将未执行项明确标出，避免继续堆积连接。面板里的毫秒数是一次 HTTP 请求的耗时，不是 ICMP ping，也不代表模型首字响应时间。

### 切换入口的影响

切换修改的是主配置中共享的 **`香港手动策略`**，所以其他引用这个策略组的流量也会受到影响。插件不自动选最快节点，也不修改 `Mars-ISP` 的认证信息。

你当前配置的 `disconnect-on-policy-change=false` 允许已有连接继续存在。切换之后，已经打开的 AI App 或网页可能仍复用旧连接；请重新打开相关 App 或页面，再验证实际使用效果。单次快检结果不能证明所有旧连接都已迁移。

## 3. 一轮具体检查什么

| 检查项 | GET 地址 | 选路与用途 |
| --- | --- | --- |
| 香港入口出口 | `https://api.ipify.org?format=json` | 明确指定 `香港手动策略`，观察入口单独访问时的公网 IPv4 |
| 当前路由出口 | `https://api.ipify.org?format=json` | 不指定 `node`，由当前路由决定；预期使用主配置的 Mars 链规则 |
| OpenAI API | `https://api.openai.com/v1/models` | 不携带 API Key，观察 HTTP 响应 |
| ChatGPT 网站 | `https://chatgpt.com/robots.txt` | 检查网站轻量资源的 HTTP 响应 |
| Anthropic API | `https://api.anthropic.com/v1/models` | 附带 `anthropic-version`，不携带 API Key |
| Claude 网站 | `https://claude.ai/robots.txt` | 检查网站轻量资源的 HTTP 响应 |
| Gemini API | `https://generativelanguage.googleapis.com/v1beta/models` | 不携带 API Key，观察 HTTP 响应 |
| Gemini 网站 | `https://gemini.google.com/robots.txt` | 检查网站轻量资源的 HTTP 响应 |

三个模型列表地址分别来自 [OpenAI 官方 API 文档](https://developers.openai.com/api/reference/resources/models/methods/list)、[Anthropic 官方 API 文档](https://platform.claude.com/docs/en/api/models/list)和 [Google 官方 API 文档](https://aistudio.google.com/api-reference/models/list-models)。它们列出模型或元数据，不调用生成接口；本工具不提交提示词、不附账号凭据，因此不会发起计费的模型生成操作。成功列出模型通常需要认证，本工具故意省略认证，不能把没有拿到列表判作网络断开。普通网络流量仍由你的网络与代理服务处理。

`robots.txt` 只是网站的轻量探测路径，**不是这些服务承诺的健康检查接口**。它的访问策略、重定向和防护可能变化，成功也不代表登录、聊天、上传或流式连接可用。

出口查询使用 [ipify 官方的 IPv4 JSON 接口](https://www.ipify.org/)。它只观察这一次请求的公网 IPv4，不检查 IPv6，也不自动证明出口的地理位置、住宅属性或服务支持情况。

### GPT 专项检查（7 项）

这一轮保留入口 IP、当前分流 IP、OpenAI API 和 ChatGPT 网页资源检查，另外加入：

| 项目 | 固定 GET 地址 | 判定边界 |
| --- | --- | --- |
| ChatGPT iOS 域名 | `https://ios.chat.openai.com/` | 只观察 HTTP 响应；根路径 404/405 不能判定 App 业务故障 |
| ChatGPT 认证服务 | `https://auth.openai.com/.well-known/openid-configuration` | 核对公开 OIDC 元数据的 issuer 和授权端点，不执行登录 |
| Apple App Attest | `https://register.appattest.apple.com/` | 只观察连接响应，不执行设备证明；沿用当前路由，未强制走 Mars |

OpenAI 官方明确列出 [iOS App 域名与证书固定](https://help.openai.com/en/articles/20001323-corporate-network-controls-in-chatgpt-enterprise)，并在 [网络排障建议](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps) 中给出 App Attest 排查地址。[公开认证配置](https://auth.openai.com/.well-known/openid-configuration) 来自官方 [Sign in with ChatGPT 文档](https://developers.openai.com/siwc/website)。

**OpenAI API 401 不等于 ChatGPT App 可用。**本轮没有验证实际登录、App 的证书固定、设备证明、WebSocket 对话或账号状态。若 API 有响应而 iOS 或认证域名失败，优先对照该域名的 Loon 请求记录；若这些检查都有响应，仍需 App 的完整报错，不能直接归因于 Mars。

复制摘要包含候选返回结构及必要的响应元信息，用于区分“解析不兼容”和“实际没有有效内容”。不复制完整配置、节点对象、响应全文或全部响应头。

### 为什么叫“当前路由出口”

[Loon 官方 API](https://nsloon.app/docs/Script/script_api/)把 `$httpClient` 的 `node` 默认值定义为当前路由。本插件的链路侧探测省略这个参数，使用你已有的规则；入口侧则明确指定 `node: "香港手动策略"`。

官方没有明确说明 `$httpClient.node` 能直接接受 `[Proxy Chain]` 名称，也没有公开稳定接口让脚本返回每次请求实际命中的完整链路。因此面板中的 Mars 链结构来自你提供的配置，**出口结果是观测值，逐跳经过香港与 Mars 仍不是脚本能直接证明的事实**。两个出口 IP 不同是可用线索，相同也不能单凭这一点判定串链失败。

## 4. 如何看结果

| 状态或分类 | 可以说明什么 | 不能据此说明什么 |
| --- | --- | --- |
| 2xx / 成功响应 | 这次请求收到了成功 HTTP 响应 | 账号、模型、登录和完整对话一定可用 |
| 401 / 需要认证 | 对方返回了认证相关响应；本工具没有提供密钥 | 节点断线、账号被封或地域不可用 |
| 普通 403 / 访问受限 | 服务或边缘防护拒绝了这次请求，原因需要结合响应判断 | 一律归因于地域限制 |
| 明确的地域错误 | 响应中有可识别的地域不可用错误码或文字 | 所有服务、所有域名都不可用 |
| 429 / 限制响应 | 此次请求遇到频率、配额或其他额度限制 | 已经找到网络故障原因，或用户账号必然没有额度 |
| 5xx / 服务侧错误 | 收到了服务或网关错误响应 | 必然是节点故障 |
| 超时、DNS、TLS 或连接错误 | 本次请求未取得可用 HTTP 响应 | 已精确定位到链路中的某一跳 |
| 其他 3xx / 4xx | 需要结合状态码与响应摘要继续判断 | 默认都表示地域限制 |

无密钥的模型列表探测得到 401，或者某些服务给出 400/403，是可能出现的结果。**只要收到了 HTTP 响应，就应与没有建立连接、超时等情况分开处理。**本工具不会仅凭 403、`unsupported` 等泛化文字宣布某个地区不可用。

优先比较“同一轮各项”和“换入口前后”两组证据：入口探测与当前路由都失败时，先检查共同的网络及入口；入口探测成功、当前路由失败时，再看 Mars 节点、串链和对应分流；两项出口正常而某一家返回限制响应时，再检查该服务的具体响应。以上是排查顺序，不是仅靠两项结果就能确定故障位置。

## 5. 常见问题

### 面板打不开或显示连接失败

先确认地址是 `http://mars.loon.test/`、Loon 正在运行、插件已启用。再用 Generic 入口确认 JS 是否能加载。脚本生成面板需要这条 HTTP 请求进入 Loon；本地 Host 映射本身不会启动监听端口。若当前模式或绕过设置使请求没有进入 Loon，单独打开 `127.0.0.1` 也不会修复问题。

### 提示找不到脚本，或 Generic 也无法运行

先确认 GitHub 原始文件地址可以访问，并查看 Loon 的脚本下载状态。插件应引用 `mars-ai-check-v1.0.2.js`；更新插件后如仍显示旧版本，使用 Loon 的远程脚本更新功能重新获取。无需单独下载、重命名或导入 JS。

### 下拉列表没有候选，或切换失败

核对当前主配置中存在名字完全一致的 `香港手动策略`。v1.0.2 已修复对象数组被过滤的问题；仍为空时，请直接复制排障摘要，其中的候选 API、返回结构和数量可以区分超时、格式不识别与真实空列表。切换仍只接受实时返回的候选，并读回确认。

### 出口不像预期的 Mars 出口

先看运行模式是否为分流，再检查当前主配置的 `api.ipify.org` 规则和 `Mars-链式` 定义。插件不会替你新增或修复这些规则。还应考虑旧连接复用，以及服务商使用不同公网出口的情况；服务器接入地址不一定等于最终公网出口。

### 检测正常，AI App 仍然失败

重新打开 App，记录实际失败操作与时间。轻量 GET 无法覆盖登录状态、账号权限、其他业务域名、WebSocket、上传或长时间流式请求。此时保留快检摘要，再对照真实失败连接，而不是反复运行相同快检。

### 复制按钮没有反应

本地 HTTP 页面的自动剪贴板能力受浏览器限制。可以手动选择并复制摘要。摘要会包含节点名称和公网 IP，分享前可按需要删去这些信息；不需要发送完整主配置或节点密码。

## 6. 停用与恢复

关闭或移除本插件即可停止它提供的面板和手动入口；没有定时任务需要另行关闭。需要恢复原入口时，在 `香港手动策略` 中选回原节点。停用插件不会自动撤销你已经执行的手动节点切换。

保留原主配置即可继续使用原有 AI 分流与 Mars 链。若此前安装过本地版，在启用本订阅版前停用同名本地插件或手工添加的面板脚本入口，避免重复命中。

## 7. 验证范围与参考

本说明已核对 Loon 的公开 Script API、模型列表端点及其认证示例。交付包的源码与测试用于检查实现逻辑；**尚未在你的 iPhone、Loon 配置和 Mars 网络链路上实测**。桌面测试或 API 模拟不能替代手机上的首次安装、页面拦截和真实出口验证。

后端已通过 **119 项模拟测试**，覆盖请求数量与并发上限、401/403/429/5xx/空响应分类、无回调停止调度、节点候选与切换读回、跨站请求拒绝、敏感字段隔离和结果过期。测试不访问实际代理，也不使用你的凭据。

面板已通过脚本语法检查与小型 DOM 模拟，覆盖候选为空时复制诊断、AI/GPT 检查切换、默认折叠结果、摘要长度限制、证据字段白名单、结果过期及手动复制备选。模拟数据的 AI 摘要为 20 行、637 字符，GPT 摘要为 19 行、606 字符；实际长度随节点名称和结果变化。DOM 模拟不代表浏览器排版或 iOS Safari 已经过验证。

开发者复跑（Node.js）：

```bash
node loon/tools/mars-ai-check/build.mjs
node --check loon/scripts/mars-ai-check-v1.0.2.js
node --test loon/tools/mars-ai-check/tests/backend.test.cjs
node loon/tools/mars-ai-check/tests/panel-dom.test.cjs
```

`loon/tools/mars-ai-check/tests/frontend.mjs` 是真实 HTML 配合模拟 Loon API 的浏览器测试，需要自行提供 Playwright 与可运行的 Chromium，可用 `MARS_BROWSER_PATH` 指定浏览器路径。当前交付环境限制了浏览器进程创建套接字，该项浏览器测试未能运行完成；不要将其视为已经通过的手机验收。

主要依据：

- [实际 Loon 候选对象数组用例：NobyDa Google_CAPTCHA](https://github.com/NobyDa/Script/blob/master/Surge/JS/Google_CAPTCHA.js)

- [Loon Script 语法与脚本路径](https://nsloon.app/docs/Script/script_v2/)
- [Loon Script API：策略读写、HTTP 请求、完成响应](https://nsloon.app/docs/Script/script_api/)
- [Loon 策略处理流程](https://nsloon.app/docs/Policy/)
- [Loon 通用配置](https://nsloon.app/docs/General/)
- [OpenAI：List models](https://developers.openai.com/api/reference/resources/models/methods/list)
- [Anthropic：List Models](https://platform.claude.com/docs/en/api/models/list)
- [Anthropic：API 版本头](https://platform.claude.com/docs/en/api/versioning)
- [Google：Listing models](https://aistudio.google.com/api-reference/models/list-models)
- [ipify：IPv4 JSON 接口](https://www.ipify.org/)

