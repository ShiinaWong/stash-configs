const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(
  path.join(__dirname, "../scripts/zhihu-feed-clean.js"),
  "utf8",
);

function run(body) {
  let result;
  vm.runInNewContext(script, {
    $response: { body },
    $done(value) { if (result === undefined) result = value; },
    console: { log() {} },
  });
  return result;
}

const payload = {
  data: [
    { id: "normal-card", type: "common_card", title: "正常回答" },
    { id: "type-ad", type: "feed_advert" },
    { id: "json-ad", adjson: "{}" },
    { id: "promotion", promotion_extra: { campaign: 1 } },
    {
      id: "label-ad",
      type: "common_card",
      common_card: { footline: { elements: [{ text: { panel_text: "广告" } }] } },
    },
  ],
  paging: { is_end: false },
};

const cleaned = JSON.parse(run(JSON.stringify(payload)).body);
assert.deepEqual(Array.from(cleaned.data, (item) => item.id), ["normal-card"]);
assert.equal(cleaned.paging.is_end, false);

assert.equal(run(JSON.stringify({ data: [{ type: "common_card" }] })).body, undefined);
assert.equal(run(JSON.stringify({ data: { unexpected: true } })).body, undefined);
assert.equal(run("not-json").body, undefined);

console.log("zhihu-feed-clean: all tests passed");
