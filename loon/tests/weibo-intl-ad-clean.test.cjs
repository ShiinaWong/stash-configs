"use strict";
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { cleanResponse, routeFor } = require("../scripts/weibo-intl-ad-clean.js");
const splash = "https://bootpreload.uve.weibo.com/v1/ad/preload";
const coopen = "https://weibointl.api.weibo.cn/portal.php?a=get_coopen_ads";
const openApp = "https://weibointl.api.weibo.cn/portal.php?a=open_app";
const run = (url, data, method = "GET") =>
  cleanResponse(url, JSON.stringify(data), method, 200);

test("splash: remove only ads and retain all timing/envelope fields", () => {
  const data = { code: 200, background_interval: 15, realtime_stop_conf: { api_timeout: 3 },
    ads: [{ creatives: [{ res_url: "https://ads.example.test/a.jpg" }] }] };
  const out = run(splash, data, "POST");
  assert.deepEqual(JSON.parse(out.body), { ...data, ads: [] });
  assert.equal(data.ads.length, 1);
  assert.equal(run(splash, { ...data, ads: [] }, "POST"), null);
});

test("ad config: preserve selectors, placement IDs, whitelist and unrelated settings", () => {
  const data = { retcode: 0, info: "ok", data: {
    display_ad: 1, ad_list: [{ slot: "test" }], pic_ad: [{ image: "test" }],
    gdt_video_ad_ios: [{ slot: "test" }], gdt_video_ad_android: { enabled: true },
    ad_type: "test-provider", ad_ios_id: 12345, scheme_white_list: ["testscheme"],
    ad_cd_interval: 1200, keep: { value: "normal" }
  } };
  const out = JSON.parse(run(coopen, data).body);
  assert.deepEqual(out, { ...data, data: { ...data.data,
    display_ad: 0, ad_list: [], pic_ad: [], gdt_video_ad_ios: [] } });
});

test("feed config: only five observed positive ad switches are changed", () => {
  const data = { retcode: 0, info: "ok", data: {
    uve_feed_ad: 1, uve_hot_ad: 1, new_ad_status_timeline: 1,
    new_ad_status_search: 1, new_ad_status_hot: 1,
    uve_feed_ad_block: 0, new_ad_uve_android: 1, vip_info: { is_vip: 0 },
    login_option: ["normal"], feed_reload_duration: 36000,
    statuses: [{ text: "normal post", is_ad: true }]
  } };
  const out = JSON.parse(run(openApp, data).body);
  assert.deepEqual(out, { ...data, data: { ...data.data,
    uve_feed_ad: 0, uve_hot_ad: 0, new_ad_status_timeline: 0,
    new_ad_status_search: 0, new_ad_status_hot: 0 } });
});

test("query order changes match, substring and duplicate action values do not", () => {
  assert.equal(routeFor(openApp + "&lang=en", "GET"), "feed-config");
  assert.equal(routeFor("https://weibointl.api.weibo.cn/portal.php?lang=en&a=open_app", "GET"), "feed-config");
  for (const suffix of ["_extra", "&a=user_center", "&a=open_app"]) {
    assert.equal(routeFor(openApp + suffix, "GET"), null);
  }
  assert.equal(routeFor("https://weibointl.api.weibo.cn/portal.php?x=a=open_app", "GET"), null);
});

test("login, user center, normal feed, other hosts/paths/methods are untouched", () => {
  const payload = { retcode: 0, data: { display_ad: 1, uve_feed_ad: 1 } };
  for (const url of [
    "https://weibointl.api.weibo.cn/portal.php?a=user_center",
    "https://weibointl.api.weibo.cn/portal.php?a=get_user_preference",
    "https://api.weibo.cn/2/account/login",
    "https://api.weibo.cn/2/statuses/friends_timeline",
    "https://api.weibo.cn/2/statuses/longtext_show_batch",
    openApp.replace("weibo.cn", "weibo.cn.example.test"),
    openApp.replace("portal.php", "portal.php/extra"),
    openApp.replace("https:", "http:")
  ]) assert.equal(run(url, payload), null);
  assert.equal(run(openApp, payload, "POST"), null);
  assert.equal(run(splash, { code: 200, ads: [{}] }), null);
});

