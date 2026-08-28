const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(
  path.join(__dirname, "../scripts/wechat-official-ads-clean.js"),
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

const original = {
  advertisement_num: 1,
  advertisement_info: [{ id: "ad-1" }],
  appid: "advertiser-app",
  keep: { article: true },
};
const cleaned = JSON.parse(run(JSON.stringify(original)).body);
assert.equal(cleaned.advertisement_num, 0);
assert.deepEqual(cleaned.advertisement_info, []);
assert.equal(cleaned.appid, undefined);
assert.deepEqual(cleaned.keep, { article: true });

assert.equal(run(JSON.stringify({ article: "normal" })).body, undefined);
assert.equal(run("not-json").body, undefined);

console.log("wechat-official-ads-clean: all tests passed");
