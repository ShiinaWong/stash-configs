const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function run(scriptName, url, payload) {
  const script = fs.readFileSync(path.join(__dirname, `../scripts/${scriptName}`), "utf8");
  let result;
  vm.runInNewContext(script, {
    $request: { url },
    $response: { body: JSON.stringify(payload) },
    $done(value) { if (result === undefined) result = value; },
    console: { log() {} },
  });
  return result?.body ? JSON.parse(result.body) : payload;
}

const xianyu = run(
  "xianyu-feed-clean.js",
  "https://acs.m.goofish.com/gw/mtop.taobao.idlehome.home.nextfresh/1.0",
  {
    data: {
      bannerReturnDO: { image: "promotion.jpg" },
      sections: [
        { id: "normal", data: { bizType: "item" } },
        { id: "ad", data: { bizType: "AD" } },
      ],
      account: { loggedIn: true },
    },
  },
);
assert.equal("bannerReturnDO" in xianyu.data, false);
assert.deepEqual(Array.from(xianyu.data.sections, (item) => item.id), ["normal"]);
assert.equal(xianyu.data.account.loggedIn, true);

const xhsSplash = run(
  "xiaohongshu-ad-clean.js",
  "https://edith.xiaohongshu.com/api/sns/v1/system_service/splash_config",
  { data: { ads_groups: [{ id: "ad" }], normal_config: { enabled: true } } },
);
assert.deepEqual(Array.from(xhsSplash.data.ads_groups), []);
assert.equal(xhsSplash.data.normal_config.enabled, true);

const xhsFeed = run(
  "xiaohongshu-ad-clean.js",
  "https://edith.xiaohongshu.com/api/sns/v6/homefeed",
  {
    data: [
      { id: "normal", model_type: "note", note_attributes: ["goods"] },
      { id: "ad", model_type: "note", ads_info: { campaign: 1 } },
      { id: "typed-ad", model_type: "feed_advert" },
    ],
  },
);
assert.deepEqual(Array.from(xhsFeed.data, (item) => item.id), ["normal"]);
assert.deepEqual(Array.from(xhsFeed.data[0].note_attributes), ["goods"]);

const smzdm = run(
  "smzdm-ad-clean.js",
  "https://homepage-api.smzdm.com/v3/home",
  {
    data: {
      component: [
        { zz_type: "top_banner", zz_content: [] },
        {
          zz_type: "banner",
          zz_content: [{ id: "normal", tag: "专题" }, { id: "ad", tag: "广告" }],
        },
        { zz_type: "article", zz_content: [{ id: "article" }] },
      ],
    },
    user: { id: 123 },
  },
);
assert.deepEqual(Array.from(smzdm.data.component, (item) => item.zz_type), ["banner", "article"]);
assert.deepEqual(Array.from(smzdm.data.component[0].zz_content, (item) => item.id), ["normal"]);
assert.equal(smzdm.user.id, 123);

console.log("app-feed-clean: all tests passed");
