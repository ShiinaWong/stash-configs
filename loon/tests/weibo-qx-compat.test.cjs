"use strict";
const assert = require("node:assert/strict");
const {test, before} = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const plugin = fs.readFileSync(path.join(__dirname, "../shiina-adblock-supplement.plugin"), "utf8");
const upstreamURL = "https://raw.githubusercontent.com/ddgksf2013/Scripts/0cddbb6bc31344315afba773ebb4e7ce29f7fd8f/weibo_json.js";
const expectedBlob = "2e2fcb24a34b6b60ea9b23c1af049947660e0061";
let source;
before(async () => {
  let bytes;
  if (process.env.WEIBO_UPSTREAM_SCRIPT) {
    bytes = fs.readFileSync(process.env.WEIBO_UPSTREAM_SCRIPT);
  } else {
    const response = await fetch(upstreamURL, {signal: AbortSignal.timeout(15000)});
    assert.equal(response.status, 200, "Pinned author script must be available");
    bytes = Buffer.from(await response.arrayBuffer());
  }
  const sha = crypto.createHash("sha1").update("blob " + bytes.length + "\0").update(bytes).digest("hex");
  assert.equal(sha, expectedBlob, "Test the exact script used by the plugin");
  source = bytes.toString("utf8");
});
function entries(prefix) {
  return plugin.split("\n").filter(line => line.startsWith(prefix) && line.includes("weibo_intl")).map(line => {
    const start = line.indexOf("~= /") + 4;
    const end = line.indexOf("/ ", start);
    assert.ok(start >= 4 && end > start);
    return {line, regex: new RegExp(line.slice(start, end))};
  });
}
const scripts = entries("response if");
const rewrites = entries("request if");
function matches(url, {enabled = true, feed = true, status = 200} = {}) {
  return scripts.filter(entry => enabled && status === 200 &&
    (feed || !entry.line.includes("weibo_intl_feed")) && entry.regex.test(url));
}
function run(url, data) {
  const outputs = [], logs = [];
  vm.runInNewContext(source, {
    $request: {url},
    $response: {status: 200, body: typeof data === "string" ? data : JSON.stringify(data)},
    $done: value => outputs.push(value),
    console: {log: value => logs.push(String(value))}
  }, {timeout: 1000});
  assert.equal(outputs.length, 1);
  assert.deepEqual(logs, []);
  return outputs[0].body;
}
const preload = "https://bootpreload.uve.weibo.com/v1/ad/preload";
const coopen = "https://weibointl.api.weibo.cn/portal.php?a=get_coopen_ads";
const openApp = "https://weibointl.api.weibo.cn/portal.php?a=open_app";