test("malformed JSON, HTTP/application errors, missing fields and unexpected types pass through", () => {
  for (const body of ["", "<html>error</html>", "{broken", "null", "[]", new Uint8Array([1])]) {
    assert.equal(cleanResponse(openApp, body, "GET", 200), null);
  }
  for (const status of [0, 204, 401, 403, 500]) {
    assert.equal(cleanResponse(openApp, '{"retcode":0,"data":{"uve_feed_ad":1}}', "GET", status), null);
  }
  for (const payload of [
    { retcode: 1, data: { uve_feed_ad: 1 } },
    { data: { uve_feed_ad: 1 } }, { retcode: "0", data: { uve_feed_ad: 1 } },
    { retcode: 0, data: null }, { retcode: 0, data: [] },
    { retcode: 0, data: { uve_feed_ad: "1", uve_hot_ad: true, new_ad_status_hot: 2 } }
  ]) assert.equal(run(openApp, payload), null);
  assert.equal(run(splash, { code: 500, ads: [{}] }, "POST"), null);
  assert.equal(run(splash, { code: 200, ads: {} }, "POST"), null);
});

test("partial known structures change only existing expected fields; repeated runs are no-ops", () => {
  const payload = { retcode: 0, data: { uve_feed_ad: 1, uve_hot_ad: "1", other: 3 } };
  const first = run(openApp, payload);
  assert.deepEqual(JSON.parse(first.body), { retcode: 0, data: { uve_feed_ad: 0, uve_hot_ad: "1", other: 3 } });
  assert.equal(cleanResponse(openApp, first.body, "GET", 200), null);
  assert.equal(run(coopen, { retcode: 0, data: { display_ad: "1", pic_ad: {}, ad_list: null } }), null);
});

test("Loon adapter calls done once, returns body only, and logs no URL or payload", () => {
  const source = fs.readFileSync(path.join(__dirname, "../scripts/weibo-intl-ad-clean.js"), "utf8");
  const calls = [], logs = [];
  vm.runInNewContext(source, {
    $request: { url: openApp + "&auth=SYNTHETIC_SECRET", method: "GET" },
    $response: { status: 200, body: '{"retcode":0,"data":{"uve_feed_ad":1,"keep":"synthetic"}}' },
    console: { log: value => logs.push(value) },
    $done: value => calls.push(value)
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(Object.keys(calls[0]), ["body"]);
  assert.equal(JSON.parse(calls[0].body).data.keep, "synthetic");
  assert.equal(logs.join("").includes("SYNTHETIC_SECRET"), false);
  assert.equal(logs.join("").includes("https:"), false);
});

test("Loon adapter preserves response on malformed payload or absent runtime objects", () => {
  const source = fs.readFileSync(path.join(__dirname, "../scripts/weibo-intl-ad-clean.js"), "utf8");
  for (const context of [{}, {
    $request: { url: openApp, method: "GET" }, $response: { status: 200, body: "bad" }
  }]) {
    const calls = [];
    vm.runInNewContext(source, { ...context, $done: value => calls.push(value) });
    assert.equal(calls.length, 1);
    assert.equal(JSON.stringify(calls[0]), "{}");
  }
});

test("plugin URL guards match the intended endpoints and exclude adjacent business APIs", () => {
  const plugin = fs.readFileSync(path.join(__dirname, "../shiina-adblock-supplement.plugin"), "utf8");
  const lines = plugin.split("\n").filter(line => line.startsWith("response if "));
  assert.equal(lines.length, 3);
  const guards = lines.map(line => new RegExp(line.match(/~= \/(.*)\/ &&/)[1]));
  const positives = [splash, coopen, openApp];
  positives.forEach((url, index) => {
    assert.equal(guards.filter(re => re.test(url)).length, 1);
    assert.equal(guards[index].test(url), true);
  });
  assert.equal(guards[1].test("https://weibointl.api.weibo.cn/portal.php?lang=en&a=get_coopen_ads&theme=dark"), true);
  assert.equal(guards[2].test("https://weibointl.api.weibo.cn/portal.php?lang=en&a=open_app"), true);
  for (const url of [
    openApp + "_extra", coopen + "_extra",
    "https://weibointl.api.weibo.cn/portal.php?a=user_center",
    "https://api.weibo.cn/2/account/login",
    splash.replace("weibo.com", "weibo.com.example.test"),
    splash + "/extra"
  ]) assert.equal(guards.some(re => re.test(url)), false);
  assert.equal(lines.every(line => line.includes('enable=${weibo_intl}')), true);
  assert.equal(lines[2].includes('${weibo_intl_feed} == true'), true);
  assert.match(plugin, /^hostname = bootpreload\.uve\.weibo\.com, weibointl\.api\.weibo\.cn$/m);
});
