/*
 * Current-route launcher v1.0.0, by ShiinaWong.
 * Detection/report core: MaYIHEI/paperclip, pinned original file; not redistributed.
 * https://github.com/MaYIHEI/paperclip/tree/main/loon/ipquality-web-test
 * This launcher only selects modules, masks output and keeps requests on normal routing.
 */
(function () {
    "use strict";
    const CORE_URL = "https://raw.githubusercontent.com/MaYIHEI/paperclip/eaa04fe0a9f37ccfafdd11930d28fd5ff3f04718/loon/ipquality/ipquality.js";
    const EXPECTED_FINAL = "境外家宽";
    const MODULES = {
        basic: {title: "家宽检测 · 基础信息", enabled: ["显示基础信息"]},
        risk: {title: "家宽检测 · 风险", enabled: ["显示 IP 类型", "显示风险评分", "显示风险因素"]},
        media: {title: "家宽检测 · 流媒体与 AI", enabled: ["执行媒体与 AI 检测", "显示媒体与 AI 结果", "显示地区一致性"]}
    };
    const key = String(typeof $argument === "undefined" ? "" : $argument).trim();
    const selected = Object.prototype.hasOwnProperty.call(MODULES, key) ? MODULES[key] : null;
    let finished = false;

    function finish(value) {
        if (finished) return;
        finished = true;
        $done(value);
    }
    function fail(message) {
        finish({title: selected ? selected.title : "家宽出口检测", content: message, icon: "network.slash"});
    }
    if (!selected) return fail("检测项目无效，请使用插件中的三个手动入口。");
    let config;
    try {
        config = JSON.parse($config.getConfig() || "{}");
    } catch (_) {
        return fail("无法确认当前分流配置。请启用本方案的配置和 VPN 后重试。");
    }
    if (!config || config.running_model !== 1 || config.final !== EXPECTED_FINAL) {
        return fail("请使用本方案配置，保持分流模式、最终策略为境外家宽后重试。");
    }

    // The core deliberately routes some lookups DIRECT. Remove per-request overrides
    // so every probe and lookup uses the user's current rules, including the full chain.
    function routedRequest(method, options, callback) {
        const request = typeof options === "string" ? {url: options} : Object.assign({}, options);
        delete request.node;
        delete request.policy;
        request.insecure = false;
        $httpClient[method](request, callback);
    }
    const client = {
        get(options, callback) { routedRequest("get", options, callback); },
        post(options, callback) { routedRequest("post", options, callback); }
    };
    const preferences = {
        read(label) {
            return label === "隐藏 IP" || selected.enabled.indexOf(String(label)) >= 0 ? "true" : "false";
        },
        write() { return false; },
        remove() { return false; }
    };
    // No raw URLs, IPs, API errors or response bodies are written to script logs.
    const quietConsole = {log() {}, warn() {}, error() {}};
    client.get({url: CORE_URL, timeout: 12000}, function (error, response, body) {
        if (finished) return;
        if (error || !response || Number(response.status) !== 200 || typeof body !== "string" || !body.includes('const SCRIPT_VERSION = "2026-07-22.r32";')) {
            return fail("检测核心下载失败，请先确认当前家宽链路可访问 GitHub，然后重试。");
        }
        try {
            const run = new Function("$done", "$persistentStore", "$environment", "$httpClient", "console", body);
            run(function (result) {
                if (!result || typeof result.htmlMessage !== "string") {
                    return fail("检测未完成。请先用出口检查网页确认当前家宽链路，再重试；部分数据源也可能暂时不可用。");
                }
                finish({title: selected.title, htmlMessage: result.htmlMessage, icon: "network"});
            }, preferences, {params: {node: "当前分流 · 境外家宽"}}, client, quietConsole);
        } catch (_) {
            fail("检测核心执行失败，请更新本插件后重试。");
        }
    });
}());