test("all seven response entries use the same reviewed upstream script", () => {
  assert.equal(scripts.length, 7);
  assert.equal(rewrites.length, 3);
  for (const {line} of scripts) {
    assert.ok(line.includes('script("' + upstreamURL + '")'));
    assert.ok(line.includes("requires_body=true"));
    assert.ok(line.includes("enable=" + "$" + "{weibo_intl}"));
    assert.ok(line.includes("$" + "{response.status} == 200"));
  }
  assert.ok(!plugin.includes("weibo-intl-ad-clean.js"));
  assert.ok(!plugin.includes("new.vip.weibo.cn"));
  const hosts = plugin.match(/^hostname = (.+)$/m)[1].split(", ");
  assert.equal(hosts.filter(host => host.endsWith("weibo.cn") || host.endsWith("weibo.com")).length, 11);
  assert.ok(hosts.every(host => !host.includes("*")));
});
test("known splash, SDK, feed and card endpoints match exactly one script", () => {
  for (const url of [preload, coopen, openApp,
    "https://weibointl.api.weibo.cn/portal.php?lang=en&a=get_coopen_ads",
    "https://sdkapp.uve.weibo.com/interface/sdk/sdkad.php",
    "https://wbapp.uve.weibo.com/wbapplua/wbpullad.lua",
    "https://api.weibo.cn/2/statuses/friends_timeline",
    "https://api.weibo.cn/2/statuses/unread_friends_timeline",
    "https://mapi.weibo.com/2/statuses/friends/timeline",
    "https://api.weibo.cn/2/groups/timeline",
    "https://api.weibo.cn/2/cardlist",
    "https://api.weibo.cn/2/statuses/container_timeline",
    "https://api.weibo.cn/2/statuses/container_timeline_topic",
    "https://api.weibo.cn/2/statuses/video_mixtimeline"]) {
    assert.equal(matches(url).length, 1, url);
    assert.equal(rewrites.filter(entry => entry.regex.test(url)).length, 0, url);
  }
});
test("login, account, personal page, membership and neighboring paths are excluded", () => {
  for (const url of [
    "https://api.weibo.cn/2/account/login",
    "https://api.weibo.cn/2/profile/me",
    "https://api.weibo.cn/2/statuses/longtext_show_batch",
    "https://api.weibo.cn/2/!/client/light_skin",
    "https://weibointl.api.weibo.cn/portal.php?a=user_center",
    "https://weibointl.api.weibo.cn/portal.php?a=get_user_preference",
    "https://weibointl.api.weibo.cn/portal.php?a=trends",
    coopen + "_extra", preload + "/other",
    coopen.replace("weibo.cn", "weibo.cn.example.test"),
    "https://overseas.weico.cc/portal.php?a=get_coopen_ads"
  ]) {
    assert.equal(matches(url).length, 0, url);
    assert.equal(rewrites.filter(entry => entry.regex.test(url)).length, 0, url);
  }
});
test("main/feed switches and success-status guard", () => {
  assert.equal(matches(preload, {enabled:false}).length, 0);
  assert.equal(matches(preload, {status:500}).length, 0);
  assert.equal(matches(preload, {feed:false}).length, 1);
  assert.equal(matches(openApp, {feed:false}).length, 0);
  assert.equal(matches("https://api.weibo.cn/2/cardlist", {feed:false}).length, 0);
});
test("dedicated ad requests reject while normal APIs remain reachable", () => {
  for (const url of [
    "https://bootrealtime.uve.weibo.com/v1/ad/realtime",
    "https://api.weibo.cn/2/ad/preload",
    "https://api.weibo.cn/2/ad/weibointl?lang=en",
    "https://sdkapp.uve.weibo.com/interface/sdk/sdkconfig.php"
  ]) {
    assert.equal(rewrites.filter(entry => entry.regex.test(url)).length, 1);
    assert.equal(matches(url).length, 0);
  }
});
test("author behavior: preload retains IDs and sets display counts and duration to zero", () => {
  const out = JSON.parse(run(preload, {code:200, ads:[{
    adid:"synthetic-ad", start_time:1, end_time:2, daily_display_cnt:4,
    total_display_cnt:4, display_duration:5, creatives:[{res_url:"https://example.test/ad.jpg"}]
  }], background_interval:20}));
  assert.equal(out.ads.length, 1);
  assert.equal(out.ads[0].adid, "synthetic-ad");
  for (const field of ["daily_display_cnt","total_display_cnt","display_duration"]) {
    assert.equal(out.ads[0][field], 0);
  }
  assert.equal(out.ads[0].start_time, 2681574400);
  assert.equal(out.ads[0].end_time, 2681660799);
  assert.equal(out.last_ad_show_interval, 86400);
  assert.equal(out.background_interval, 20);
});
test("author behavior: replace the entire ad configuration, retain the response envelope", () => {
  const out = JSON.parse(run(coopen, {retcode:0, info:"ok", data:{
    display_ad:1, ad_type:"synthetic-provider", pic_ad:[{id:"ad"}], uve_ad_scene:"synthetic-scene"
  }}));
  assert.deepEqual(out, {retcode:0, info:"ok", data:{display_ad:1}});
});
test("author behavior: open_app removes detail banner fields, not guessed feed flags", () => {
  const out = JSON.parse(run(openApp, {retcode:0, data:{
    close_ad_setting:{active:1}, detail_banner_ad:[{id:"ad"}],
    uve_feed_ad:1, new_ad_status_timeline:1, vip_info:{is_vip:0}, normal:"retain"
  }}));
  assert.deepEqual(out.data, {detail_banner_ad:[], uve_feed_ad:1,
    new_ad_status_timeline:1, vip_info:{is_vip:0}, normal:"retain"});
});
test("both legacy SDK response formats are supported, including trailing OK", () => {
  const php = run("https://sdkapp.uve.weibo.com/interface/sdk/sdkad.php",
    JSON.stringify({ads:[{id:"synthetic",displaynum:3}], show_push_splash_ad:true})+"OK");
  assert.ok(php.endsWith("OK"));
  const phpJSON = JSON.parse(php.slice(0,-2));
  assert.equal(phpJSON.ads[0].displaynum,0);
  assert.equal(phpJSON.ads[0].allowdaydisplaynum,0);
  assert.equal(phpJSON.show_push_splash_ad,false);
  const lua = JSON.parse(run("https://wbapp.uve.weibo.com/wbapplua/wbpullad.lua",
    {cached_ad:{ads:[{id:"synthetic",show_count:3,duration:8}]}}));
  assert.equal(lua.cached_ad.ads[0].show_count,0);
  assert.equal(lua.cached_ad.ads[0].duration,0);
});
test("timeline filters structural ad markers while retaining ordinary post text", () => {
  const normal = {id:"normal",text:"讨论广告行业的普通微博"};
  const out = JSON.parse(run("https://api.weibo.cn/2/statuses/friends_timeline",
    {statuses:[normal,{id:"ad1",mblogtypename:"广告"},
      {id:"ad2",promotion:{type:"ad"}},{id:"ad3",page_info:{actionlog:{source:"ad"}}}],
      ad:{id:"banner"},advertises:[{id:"ad"}],since_id:"synthetic-cursor"}));
  assert.deepEqual(out.statuses,[normal]);
  assert.ok(!("ad" in out));
  assert.ok(!("advertises" in out));
  assert.equal(out.since_id,"synthetic-cursor");
});
test("card and container feeds use the author's ad filtering", () => {
  const normal = {id:"normal",text:"正常微博"};
  const cards = JSON.parse(run("https://api.weibo.cn/2/cardlist",
    {cards:[{card_type:9,mblog:normal},{card_type:9,mblog:{mblogtypename:"广告"}}]}));
  assert.deepEqual(cards.cards,[{card_type:9,mblog:normal}]);
  const feed = JSON.parse(run("https://api.weibo.cn/2/statuses/container_timeline",
    {items:[{category:"feed",data:normal},{category:"feed",data:{mblogtypename:"广告"}}]}));
  assert.deepEqual(feed.items,[{category:"feed",data:normal}]);
});
