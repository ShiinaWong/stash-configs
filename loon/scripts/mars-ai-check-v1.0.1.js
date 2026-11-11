/* Mars AI 链路快检 1.0.1
 * Built for: Mars-链式 = 香港手动策略,Mars-ISP
 * This file never reads node credentials or changes routing rules.
 * API references: https://nsloon.app/docs/Script/script_api/
 */
(function () {
  'use strict';
  var PANEL_HTML = "<!doctype html>\n<html lang=\"zh-CN\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n  <meta name=\"theme-color\" content=\"#101419\">\n  <meta name=\"color-scheme\" content=\"dark\">\n  <meta name=\"mars-token\" content=\"__MARS_CSRF_TOKEN__\">\n  <title>Mars · AI 链路快检</title>\n  <style nonce=\"__MARS_CSRF_TOKEN__\">\n    :root{color-scheme:dark;--bg:#101419;--card:#191e25;--card-soft:#141920;--line:#303843;--ink:#f3f5f7;--muted:#a7b0be;--quiet:#798696;--accent:#e8b09a;--accent-dark:#261c19;--mint:#a4d3bd;--blue:#a8c8ee;--amber:#e9c68a;--red:#efa5a1;--radius:20px;font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"PingFang SC\",\"Microsoft YaHei\",sans-serif;font-synthesis:none}\n    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);line-height:1.55;-webkit-text-size-adjust:100%;overflow-wrap:anywhere}button,select,textarea{font:inherit}button,a,select{-webkit-tap-highlight-color:transparent}button{cursor:pointer}button:disabled{cursor:default;opacity:.42}button:focus-visible,a:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--accent);outline-offset:4px}button{touch-action:manipulation}button svg{pointer-events:none}[hidden]{display:none!important}.app{max-width:620px;margin:auto;padding:calc(25px + env(safe-area-inset-top)) 20px calc(28px + env(safe-area-inset-bottom))}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:28px}.brand{display:flex;align-items:center;gap:10px}.mark{width:38px;height:38px;color:var(--accent);flex:none}.brand-name{font-weight:750;font-size:21px;letter-spacing:2px;line-height:1.2}.brand-note{color:var(--quiet);font-size:10px;letter-spacing:1.5px;margin-top:4px}.quiet-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;padding:7px 4px 7px 10px;border:0;color:var(--muted);background:none;font-size:13px;font-weight:550}.icon{width:17px;height:17px;flex:none;stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round}.intro h1{margin:0 0 5px;font-size:28px;letter-spacing:-.7px;line-height:1.3;font-weight:700}.intro p{margin:0;color:var(--muted);font-size:14px}.section-label{margin:24px 2px 10px;display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--quiet);font-size:11px;font-weight:650;letter-spacing:1px}.section-label h2{margin:0;font:inherit}.label-right{font-weight:400;letter-spacing:0}.card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden}.chain-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:17px 18px 0}.chain-name{color:var(--muted);font-size:12px}.pill{display:inline-flex;align-items:center;gap:6px;flex:none;border:1px solid #414853;border-radius:999px;padding:4px 9px;font-size:11px;line-height:1.3;letter-spacing:0;color:var(--muted);font-weight:500}.pill i,.live-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:currentColor;flex:none}.pill[data-tone=\"ok\"]{color:var(--mint);border-color:#3e554c;background:#1b2c25}.pill[data-tone=\"warn\"]{color:var(--amber);border-color:#5b4c34;background:#2c261d}.chain{padding:16px 18px 13px}.hop{display:flex;align-items:flex-start;gap:12px}.hop-number{display:flex;align-items:center;justify-content:center;width:27px;height:27px;border-radius:8px;border:1px solid #4f4543;color:var(--accent);font-size:11px;flex:none;background:#292321}.hop:last-child .hop-number{border-color:#3f4a58;background:#202832;color:var(--blue)}.hop-label{color:var(--quiet);font-size:11px;line-height:1.4;margin-bottom:4px}.hop-value{font-size:15px;line-height:1.55;font-weight:600}.hop-value.loading{color:var(--quiet);font-weight:400}.connector{height:23px;margin:3px 0 3px 13px;border-left:1px dashed #48505b}.chain-foot{padding:11px 18px;background:var(--card-soft);border-top:1px solid #282f39;display:flex;gap:7px;align-items:flex-start;color:var(--quiet);font-size:11px}.chain-foot .icon{width:14px;height:14px;margin-top:2px}.warning-list{display:grid;gap:8px;margin-top:12px}.warning{font-size:12px;color:var(--amber);border:1px solid #594b34;background:#28231c;border-radius:12px;padding:11px 13px}.notice{margin-top:16px;padding:12px 14px;border-radius:12px;font-size:13px;border:1px solid #4d5b50;background:#1d2a23;color:var(--mint)}.notice[data-tone=\"error\"]{background:#2d2022;border-color:#614145;color:#f1bbb7}.notice[data-tone=\"warn\"]{background:#28231c;border-color:#594b34;color:var(--amber)}.check-area{margin-top:18px}.primary{width:100%;min-height:54px;display:flex;align-items:center;justify-content:center;gap:10px;border:1px solid #efc2ae;border-radius:14px;background:var(--accent);color:#271e1b;font-weight:700;font-size:15px;box-shadow:0 4px 15px #00000012}.primary:not(:disabled):active{transform:translateY(1px);background:#efbea9}.primary .icon{width:19px;height:19px}.check-note{display:flex;justify-content:center;align-items:center;gap:5px;margin:10px 0 0;color:var(--quiet);font-size:11px}.check-note .icon{width:12px;height:12px}.spinner{width:18px;height:18px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin .8s linear infinite;flex:none}@keyframes spin{to{transform:rotate(360deg)}}.progress-note{margin:11px 2px 0;padding:12px 14px;background:#20262e;border:1px solid #394250;border-radius:12px;color:var(--muted);font-size:12px}.progress-note strong{color:var(--ink);display:block;margin-bottom:3px;font-weight:600}.switch-card{padding:17px 18px 15px}.field-label{display:block;margin:0 0 8px;color:var(--muted);font-size:12px}.select-wrap{position:relative}.select-wrap select{appearance:none;-webkit-appearance:none;display:block;width:100%;min-height:48px;padding:11px 38px 11px 12px;border:1px solid #424b58;background:#12171d;color:var(--ink);border-radius:11px;font-size:14px;text-overflow:ellipsis}.select-wrap select:disabled{opacity:.5}.select-wrap>.icon{position:absolute;right:13px;top:16px;width:15px;height:15px;pointer-events:none;color:var(--muted)}.switch-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px}.selection-note{font-size:11px;line-height:1.5;color:var(--quiet);flex:1}.selection-note.pending{color:var(--amber)}.secondary{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;padding:9px 14px;color:var(--ink);background:#2b333e;border:1px solid #475260;border-radius:11px;font-size:13px;font-weight:600;flex:none}.secondary:not(:disabled):active{background:#364151}.impact-note{font-size:11px;color:var(--quiet);line-height:1.75;margin:14px 0 0;padding-top:12px;border-top:1px solid #303743}.result-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:24px 2px 10px}.result-head h2{font-size:14px;margin:0;font-weight:600}.result-head .quiet-button{min-height:36px;font-size:12px;padding-top:3px;padding-bottom:3px}.empty{border:1px dashed #3b424c;border-radius:16px;padding:23px 18px;text-align:center;color:var(--quiet)}.empty .icon{width:25px;height:25px;color:#788696;margin-bottom:7px}.empty h3{margin:0 0 5px;font-size:13px;font-weight:500;color:var(--muted)}.empty p{margin:0;font-size:11px;line-height:1.7}.summary{padding:17px 18px;border:1px solid #45554d;background:#1a2722;border-radius:16px;margin-bottom:14px}.summary[data-tone=\"warn\"]{background:#28251e;border-color:#5b503a}.summary[data-tone=\"error\"]{background:#2b2022;border-color:#5b3e44}.summary-kicker{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:10px;letter-spacing:.5px;color:var(--mint);margin-bottom:7px}.summary[data-tone=\"warn\"] .summary-kicker{color:var(--amber)}.summary[data-tone=\"error\"] .summary-kicker{color:var(--red)}.summary h3{margin:0 0 5px;font-size:17px;line-height:1.45;font-weight:650}.summary p{margin:0;font-size:12px;color:var(--muted);line-height:1.7}.summary-time{white-space:nowrap;letter-spacing:0;font-variant-numeric:tabular-nums}.results-group{margin:17px 0 0}.group-header{display:flex;align-items:flex-start;gap:9px;margin:0 2px 10px}.group-marker{color:var(--accent);font-size:10px;border:1px solid #514541;background:#292321;border-radius:5px;padding:2px 5px;line-height:1.35;margin-top:1px}.results-group[data-scope=\"route\"] .group-marker{color:var(--blue);border-color:#3d4f64;background:#1c2836}.group-header h3{font-size:12px;margin:0;font-weight:600}.group-header p{font-size:10px;color:var(--quiet);margin:3px 0 0;line-height:1.65}.result-items{border:1px solid var(--line);border-radius:15px;overflow:hidden;background:var(--card)}.result-item{padding:14px 15px;border-top:1px solid var(--line)}.result-item:first-child{border-top:0}.result-topline{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.result-name{font-size:13px;font-weight:600}.result-badge{color:var(--mint);font-size:10px;font-weight:550;border:1px solid #3a5146;background:#1d2b24;border-radius:5px;padding:2px 6px;flex:none;max-width:50%;text-align:center;line-height:1.5}.result-badge[data-tone=\"info\"]{color:var(--blue);background:#1d2835;border-color:#3d506a}.result-badge[data-tone=\"warn\"]{color:var(--amber);background:#2b261e;border-color:#5a4c32}.result-badge[data-tone=\"error\"]{color:var(--red);background:#2c2022;border-color:#5d3d43}.result-detail{font-size:11px;line-height:1.75;color:var(--muted);margin:6px 0 0}.result-title{font-size:12px;line-height:1.6;color:#d7dde6;margin-top:5px}.result-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin-top:8px;color:var(--quiet);font-size:10px;font-variant-numeric:tabular-nums}.result-ip{color:#d4dce7;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;margin:9px 0 0;word-break:break-all}.is-stale .summary{background:#232329;border-color:#59515c}.is-stale .summary-kicker{color:#c7bac7}.is-stale .result-badge{color:#b6afba;background:#28252d;border-color:#514b56}.is-stale .result-title,.is-stale .result-ip{color:#a5a5af}.result-footnote{font-size:10px;line-height:1.8;color:var(--quiet);margin:15px 2px 0}.footer{display:flex;align-items:center;justify-content:space-between;gap:12px;color:#667282;font-size:10px;margin-top:27px;padding-top:16px;border-top:1px solid #29303a}.footer span:first-child{display:inline-flex;align-items:center;gap:6px}.footer .live-dot{background:#6f867a;width:4px;height:4px}.modal-backdrop{position:fixed;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;padding:20px;background:#080b10c9;backdrop-filter:blur(6px)}.modal{width:100%;max-width:480px;border:1px solid #495463;border-radius:20px;padding:20px;background:#1c222b;box-shadow:0 20px 60px #0006}.modal h2{font-size:18px;margin:0 0 7px}.modal p{font-size:12px;color:var(--muted);margin:0 0 14px}.modal textarea{width:100%;height:240px;max-height:45vh;resize:vertical;border:1px solid #465261;border-radius:10px;background:#11161d;color:var(--ink);font-size:12px;line-height:1.65;padding:12px}.modal-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:12px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(min-width:560px){.app{padding-left:30px;padding-right:30px}.intro h1{font-size:32px}.chain{display:flex;align-items:center;gap:15px;padding:20px 18px}.hop{flex:1;min-width:0}.connector{height:0;width:22px;margin:0;border-left:0;border-top:1px dashed #48505b;flex:none}.hop-value{font-size:14px}.top{margin-bottom:32px}}@media(max-width:350px){.app{padding-left:14px;padding-right:14px}.intro h1{font-size:25px}.switch-row{align-items:stretch;flex-direction:column}.secondary{width:100%}.result-badge{max-width:46%}}@media(prefers-reduced-motion:reduce){.spinner{animation:none}*{scroll-behavior:auto!important}}\n    @media(max-width:559px){.select-wrap select,.modal textarea{font-size:16px}}\n  </style>\n</head>\n<body>\n  <main class=\"app\">\n    <header class=\"top\">\n      <div class=\"brand\">\n        <svg class=\"mark\" viewBox=\"0 0 40 40\" fill=\"none\" aria-hidden=\"true\"><circle cx=\"20\" cy=\"20\" r=\"11\" stroke=\"currentColor\" stroke-width=\"1.4\"/><path d=\"M31 15c4-1 6-.7 6 1.1 0 3.2-7.5 8-17 10.8S3 29.2 3 26.1c0-1.6 2-3.7 5.4-5.6\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\"/><circle cx=\"16.5\" cy=\"16\" r=\"1.5\" fill=\"currentColor\" opacity=\".45\"/><path d=\"M23 11.3a9 9 0 0 1 5.3 5.2\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\" opacity=\".55\"/></svg>\n        <div><div class=\"brand-name\">MARS</div><div class=\"brand-note\">CONNECTION CHECK</div></div>\n      </div>\n      <button class=\"quiet-button\" id=\"refresh-button\" type=\"button\" aria-label=\"刷新当前配置状态，不发起外部探测\"><svg class=\"icon\" viewBox=\"0 0 20 20\" aria-hidden=\"true\"><path d=\"M16.8 9a7 7 0 1 0-1.9 5.9M16.8 3.8V9h-5.2\"/></svg><span>刷新状态</span></button>\n    </header>\n\n    <section class=\"intro\" aria-labelledby=\"page-title\"><h1 id=\"page-title\">AI 链路快检</h1><p>看清入口与出口，再决定是否切换。</p></section>\n\n    <div class=\"section-label\"><h2 id=\"chain-title\">预期链路</h2><span class=\"label-right\">配置关系 · 并非逐跳验证</span></div>\n    <section class=\"card\" aria-labelledby=\"chain-title\" id=\"state-card\" aria-busy=\"true\">\n      <div class=\"chain-head\"><span class=\"chain-name\" id=\"chain-name\">Mars-链式</span><span class=\"pill\" id=\"mode-pill\"><i aria-hidden=\"true\"></i><span id=\"mode-label\">读取状态中</span></span></div>\n      <div class=\"chain\">\n        <div class=\"hop\"><span class=\"hop-number\" aria-hidden=\"true\">01</span><div><div class=\"hop-label\" id=\"entry-label\">香港手动策略 · 当前入口</div><div class=\"hop-value loading\" id=\"current-node\">正在读取…</div></div></div>\n        <div class=\"connector\" aria-hidden=\"true\"></div>\n        <div class=\"hop\"><span class=\"hop-number\" aria-hidden=\"true\">02</span><div><div class=\"hop-label\">预期末端出口</div><div class=\"hop-value\" id=\"exit-node\">Mars-ISP</div></div></div>\n      </div>\n      <div class=\"chain-foot\"><svg class=\"icon\" viewBox=\"0 0 20 20\" aria-hidden=\"true\"><circle cx=\"10\" cy=\"10\" r=\"7.5\"/><path d=\"M10 9v5m0-8v.2\"/></svg><span>实际出口取决于当前模式和分流规则，以本轮检查为准。</span></div>\n    </section>\n\n    <div id=\"state-warnings\" class=\"warning-list\" aria-live=\"polite\" hidden></div>\n    <div id=\"notice\" class=\"notice\" role=\"status\" aria-live=\"polite\" hidden></div>\n\n    <section class=\"check-area\" aria-label=\"执行链路检查\">\n      <button class=\"primary\" id=\"check-button\" type=\"button\" disabled><svg class=\"icon\" id=\"check-icon\" viewBox=\"0 0 20 20\" aria-hidden=\"true\"><path d=\"M2 10h3l2-6 4 12 2-6h5\"/></svg><span class=\"spinner\" id=\"check-spinner\" aria-hidden=\"true\" hidden></span><span id=\"check-label\">检查当前入口与出口</span></button>\n      <p class=\"check-note\"><svg class=\"icon\" viewBox=\"0 0 20 20\" aria-hidden=\"true\"><path d=\"m12 2-8 10h6l-2 6 8-10h-6z\"/></svg>点击才联网 · 一轮 8 项检查 · 无后台轮询</p>\n      <div id=\"progress-note\" class=\"progress-note\" role=\"status\" aria-live=\"polite\" hidden><strong>正在检查 8 项连接…</strong><span>正在核对入口、实际出口与 AI 接口，完成后一起展示。</span></div>\n    </section>\n\n    <div class=\"section-label\"><h2 id=\"switch-title\">手动切换入口</h2><span class=\"label-right\">保留 Mars 末端出口</span></div>\n    <section class=\"card switch-card\" aria-labelledby=\"switch-title\">\n      <label class=\"field-label\" id=\"select-label\" for=\"node-select\">香港手动策略</label>\n      <div class=\"select-wrap\"><select id=\"node-select\" disabled aria-describedby=\"selection-note impact-note\"><option>正在读取节点…</option></select><svg class=\"icon\" viewBox=\"0 0 20 20\" aria-hidden=\"true\"><path d=\"m5 7.5 5 5 5-5\"/></svg></div>\n      <div class=\"switch-row\"><span class=\"selection-note\" id=\"selection-note\">读取后可选择其他入口</span><button class=\"secondary\" id=\"select-button\" type=\"button\" disabled><span id=\"select-label-button\">切换入口</span><svg class=\"icon\" viewBox=\"0 0 20 20\" aria-hidden=\"true\"><path d=\"M3 6h13m-3-3 3 3-3 3M17 14H4m3-3-3 3 3 3\"/></svg></button></div>\n      <p class=\"impact-note\" id=\"impact-note\">切换会影响共用“香港手动策略”的其他流量。旧连接可能仍沿用原入口，必要时重开 AI App。</p>\n    </section>\n\n    <section id=\"results-section\" aria-labelledby=\"results-title\" aria-busy=\"false\">\n      <div class=\"result-head\"><h2 id=\"results-title\">检查结果</h2><button class=\"quiet-button\" id=\"copy-button\" type=\"button\" disabled><svg class=\"icon\" viewBox=\"0 0 20 20\" aria-hidden=\"true\"><rect x=\"7\" y=\"6\" width=\"9\" height=\"11\" rx=\"2\"/><path d=\"M12 6V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2\"/></svg><span>复制摘要</span></button></div>\n      <div class=\"empty\" id=\"empty-results\"><svg class=\"icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 17v3h16v-3M5 12h3l2-7 4 13 2-6h3\"/></svg><h3>还没有运行检查</h3><p>打开面板只读取状态。<br>点击上方按钮后，才会检测这条连接。</p></div>\n      <div id=\"results-content\" hidden>\n        <div class=\"summary\" id=\"summary-card\"><div class=\"summary-kicker\"><span id=\"summary-state\">检查已完成</span><time class=\"summary-time\" id=\"summary-time\"></time></div><h3 id=\"summary-title\"></h3><p id=\"summary-detail\"></p></div>\n        <div id=\"result-groups\"></div>\n        <div id=\"result-warnings\" class=\"warning-list\" hidden></div>\n        <p class=\"result-footnote\">HTTP 200 仅表示本次请求有响应，不代表账号、模型或网页功能全部可用。401 通常表示需要鉴权；403、429 会保留各自的限制说明。</p>\n      </div>\n    </section>\n    <footer class=\"footer\"><span><i class=\"live-dot\" aria-hidden=\"true\"></i>只在你操作时工作</span><span id=\"version\">MARS / v1.0.1</span></footer>\n    <div class=\"sr-only\" id=\"announcement\" role=\"status\" aria-live=\"polite\"></div>\n  </main>\n\n  <div class=\"modal-backdrop\" id=\"copy-modal\" hidden>\n    <section class=\"modal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"copy-modal-title\" aria-describedby=\"copy-modal-description\">\n      <h2 id=\"copy-modal-title\">复制诊断摘要</h2><p id=\"copy-modal-description\">浏览器未能自动复制。选中文本后，使用系统菜单复制。</p>\n      <textarea id=\"copy-text\" readonly spellcheck=\"false\" aria-label=\"诊断摘要\"></textarea>\n      <div class=\"modal-actions\"><button class=\"secondary\" id=\"copy-close\" type=\"button\">关闭</button><button class=\"secondary\" id=\"copy-select\" type=\"button\">选中摘要</button></div>\n    </section>\n  </div>\n\n  <script nonce=\"__MARS_CSRF_TOKEN__\">\n  (function () {\n    'use strict';\n    var el = {};\n    ['refresh-button','state-card','chain-name','mode-pill','mode-label','entry-label','current-node','exit-node','state-warnings','notice','check-button','check-icon','check-spinner','check-label','progress-note','select-label','node-select','selection-note','select-button','select-label-button','impact-note','results-section','copy-button','empty-results','results-content','summary-card','summary-state','summary-time','summary-title','summary-detail','result-groups','result-warnings','version','announcement','copy-modal','copy-text','copy-close','copy-select'].forEach(function (id) { el[id] = document.getElementById(id); });\n    var tokenMeta = document.querySelector('meta[name=\"mars-token\"]');\n    var token = tokenMeta ? tokenMeta.content : '';\n    var state = null;\n    var result = null;\n    var operation = '';\n    var staleReason = '';\n    var resultSignature = '';\n    var lastFocused = null;\n    var outcomeInfo = {\n      ok: ['已响应','ok'], auth: ['可达 · 需鉴权','info'], restricted: ['服务拒绝','warn'],\n      limited: ['限流 / 额度','warn'], server: ['服务异常','warn'], redirect: ['发生跳转','info'],\n      unexpected: ['结果待确认','warn'], network: ['连接未完成','error']\n    };\n\n    function text(value, fallback) { return typeof value === 'string' && value ? value : (fallback || ''); }\n    function strings(values) { return Array.isArray(values) ? values.filter(function (item) { return typeof item === 'string' && item; }) : []; }\n    function signature(value) { return value ? JSON.stringify([value.current,value.mode,value.chainName,value.entryGroup,value.exitNode]) : ''; }\n    function clearNode(node) { while (node.firstChild) node.removeChild(node.firstChild); }\n    function element(tag, className, content) { var node = document.createElement(tag); if (className) node.className = className; if (content !== undefined) node.textContent = content; return node; }\n    function announce(message) { el.announcement.textContent = message; }\n    function showNotice(message, tone) { el.notice.textContent = message; el.notice.dataset.tone = tone || 'ok'; el.notice.hidden = false; }\n    function clearNotice() { el.notice.hidden = true; el.notice.textContent = ''; }\n    function fillWarnings(target, items) {\n      clearNode(target);\n      var seen = {};\n      strings(items).forEach(function (message) { if (!seen[message]) { seen[message] = true; target.appendChild(element('div','warning',message)); } });\n      target.hidden = !target.childNodes.length;\n    }\n    function timeLabel(iso, full) {\n      var date = new Date(iso);\n      if (isNaN(date.getTime())) return '时间未知';\n      try { return full ? date.toLocaleString('zh-CN',{hour12:false}) : date.toLocaleTimeString('zh-CN',{hour12:false,hour:'2-digit',minute:'2-digit'}); }\n      catch (_) { return date.toISOString(); }\n    }\n    function isStale() { return !!(result && (result.stale || staleReason)); }\n    function markStale(reason) { if (result) { staleReason = reason || '当前入口或运行模式已变化，请重新检查。'; renderResults(); } }\n    function setOperation(value) {\n      operation = value;\n      el['state-card'].setAttribute('aria-busy', value === 'refresh' ? 'true' : 'false');\n      el['results-section'].setAttribute('aria-busy', value === 'check' ? 'true' : 'false');\n      el['check-spinner'].hidden = value !== 'check';\n      el['check-icon'].hidden = value === 'check';\n      el['check-label'].textContent = value === 'check' ? '正在检查…' : '检查当前入口与出口';\n      el['select-label-button'].textContent = value === 'select' ? '正在切换…' : '切换入口';\n      el['progress-note'].hidden = value !== 'check';\n      updateControls();\n    }\n    function updateControls() {\n      var localBusy = !!operation;\n      var blocked = localBusy || !state || !!state.busy;\n      el['refresh-button'].disabled = localBusy;\n      el['check-button'].disabled = blocked || !state.current;\n      el['node-select'].disabled = blocked || !state.candidates.length;\n      el['select-button'].disabled = blocked || !el['node-select'].value || el['node-select'].value === state.current || state.candidates.indexOf(el['node-select'].value) < 0;\n      el['copy-button'].disabled = localBusy || !result;\n      var pending = !!(state && el['node-select'].value && el['node-select'].value !== state.current);\n      el['selection-note'].classList.toggle('pending', pending);\n      el['selection-note'].textContent = !state ? '读取后可选择其他入口' : state.busy ? '另一项操作正在运行，完成后请刷新状态' : pending ? '尚未切换；检查仍使用当前入口' : '当前使用此入口';\n    }\n    function applyState(data, resetSelection) {\n      if (!data || data.ok !== true || !Array.isArray(data.candidates)) throw new Error('未获得有效状态，请刷新后重试。');\n      var oldCurrent = state ? state.current : '';\n      var wanted = el['node-select'].value;\n      state = {\n        version:text(data.version,'1.0.1'), chainName:text(data.chainName,'Mars-链式'), entryGroup:text(data.entryGroup,'香港手动策略'),\n        exitNode:text(data.exitNode,'Mars-ISP'), current:text(data.current), candidates:strings(data.candidates),\n        mode:[0,1,2].indexOf(data.mode) >= 0 ? data.mode : null, modeLabel:text(data.modeLabel,'模式未知'),\n        warnings:strings(data.warnings), busy:!!data.busy\n      };\n      if (result && resultSignature && signature(state) !== resultSignature) markStale('当前入口、运行模式或链路配置已变化，请重新检查。');\n      el['chain-name'].textContent = state.chainName;\n      el['entry-label'].textContent = state.entryGroup + ' · 当前入口';\n      el['select-label'].textContent = state.entryGroup;\n      el['current-node'].textContent = state.current || '未读取到当前入口';\n      el['current-node'].classList.remove('loading');\n      el['exit-node'].textContent = state.exitNode;\n      el['mode-label'].textContent = state.modeLabel;\n      el['mode-pill'].dataset.tone = state.mode === 1 ? 'ok' : 'warn';\n      el.version.textContent = 'MARS / v' + state.version;\n      el['impact-note'].textContent = '切换会影响共用“' + state.entryGroup + '”的其他流量。旧连接可能仍沿用原入口，必要时重开 AI App。';\n      clearNode(el['node-select']);\n      if (!state.candidates.length) {\n        var empty = element('option','', '没有可用的入口候选'); empty.value = ''; el['node-select'].appendChild(empty);\n      } else {\n        if (state.current && state.candidates.indexOf(state.current) < 0) { var currentOption = element('option','',state.current + '（当前项）'); currentOption.value = state.current; currentOption.disabled = true; el['node-select'].appendChild(currentOption); }\n        state.candidates.forEach(function (name) { var option = element('option','',name); option.value = name; el['node-select'].appendChild(option); });\n        el['node-select'].value = !resetSelection && oldCurrent === state.current && state.candidates.indexOf(wanted) >= 0 ? wanted : state.current;\n        if (!el['node-select'].value && !state.current) el['node-select'].selectedIndex = 0;\n      }\n      var warnings = state.warnings.slice();\n      if (state.mode === 0) warnings.unshift('当前是全局直连。出口与 AI 检查将反映当前模式，不能据此认定已通过 Mars 链路。');\n      else if (state.mode === 2) warnings.unshift('当前是全局代理。出口与 AI 检查遵循当前全局策略，可能与上方预期链路不同。');\n      else if (state.mode === null) warnings.unshift('暂未识别运行模式，请结合实际出口判断这轮检查。');\n      if (state.busy) warnings.push('已有检查或切换正在运行。完成后点击“刷新状态”即可继续。');\n      fillWarnings(el['state-warnings'], warnings);\n      updateControls();\n    }\n    async function api(path, method, payload) {\n      var controller = typeof AbortController === 'function' ? new AbortController() : null;\n      var timeout = null;\n      var headers = {'X-Mars-Token':token,'Accept':'application/json'};\n      var options = {method:method || 'GET',headers:headers,cache:'no-store',credentials:'omit',redirect:'error'};\n      if (controller) options.signal = controller.signal;\n      if (payload !== undefined) { headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(payload); }\n      async function performRequest() {\n        var response = await fetch(path, options);\n        var data;\n        try { data = await response.json(); } catch (_) { throw new Error('没有收到面板的有效响应。请确认 Loon 已连接，并打开 http://mars.loon.test/。'); }\n        if (!response.ok || !data || data.ok !== true) {\n          var error = new Error(text(data && data.error && data.error.message,'操作未完成，请刷新状态后重试。'));\n          error.code = text(data && data.error && data.error.code);\n          throw error;\n        }\n        return data;\n      }\n      var deadline = new Promise(function (_, reject) {\n        timeout = setTimeout(function () {\n          var error = new Error('等待响应超时。请先刷新状态，确认上一项操作是否已经完成。');\n          error.name = 'AbortError';\n          reject(error);\n          if (controller) controller.abort();\n        }, path === '/api/check' ? 33000 : 15000);\n      });\n      try {\n        return await Promise.race([performRequest(),deadline]);\n      } catch (error) {\n        if (error && error.name === 'AbortError') throw new Error('等待响应超时。请先刷新状态，确认上一项操作是否已经完成。');\n        if (error instanceof TypeError) throw new Error('暂时无法连接面板。请确认 Loon 和本插件已启用，再刷新状态。');\n        throw error;\n      } finally { if (timeout !== null) clearTimeout(timeout); }\n    }\n    async function refreshState(silent, resetSelection) {\n      var data = await api('/api/state');\n      applyState(data, !!resetSelection);\n      if (!silent) { showNotice(isStale() ? '状态已刷新；旧检查结果已过期，请重新检查。' : '状态已刷新，没有发起外部探测。', isStale() ? 'warn' : 'ok'); announce('当前状态已刷新'); }\n      return data;\n    }\n    function normalizeResult(data) {\n      if (!Array.isArray(data.results) || !data.summary) throw new Error('检查返回内容不完整，请重试。');\n      return {\n        startedAt:text(data.startedAt),finishedAt:text(data.finishedAt),current:text(data.current),mode:[0,1,2].indexOf(data.mode) >= 0 ? data.mode : null,stale:!!data.stale,\n        summary:{headline:text(data.summary.headline,'检查已完成'),detail:text(data.summary.detail)},warnings:strings(data.warnings),\n        results:data.results.filter(function (item) { return item && (item.scope === 'entry' || item.scope === 'route'); }).map(function (item) {\n          return {id:text(item.id),label:text(item.label,'连接检查'),scope:item.scope,httpStatus:typeof item.httpStatus === 'number' ? item.httpStatus : null,\n            latencyMs:typeof item.latencyMs === 'number' && isFinite(item.latencyMs) ? item.latencyMs : null,\n            outcome:Object.prototype.hasOwnProperty.call(outcomeInfo,item.outcome) ? item.outcome : 'unexpected',reachable:!!item.reachable,\n            title:text(item.title),detail:text(item.detail),ip:text(item.ip),notRun:text(item.title).indexOf('未运行') === 0};\n        })\n      };\n    }\n    function renderResults() {\n      el['empty-results'].hidden = !!result;\n      el['results-content'].hidden = !result;\n      el['results-section'].classList.toggle('is-stale',isStale());\n      if (!result) return;\n      var stale = isStale();\n      var hasNetwork = result.results.some(function (item) { return item.outcome === 'network' && !item.notRun; });\n      var hasWarning = result.results.some(function (item) { return item.notRun || ['restricted','limited','server','unexpected'].indexOf(item.outcome) >= 0; });\n      el['summary-card'].dataset.tone = stale ? 'warn' : hasNetwork ? 'error' : hasWarning ? 'warn' : 'ok';\n      el['summary-state'].textContent = stale ? '旧结果 · 需要重新检查' : '本轮检查已完成';\n      el['summary-time'].textContent = timeLabel(result.finishedAt,false);\n      el['summary-time'].dateTime = result.finishedAt;\n      el['summary-time'].title = timeLabel(result.finishedAt,true);\n      el['summary-title'].textContent = stale ? '这份结果已过期' : result.summary.headline;\n      el['summary-detail'].textContent = stale ? (staleReason || '检查期间入口或模式发生变化，请重新检查当前连接。') : result.summary.detail;\n      clearNode(el['result-groups']);\n      ['entry','route'].forEach(function (scope) {\n        var items = result.results.filter(function (item) { return item.scope === scope; });\n        if (!items.length) return;\n        var group = element('section','results-group'); group.dataset.scope = scope;\n        var header = element('div','group-header'); header.appendChild(element('span','group-marker',scope === 'entry' ? '01' : '02'));\n        var heading = element('div','');\n        heading.appendChild(element('h3','',scope === 'entry' ? '入口单独检查' : (result.mode === 1 ? '当前分流出口与 AI' : '当前模式出口与 AI')));\n        heading.appendChild(element('p','',scope === 'entry' ? '仅检查所选香港入口；不能代表完整 Mars 链路。' : '按本轮运行模式与规则请求；与上方预期链路分开判断。'));\n        header.appendChild(heading);group.appendChild(header);\n        var list = element('div','result-items');\n        items.forEach(function (item) {\n          var row = element('article','result-item');\n          var topline = element('div','result-topline');topline.appendChild(element('div','result-name',item.label));\n          var info = item.notRun ? ['未运行','warn'] : outcomeInfo[item.outcome];var badge = element('span','result-badge',stale ? '旧结果' : info[0]);badge.dataset.tone = info[1];topline.appendChild(badge);row.appendChild(topline);\n          if (item.title) row.appendChild(element('div','result-title',item.title));\n          if (item.detail) row.appendChild(element('p','result-detail',item.detail));\n          if (item.ip) row.appendChild(element('p','result-ip','IP  ' + item.ip));\n          var meta = element('div','result-meta');\n          meta.appendChild(element('span','',item.notRun ? '未执行请求' : item.httpStatus === null ? '未取得 HTTP 状态' : 'HTTP ' + item.httpStatus));\n          if (!item.notRun && item.latencyMs !== null) meta.appendChild(element('span','',Math.max(0,Math.round(item.latencyMs)) + ' ms'));\n          if (stale) meta.appendChild(element('span','','仅供回看'));\n          row.appendChild(meta);list.appendChild(row);\n        });\n        group.appendChild(list);el['result-groups'].appendChild(group);\n      });\n      fillWarnings(el['result-warnings'],result.warnings);\n      updateControls();\n    }\n    async function recoverState() {\n      try { await refreshState(true,false); } catch (_) { /* Keep the original operation error visible. */ }\n    }\n    async function runCheck() {\n      if (!state || operation || state.busy) return;\n      clearNotice();\n      var expected = state.current;\n      var before = signature(state);\n      setOperation('check');announce('正在检查 8 项连接');\n      try {\n        var data = await api('/api/check','POST',{expectedCurrent:expected});\n        result = normalizeResult(data);resultSignature = before;staleReason = '';\n        if (result.stale || result.current !== expected || result.mode !== state.mode) staleReason = '检查期间入口或运行模式发生变化，这轮结果不再代表当前连接。';\n        renderResults();\n        try { await refreshState(true,false); }\n        catch (_) { markStale('检查已完成，但未能复核当前状态。请刷新状态后重新检查。'); showNotice('未能复核检查后的当前状态，请刷新后重试。','warn'); }\n        announce(isStale() ? '检查已结束，但结果已过期，请重新检查' : '检查完成，结果已更新');\n      } catch (error) { showNotice(error.message || '检查未完成，请重试。','error'); await recoverState(); announce('检查未完成'); }\n      finally { setOperation(''); }\n    }\n    async function selectNode() {\n      if (!state || operation || state.busy) return;\n      var selected = el['node-select'].value;\n      if (!selected || selected === state.current || state.candidates.indexOf(selected) < 0) return;\n      var previous = state.current;\n      clearNotice();setOperation('select');\n      try {\n        var data = await api('/api/select','POST',{node:selected,expectedCurrent:previous});\n        var actual = text(data.current,previous);\n        if (data.changed || actual !== previous) markStale('入口已切换。上次结果属于旧连接，请重新检查当前入口与出口。');\n        state.current = actual;\n        el['current-node'].textContent = actual;\n        el['node-select'].value = actual;\n        var message = data.changed || actual !== previous ? '已切换至“' + actual + '”。请检查新连接；旧长连接可能需要重开 AI App。' : '当前已使用这个入口。';\n        if (text(data.warning)) message += ' ' + data.warning;\n        try { await refreshState(true,true); }\n        catch (_) { message += ' 暂未刷新到完整状态，可点击“刷新状态”确认。'; }\n        showNotice(message,text(data.warning) ? 'warn' : 'ok');announce('入口选择已更新');\n      } catch (error) { showNotice(error.message || '切换未完成，请刷新状态后重试。','error'); await recoverState();announce('切换未完成'); }\n      finally { setOperation(''); }\n    }\n    function safeLine(value, limit) { return String(value === null || value === undefined ? '' : value).replace(/[\\r\\n\\t]+/g,' ').slice(0,limit || 400); }\n    function diagnostics() {\n      var lines = ['Mars AI 链路快检 v' + safeLine(state ? state.version : '1.0.1',30),'复制时间：' + timeLabel(new Date().toISOString(),true)];\n      if (state) { lines.push('当前入口：' + safeLine(state.current),'当前模式：' + safeLine(state.modeLabel,80),'预期链路：' + safeLine(state.entryGroup,100) + ' → ' + safeLine(state.exitNode,100) + '（配置关系，非逐跳验证）'); }\n      if (!result) return lines.join('\\n');\n      lines.push('检查完成：' + timeLabel(result.finishedAt,true),'本轮入口：' + safeLine(result.current),'时效：' + (isStale() ? '已过期，不能代表当前连接' : '本轮完成后已复核当前状态'));\n      if (isStale()) lines.push('过期原因：' + safeLine(staleReason || '检查期间状态发生变化'));\n      lines.push('摘要：' + safeLine(result.summary.headline),'说明：' + safeLine(result.summary.detail,700),'');\n      result.results.forEach(function (item) {\n        lines.push('[' + (item.scope === 'entry' ? '入口单独检查' : '当前模式与分流') + '] ' + safeLine(item.label,100));\n        lines.push('  ' + safeLine(item.title || outcomeInfo[item.outcome][0],200) + ' | ' + (item.notRun ? '未执行请求' : item.httpStatus === null ? '未取得 HTTP 状态' : 'HTTP ' + item.httpStatus) + (item.notRun || item.latencyMs === null ? '' : ' | ' + Math.max(0,Math.round(item.latencyMs)) + ' ms'));\n        if (item.ip) lines.push('  IP：' + safeLine(item.ip,100));\n        if (item.detail) lines.push('  ' + safeLine(item.detail,700));\n      });\n      var warnings = (state ? state.warnings : []).concat(result.warnings);\n      if (warnings.length) { lines.push('','提示：');warnings.forEach(function (warning) { lines.push('- ' + safeLine(warning,700)); }); }\n      lines.push('','本摘要仅含状态与检查结果，不含节点密码、证书或订阅配置。','HTTP 可达不等于账号、模型或网页功能全部可用。');\n      return lines.join('\\n');\n    }\n    function closeCopyModal() { el['copy-modal'].hidden = true; if (lastFocused && lastFocused.focus) lastFocused.focus(); }\n    function openCopyModal(value) { lastFocused = document.activeElement;el['copy-text'].value = value;el['copy-modal'].hidden = false;el['copy-text'].focus();el['copy-text'].select(); }\n    async function copyDiagnostics() {\n      if (!result || operation) return;\n      var value = diagnostics();\n      try {\n        if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(value);showNotice('诊断摘要已复制。');return; }\n      } catch (_) { /* HTTP pages may not have Clipboard API access. */ }\n      var area = document.createElement('textarea');area.value = value;area.setAttribute('readonly','');area.setAttribute('aria-hidden','true');area.style.position = 'fixed';area.style.opacity = '0';area.style.pointerEvents = 'none';area.style.top = '0';area.style.left = '0';document.body.appendChild(area);\n      var copied = false;\n      try { area.focus();area.select();area.setSelectionRange(0,area.value.length);copied = document.execCommand('copy'); } catch (_) {}\n      area.remove();\n      if (copied) { el['copy-button'].focus();showNotice('诊断摘要已复制。'); }\n      else openCopyModal(value);\n    }\n    el['refresh-button'].addEventListener('click',async function () {\n      if (operation) return;\n      clearNotice();setOperation('refresh');\n      try { await refreshState(false,false); } catch (error) { showNotice(error.message || '刷新失败，请重试。','error'); }\n      finally { setOperation(''); }\n    });\n    el['check-button'].addEventListener('click',runCheck);\n    el['select-button'].addEventListener('click',selectNode);\n    el['node-select'].addEventListener('change',updateControls);\n    el['copy-button'].addEventListener('click',copyDiagnostics);\n    el['copy-close'].addEventListener('click',closeCopyModal);\n    el['copy-select'].addEventListener('click',function () { el['copy-text'].focus();el['copy-text'].select();el['copy-text'].setSelectionRange(0,el['copy-text'].value.length); });\n    el['copy-modal'].addEventListener('click',function (event) { if (event.target === el['copy-modal']) closeCopyModal(); });\n    document.addEventListener('keydown',function (event) {\n      if (el['copy-modal'].hidden) return;\n      if (event.key === 'Escape') { event.preventDefault();closeCopyModal(); }\n      if (event.key === 'Tab') { var first = el['copy-text'];var last = el['copy-select'];if (event.shiftKey && document.activeElement === first) { event.preventDefault();last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault();first.focus(); } }\n    });\n    (async function () {\n      setOperation('refresh');\n      try { await refreshState(true,true); }\n      catch (error) { el['current-node'].textContent = '尚未读取到状态';el['mode-label'].textContent = '未连接面板';showNotice(error.message || '无法读取状态，请确认插件已启用。','error'); }\n      finally { setOperation(''); }\n    })();\n  })();\n  </script>\n</body>\n</html>\n";
  var VERSION = '1.0.1';
  var ORIGIN = 'http://mars.loon.test';
  var ENTRY = '香港手动策略';
  var EXIT = 'Mars-ISP';
  var CHAIN = 'Mars-链式';
  var PREFIX = 'shiina.mars-ai.v1.';
  var REQUEST_TIMEOUT = 6500;
  var PROBES = [
    {id:'entry-ip', label:'香港入口单测', scope:'entry', kind:'ip', url:'https://api.ipify.org?format=json'},
    {id:'route-ip', label:'当前分流出口', scope:'route', kind:'ip', url:'https://api.ipify.org?format=json'},
    {id:'openai-api', label:'OpenAI API', scope:'route', kind:'openai', url:'https://api.openai.com/v1/models'},
    {id:'chatgpt-web', label:'ChatGPT 网页域名', scope:'route', kind:'robots', url:'https://chatgpt.com/robots.txt'},
    {id:'claude-api', label:'Claude API', scope:'route', kind:'anthropic', url:'https://api.anthropic.com/v1/models'},
    {id:'claude-web', label:'Claude 网页域名', scope:'route', kind:'robots', url:'https://claude.ai/robots.txt'},
    {id:'gemini-api', label:'Gemini API', scope:'route', kind:'google', url:'https://generativelanguage.googleapis.com/v1beta/models'},
    {id:'gemini-web', label:'Gemini 网页域名', scope:'route', kind:'robots', url:'https://gemini.google.com/robots.txt'}
  ];

  function fault(code, message, status) {
    var e = new Error(message);
    e.code = code; e.status = status || 400;
    return e;
  }
  function parseJSON(s) { try { return JSON.parse(s); } catch (_) { return null; } }
  function header(headers, name) {
    var keys = Object.keys(headers || {});
    for (var i=0;i<keys.length;i++) if (keys[i].toLowerCase() === name.toLowerCase()) return String(headers[keys[i]]);
    return '';
  }
  function normalizeCandidates(text) {
    var value = typeof text === 'string' ? parseJSON(text) : null;
    if (!Array.isArray(value)) return [];
    var seen = Object.create(null);
    return value.filter(function (x) {
      if (typeof x !== 'string' || !x.trim() || x.length > 512 || /[\u0000-\u001f]/.test(x) || seen[x]) return false;
      seen[x] = true; return true;
    }).slice(0,1000);
  }
  function validIP(ip) {
    // The supplied profile is IPv4-only, and api.ipify.org is the IPv4 endpoint.
    if (typeof ip !== 'string' || !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) return false;
    return ip.split('.').every(function (x) { return Number(x) <= 255; });
  }
  function networkMessage(error) {
    var e = String(error || '').toLowerCase();
    if (/timeout|timed out|超时/.test(e)) return '请求超时；本轮不自动重试。';
    if (/certificate|ssl|tls|证书/.test(e)) return 'TLS 或证书校验失败；检查设备时间、代理连接和解密配置。';
    if (/dns|resolve|name.*found|解析/.test(e)) return '域名解析未完成；检查当前 DNS 和分流。';
    if (/407|socks|authentication|认证/.test(e)) return '代理连接或认证未完成；需结合 Loon 请求记录定位。';
    return '未完成 HTTP 请求；可能涉及网络、入口、Mars 或目标服务，单次结果无法定位具体一跳。';
  }
  function classify(probe, error, response, data, latencyMs) {
    var status = response && Number(response.status);
    var r = {id:probe.id,label:probe.label,scope:probe.scope,url:probe.url,
      httpStatus:status >= 100 && status <= 599 ? status : null,
      latencyMs:Math.max(0,Math.round(latencyMs)),reachable:false,outcome:'network',title:'未完成 HTTP 探测',detail:''};
    if (!r.httpStatus) { r.detail = networkMessage(error); return r; }
    r.reachable = true;
    if (error) {
      r.outcome='unexpected'; r.title='已收到 HTTP 状态，传输未完整结束'; r.detail=networkMessage(error); return r;
    }
    var text = typeof data === 'string' ? data.slice(0,65536) : '';
    var json = parseJSON(text);
    var err = json && json.error && typeof json.error === 'object' ? json.error : {};
    var code = [err.code,err.type,err.status].filter(function (v) { return typeof v==='string'; }).join(' ').toLowerCase();
    var message = typeof err.message === 'string' ? err.message.toLowerCase() : '';
    var regional = /(?:^|\s)(?:unsupported_country_region_territory|region_not_supported|country_not_supported)(?:$|\s)/.test(code) ||
      /country, region,? or territory not supported|user location is not supported for the api use|your country is not supported/.test(message);
    if (regional) {
      r.outcome='restricted'; r.title='服务明确报告地域受限';
      r.detail='已收到目标响应；当前服务返回了明确的地区限制错误。切换前置入口未必改变 Mars 最终出口。'; return r;
    }
    if (status===401) {
      r.outcome='auth'; r.title='HTTP 可达 · 需要鉴权';
      r.detail='本探测没有发送账号或 API 密钥。401 证明收到 HTTP 响应，不证明账号、模型或完整网页可用。'; return r;
    }
    if (status===403) {
      r.outcome='restricted'; r.title='HTTP 可达 · 请求被拒绝';
      r.detail=/cloudflare|cf-chl-|challenge-platform|just a moment|captcha/i.test(text) ?
        '返回了风控或挑战页面；不能仅据此判断地区不支持，也不表示代理完全不通。' :
        '可能是未提供密钥、权限、风控或访问策略；未发现明确地域错误，不能判断为地区封锁。'; return r;
    }
    if (status===429) {
      r.outcome='limited'; r.title='HTTP 可达 · 限流或额度限制'; r.detail='请求已有响应；限速、配额或风控原因需在对应服务中确认。'; return r;
    }
    if (status>=500) {
      r.outcome='server'; r.title='已响应 · 服务端异常'; r.detail='目标服务或中间网关返回 '+status+'；不能仅据此认定香港入口故障。'; return r;
    }
    if (status>=300 && status<400) {
      r.outcome='redirect'; r.title='HTTP 可达 · 返回跳转'; r.detail='为控制请求数量，本次没有继续跟随跳转；最终页面尚未验证。'; return r;
    }
    if (status>=200 && status<300) {
      if (probe.kind==='ip' && json && validIP(json.ip)) {
        r.outcome='ok'; r.title='已取得出口 IP'; r.ip=json.ip;
        r.detail=probe.scope==='entry' ? '强制使用“香港手动策略”单测，仅代表前置入口。' : '沿用当前路由；你的配置预期由 api.ipify.org 规则进入 Mars-链式。'; return r;
      }
      var expected = probe.kind==='robots' ? /(?:^|\n)\s*(?:user-agent|disallow|allow|sitemap)\s*:/i.test(text) && !/<html|cf-chl-|challenge-platform/i.test(text) :
        json && ((probe.kind==='openai' || probe.kind==='anthropic') ? Array.isArray(json.data) : probe.kind==='google' && Array.isArray(json.models));
      if (expected) {
        r.outcome='ok'; r.title='HTTP 可达 · 响应符合预期';
        r.detail=probe.kind==='robots' ? '只验证 robots.txt；登录、对话、上传和流式输出尚未验证。' : '模型目录端点有正常响应；没有调用生成接口，也未验证账号权限。'; return r;
      }
      r.outcome='unexpected'; r.title='已响应 · 内容不符合预期';
      r.detail='HTTP '+status+' 但未得到预期内容；可能是挑战页、空响应、拦截替换或端点变化，不能当作检查通过。'; return r;
    }
    r.outcome='unexpected'; r.title='HTTP 可达 · 需确认服务返回';
    r.detail='收到 HTTP '+status+'；没有完成业务操作，可能需要鉴权、其他方法或不同端点。'; return r;
  }
  function summarize(results, mode, stale) {
    var entry=results.filter(function(r){return r.id==='entry-ip';})[0];
    var exit=results.filter(function(r){return r.id==='route-ip';})[0];
    var ai=results.filter(function(r){return r.kind!=='ip' && r.id!=='entry-ip' && r.id!=='route-ip';});
    var reachable=ai.filter(function(r){return r.reachable;}).length;
    if(stale) return {headline:'检查期间入口或模式发生变化',detail:'本轮结果已过期，不能用于评价当前选择；请重新检查。'};
    if(mode!==1) return {headline:'当前模式无法验证预期的 Mars 分流',detail:'请在 Loon 使用分流模式，再重新检查。以下结果只反映本轮当前路由。'};
    if(exit && exit.ip && reachable===ai.length) {
      var limited=ai.some(function(r){return r.outcome!=='ok' && r.outcome!=='auth';});
      if(entry && !entry.ip) return {headline:'出口与 AI 已响应，入口单测需复查',detail:'入口 IP 查询没有有效结果；单个探测服务的差异不能证明香港入口断开。'};
      return {headline:limited?'出口已连通，部分 AI 响应需确认':'当前分流可达，AI HTTP 探测有响应',detail:'已取得当前出口 IP；服务响应不等于账号可用，也不构成经过每一跳的直接证据。'};
    }
    if(exit && exit.ip) return {headline:'已取得出口 IP，部分 AI 探测未完成',detail:'优先查看失败服务的状态；若只有单个域名失败，检查其分流命中、服务状态和限制。'};
    if(reachable>0) return {headline:'部分 AI 已响应，出口查询未确认',detail:'IP 查询失败不等于整条网络中断；结合下方各服务结果和 Loon 请求记录定位。'};
    if(entry && entry.ip) return {headline:'入口单测正常，当前分流请求未完成',detail:'重点检查 Mars-ISP 连通性、链式配置与规则命中；本结果仍不能直接确定故障在哪一跳。'};
    return {headline:'本轮未取得有效出口或 AI 响应',detail:'先检查网络、Loon 运行模式和香港入口；也可能是超时或多个目标服务暂时无响应。'};
  }

  function createRuntime(api, panelHTML) {
    var finished=false, leaseId=null;
    var now=api.now || Date.now;
    function requireConfig() {
      if(!api.config || typeof api.config.getSelectedPolicy!=='function' || typeof api.config.getConfig!=='function')
        throw fault('API_UNAVAILABLE','Loon 配置 API 不可用；请确认由 Loon 运行脚本并检查版本。',503);
    }
    function current() { requireConfig(); var v=api.config.getSelectedPolicy(ENTRY); return typeof v==='string'?v:''; }
    function mode() {
      requireConfig();
      var c=parseJSON(api.config.getConfig() || '{}');
      var m=c && c.running_model;
      return m===0 || m===1 || m===2 ? m : null;
    }
    function modeLabel(m) { return m===1?'分流模式':m===0?'全局直连':m===2?'全局代理':'模式未知'; }
    function storageRead(key) {
      if(!api.store || typeof api.store.read!=='function' || typeof api.store.write!=='function')
        throw fault('STORAGE_UNAVAILABLE','Loon 本地存储 API 不可用，无法启动面板保护。',503);
      return api.store.read(PREFIX+key);
    }
    function storageWrite(key,value) {
      storageRead(key);
      if(api.store.write(value,PREFIX+key)!==true) throw fault('STORAGE_FAILED','Loon 本地存储写入失败，请稍后重新打开面板。',503);
    }
    function nonce() {
      // Origin checking and a custom header are the primary CSRF protections.
      // This is a per-installation anti-CSRF nonce, not a cryptographic login key.
      var v=''; for(var i=0;i<8;i++) v+=Math.floor(Math.random()*0x100000000).toString(16).padStart(8,'0');
      return v;
    }
    function token() {
      var v=storageRead('csrf');
      if(typeof v==='string' && /^[a-f0-9]{64}$/.test(v)) return v;
      v=nonce(); storageWrite('csrf',v); return v;
    }
    function busy() {
      var l=parseJSON(storageRead('lease') || 'null');
      return !!(l && typeof l.until==='number' && l.until>now());
    }
    function acquire() {
      if(busy()) throw fault('BUSY','另一个检查或切换仍在运行；请等待完成，异常中断后最多 40 秒自动解锁。',409);
      leaseId=nonce(); storageWrite('lease',JSON.stringify({id:leaseId,until:now()+40000}));
      var actual=parseJSON(storageRead('lease') || 'null');
      if(!actual || actual.id!==leaseId) { leaseId=null; throw fault('BUSY','另一个操作已先开始，请稍后再试。',409); }
    }
    function release() {
      if(!leaseId) return;
      try {
        var l=parseJSON(storageRead('lease') || 'null');
        if(l && l.id===leaseId) api.store.write(undefined,PREFIX+'lease');
      } catch(_) {}
      leaseId=null;
    }
    function complete(payload) {
      if(finished) return;
      finished=true; release(); api.done(payload);
    }
    function headers(type,nonceValue) {
      var h={'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
      if(nonceValue) h['Content-Security-Policy']="default-src 'none'; script-src 'nonce-"+nonceValue+"'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
      return h;
    }
    function jsonResponse(status,payload) { return {response:{status:status,headers:headers('application/json'),body:JSON.stringify(payload)}}; }
    function verifyRequest(request) {
      if(header(request.headers,'X-Mars-Token')!==token()) throw fault('BAD_TOKEN','页面令牌失效，请刷新面板后重试。',403);
      var origin=header(request.headers,'Origin');
      if(origin && origin!==ORIGIN) throw fault('BAD_ORIGIN','拒绝跨站请求。',403);
      if(request.method==='POST') {
        if(origin!==ORIGIN) throw fault('BAD_ORIGIN','写入操作必须来自本面板；请在 Safari 重新打开面板。',403);
        if(!/^application\/json(?:\s*;|$)/i.test(header(request.headers,'Content-Type'))) throw fault('BAD_CONTENT_TYPE','只接受 JSON 请求。',415);
      }
    }
    function bodyJSON(request,allowed) {
      if(typeof request.body!=='string' || request.body.length>4096) throw fault('BAD_BODY','请求格式不正确或内容过长。');
      var body=parseJSON(request.body);
      if(!body || typeof body!=='object' || Array.isArray(body) || Object.keys(body).some(function(k){return allowed.indexOf(k)<0;})) throw fault('BAD_BODY','请求字段不正确。');
      return body;
    }
    function sameSelection(expected) {
      var c=current();
      if(typeof expected!=='string' || expected!==c) throw fault('STALE_SELECTION','当前入口已变化；请先刷新状态，再执行操作。',409);
      if(!c) throw fault('GROUP_MISSING','未找到“香港手动策略”的当前选择，请检查主配置和订阅。',409);
      return c;
    }
    function candidates() {
      return new Promise(function(resolve,reject) {
        var settled=false;
        function finish(err,value) { if(settled || finished) return; settled=true; if(err) reject(err); else resolve(value); }
        api.schedule(function(){finish(fault('CANDIDATES_TIMEOUT','读取入口候选超时；请确认策略组名称、Loon 版本和订阅状态。',504));},1800);
        if(!api.config || typeof api.config.getSubPolicies!=='function') {finish(fault('API_UNAVAILABLE','当前 Loon 不提供候选读取接口。',503));return;}
        try {api.config.getSubPolicies(ENTRY,function(text){finish(null,normalizeCandidates(text));});}
        catch(_) {finish(fault('CANDIDATES_FAILED','读取入口候选失败；请检查策略组和 Loon 版本。',503));}
      });
    }
    async function state() {
      var c=current(),m=mode(),list=[],warnings=[];
      try { list=await candidates(); } catch(e) { warnings.push(e.message); }
      if(!c) warnings.push('未取得香港手动策略的当前选项；请检查主配置中的策略组。');
      if(!list.length) warnings.push('未取得可选节点；手动切换暂不可用。');
      if(m!==1) warnings.push('当前为'+modeLabel(m)+'，不能用现有 AI 分流规则验证预期的 Mars 链路。');
      return {ok:true,version:VERSION,panelUrl:ORIGIN+'/',chainName:CHAIN,entryGroup:ENTRY,exitNode:EXIT,current:c,candidates:list,mode:m,modeLabel:modeLabel(m),warnings:warnings,busy:busy()};
    }
    function probe(spec) {
      return new Promise(function(resolve) {
        var settled=false,start=now();
        function finish(error,response,data,callbackMissing) {
          if(settled || finished) return; settled=true;
          var result=classify(spec,error,response,data,now()-start);
          if(callbackMissing) {
            result.callbackMissing=true;
            result.detail='HTTP 接口未在时限内返回回调，已停止调度后续探测。请稍后重试并检查 Loon 运行状态。';
          }
          if(result.ip && api.utils) {
            var details=[];
            [['geoip','地区'],['ipasn','ASN'],['ipaso','网络']].forEach(function(pair){
              try {
                if(typeof api.utils[pair[0]]==='function') {
                  var v=api.utils[pair[0]](result.ip);
                  if((typeof v==='string' || typeof v==='number') && String(v).length<160) details.push(pair[1]+'：'+v);
                }
              } catch(_) {}
            });
            if(details.length) result.detail+=' 本地数据库：'+details.join(' · ')+'（仅供核对）。';
          }
          resolve(result);
        }
        var opts={url:spec.url,timeout:REQUEST_TIMEOUT,headers:{'Accept':spec.kind==='robots'?'text/plain,*/*;q=0.1':'application/json','Cache-Control':'no-cache','Pragma':'no-cache','Connection':'close'},'auto-redirect':false,'auto-cookie':false,insecure:false};
        if(spec.scope==='entry') opts.node=ENTRY;
        if(spec.kind==='anthropic') opts.headers['anthropic-version']='2023-06-01';
        api.schedule(function(){finish('request timeout',null,'',true);},REQUEST_TIMEOUT+500);
        try {api.http.get(opts,finish);} catch(_) {finish('request failed',null,'');}
      });
    }
    async function check(expected) {
      var startCurrent=sameSelection(expected),startMode=mode();
      if(!api.http || typeof api.http.get!=='function') throw fault('HTTP_UNAVAILABLE','Loon HTTP 脚本接口不可用。',503);
      acquire();
      var startedAt=new Date(now()).toISOString();
      var results=new Array(PROBES.length),next=0,callbackMissing=false;
      async function worker() {
        while(next<PROBES.length && !finished && !callbackMissing) {
          var i=next++;
          results[i]=await probe(PROBES[i]);
          if(results[i].callbackMissing) { callbackMissing=true; delete results[i].callbackMissing; }
        }
      }
      await Promise.all([worker(),worker(),worker()]);
      if(finished) return null;
      PROBES.forEach(function(spec,i){
        if(!results[i]) {
          results[i]=classify(spec,'request timeout',null,'',0);
          results[i].title='未运行 · 前序请求未结束';
          results[i].detail='为避免堆积连接，HTTP 接口失去回调后不再启动后续请求。请先检查 Loon 运行状态。';
        }
      });
      var stale=current()!==startCurrent || mode()!==startMode;
      var warnings=['出口与 AI 检查沿用当前路由；脚本无法直接证明每一跳或读取实际命中规则。','本轮不带账号、Cookie 或 API 密钥；没有调用对话生成接口。'];
      if(callbackMissing) warnings.unshift('部分 HTTP 接口未按时返回回调，已停止后续探测，避免继续堆积连接。');
      if(startMode!==1) warnings.unshift('当前不是分流模式，结果不能用于验证预期的 Mars 分流。');
      if(stale) warnings.unshift('检查过程中入口或运行模式改变，本轮结果已过期。');
      if(results[0].ip && results[1].ip && results[0].ip===results[1].ip) warnings.push('入口与当前分流出口 IP 相同：请核对 Mars 出口和请求记录；相同 IP 本身不能证明代理链被绕过。');
      return {ok:true,startedAt:startedAt,finishedAt:new Date(now()).toISOString(),current:startCurrent,mode:startMode,stale:stale,summary:summarize(results,startMode,stale),results:results,warnings:warnings};
    }
    async function select(body) {
      var previous=sameSelection(body.expectedCurrent);
      if(typeof body.node!=='string' || body.node.length>512) throw fault('BAD_NODE','请选择有效的入口节点。');
      acquire();
      var list=await candidates();
      if(list.indexOf(body.node)<0) throw fault('NODE_NOT_ALLOWED','目标不在“香港手动策略”的当前候选中；请刷新节点列表。',400);
      sameSelection(previous);
      if(body.node!==previous) {
        if(!api.config || typeof api.config.setSelectPolicy!=='function') throw fault('API_UNAVAILABLE','当前 Loon 不提供节点切换接口。',503);
        if(api.config.setSelectPolicy(ENTRY,body.node)!==true) throw fault('SELECT_REJECTED','Loon 未接受切换；请检查候选节点是否仍存在。',409);
        if(current()!==body.node) throw fault('SELECT_UNCONFIRMED','已发出切换，但尚未读回目标节点；请刷新状态确认，勿连续重复切换。',409);
      }
      return {ok:true,previous:previous,current:current(),changed:body.node!==previous,warning:'切换会影响所有复用“香港手动策略”的流量。原配置不会主动断开旧连接；请重新检查，必要时重开 AI App。Mars-ISP 末端保持原配置。'};
    }
    async function dispatch(request) {
      if(!request) {
        var c=current();
        if(!c) throw fault('GROUP_MISSING','未找到香港手动策略，请检查主配置。',409);
        var result=await check(c);
        if(!result) return null;
        var lines=[result.summary.headline,result.summary.detail,'入口：'+result.current,'模式：'+modeLabel(result.mode),''];
        result.results.forEach(function(r){lines.push(r.label+'：'+r.title+' · '+(r.httpStatus===null?'无 HTTP 响应':'HTTP '+r.httpStatus)+' · '+r.latencyMs+' ms'+(r.ip?' · '+r.ip:''));});
        lines.push('','打开面板切换节点：'+ORIGIN+'/','时间：'+result.finishedAt,'检查按当前路由运行，不是逐跳证明。');
        return {title:'Mars AI 链路快检',content:lines.join('\n')};
      }
      var match=/^http:\/\/mars\.loon\.test(?::80)?(\/[^?#]*)?(?:\?[^#]*)?$/i.exec(String(request.url || ''));
      if(!match) return jsonResponse(404,{ok:false,error:{code:'NOT_FOUND',message:'非面板地址。'}});
      var path=match[1] || '/';
      var method=String(request.method || 'GET').toUpperCase();
      request={url:request.url,method:method,headers:request.headers || {},body:request.body};
      if(path==='/' && method==='GET') {
        var t=token();
        return {response:{status:200,headers:headers('text/html',t),body:panelHTML.split('__MARS_CSRF_TOKEN__').join(t)}};
      }
      if(path==='/favicon.ico' && method==='GET') return {response:{status:204,headers:headers('text/plain'),body:''}};
      if(['/api/state','/api/check','/api/select'].indexOf(path)<0) throw fault('NOT_FOUND','没有这个接口。',404);
      if((path==='/api/state' && method!=='GET') || (path!=='/api/state' && method!=='POST')) throw fault('METHOD_NOT_ALLOWED','请求方法不支持。',405);
      verifyRequest(request);
      if(path==='/api/state') return jsonResponse(200,await state());
      if(path==='/api/check') {
        var body=bodyJSON(request,['expectedCurrent']);
        var checked=await check(body.expectedCurrent);
        return checked ? jsonResponse(200,checked) : null;
      }
      return jsonResponse(200,await select(bodyJSON(request,['node','expectedCurrent'])));
    }
    async function run(request) {
      api.schedule(function(){
        if(finished) return;
        var e={ok:false,error:{code:'RUN_TIMEOUT',message:'本轮运行超过 30 秒，已结束。请检查 Loon 日志和网络后再试。'}};
        complete(request?jsonResponse(504,e):{title:'Mars AI 快检未完成',content:e.error.message});
      },30000);
      try {var payload=await dispatch(request); if(payload) complete(payload);}
      catch(e) {
        if(!e || (typeof e!=='object' && typeof e!=='function')) e={};
        var error={code:e.code || 'INTERNAL_ERROR',message:e.code?e.message:'脚本未完成，请检查 Loon 版本、主配置和脚本日志。'};
        complete(request?jsonResponse(e.status || 500,{ok:false,error:error}):{title:'Mars AI 快检未完成',content:error.message});
      }
    }
    return {run:run};
  }

  if(typeof module!=='undefined' && module.exports) {
    module.exports={createRuntime:createRuntime,classify:classify,summarize:summarize,normalizeCandidates:normalizeCandidates,probes:PROBES,version:VERSION};
    return;
  }
  var api={
    config:typeof $config==='undefined'?null:$config,
    store:typeof $persistentStore==='undefined'?null:$persistentStore,
    http:typeof $httpClient==='undefined'?null:$httpClient,
    utils:typeof $utils==='undefined'?null:$utils,
    schedule:function(fn,ms){setTimeout(fn,ms);},
    done:function(payload){$done(payload);}
  };
  createRuntime(api,PANEL_HTML).run(typeof $request==='undefined'?null:$request);
})();
