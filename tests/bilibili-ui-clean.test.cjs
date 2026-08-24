const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const script = fs.readFileSync(require("node:path").join(__dirname, "../scripts/bilibili-ui-clean.js"), "utf8");

function run(url, body) {
  let result;
  const context = {
    $request: { url },
    $response: { body: JSON.stringify(body) },
    $done(value) {
      if (result === undefined) result = value;
    },
    console,
    Set,
  };
  vm.runInNewContext(script, context);
  return result?.body ? JSON.parse(result.body) : body;
}

const nav = run("https://app.bilibili.com/x/resource/show/tab", {
  data: {
    tab: [{ uri: "bilibili://pgc/home" }, { id: 999 }],
    top: [{ id: 1 }, { id: 2 }],
    bottom: [{ id: 102 }, { id: 999 }, { id: 489 }],
  },
});
assert.deepEqual(Array.from(nav.data.tab, (item) => item.name), ["直播", "推荐", "番剧", "热门", "影视"]);
assert.equal(nav.data.tab[2].uri, "bilibili://pgc/home");
assert.deepEqual(Array.from(nav.data.top, (item) => item.id), [481]);
assert.deepEqual(Array.from(nav.data.bottom, (item) => item.id), [102, 489]);

const mine = run("https://app.bilibili.com/x/v2/account/mine", {
  data: {
    vip: { status: 0, type: 0, due_date: 0 },
    vip_section_v2: { title: "大会员" },
    live_tip: { text: "promo" },
    answer: { text: "promo" },
    sections_v2: [
      { title: "创作中心", type: 9, tip_title: "promo", items: [{ id: 396 }, { id: 999 }] },
      { title: "广告区", items: [{ id: 999 }] },
    ],
  },
});
assert.equal(mine.data.vip.status, 1);
assert.equal(mine.data.vip.type, 2);
assert.equal(mine.data.vip.due_date, 4669824160000);
assert.equal("vip_section_v2" in mine.data, false);
assert.deepEqual(mine.data.live_tip, {});
assert.equal(mine.data.sections_v2.length, 1);
assert.deepEqual(Array.from(mine.data.sections_v2[0].items, (item) => item.id), [396]);
assert.equal("title" in mine.data.sections_v2[0], false);

const myinfo = run("https://app.bilibili.com/x/v2/account/myinfo?access_key=test", {
  data: { vip: { status: 0, type: 0, due_date: 0 }, name: "tester" },
});
assert.equal(myinfo.data.vip.status, 1);
assert.equal(myinfo.data.vip.type, 2);
assert.equal(myinfo.data.vip.vip_pay_type, 1);
assert.equal(myinfo.data.vip.due_date, 4669824160000);
assert.equal(myinfo.data.name, "tester");

const activity = run("https://app.bilibili.com/x/resource/top/activity", {
  data: { online: { icon: "https://example.com/ad.png" }, hash: "original" },
});
assert.equal(activity.data.online.icon, "");
assert.equal(activity.data.hash, "original");

const feed = run("https://app.bilibili.com/x/v2/feed/index?device=phone", {
  data: {
    items: [
      { id: "normal-small", card_type: "small_cover_v2", card_goto: "av" },
      { id: "normal-large", card_type: "large_cover_v1", card_goto: "av" },
      { id: "banner", card_type: "banner_v8", card_goto: "banner", banner_item: [] },
      { id: "ad-info", card_type: "small_cover_v2", card_goto: "av", ad_info: {} },
      { id: "promotion", card_type: "cm_v2", card_goto: "ad_av" },
      { id: "disguised-promotion", card_type: "small_cover_v2", card_goto: "av", goto: "ad_av" },
      { id: "cm-field", card_type: "small_cover_v2", card_goto: "av", cm: {} },
      { id: "is-ad", card_type: "small_cover_v2", card_goto: "av", is_ad: 1 },
      { id: "mini-program", card_type: "small_cover_v10", card_goto: "game" },
    ],
  },
});
assert.deepEqual(Array.from(feed.data.items, (item) => item.id), ["normal-small", "normal-large"]);

console.log("bilibili-ui-clean: all tests passed");
