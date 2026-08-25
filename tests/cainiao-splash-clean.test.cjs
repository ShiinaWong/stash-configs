const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../scripts/cainiao-splash-clean.js"), "utf8");

function runRequest(api) {
  let result;
  vm.runInNewContext(script, {
    $request: { url: `https://netflow-mtop.cainiao.com/gw/${api}?v=1.0` },
    $done(value) { if (result === undefined) result = value; },
    console,
    Set,
  });
  return result;
}

function runResponse(api, payload) {
  let result;
  vm.runInNewContext(script, {
    $request: { url: `https://cn-acs.m.cainiao.com/gw/${api}?v=1.0` },
    $response: { body: JSON.stringify(payload) },
    $done(value) { if (result === undefined) result = value; },
    console,
    Set,
  });
  return result?.body ? JSON.parse(result.body) : payload;
}

const show = runRequest("mtop.cainiao.guoguo.nbnetflow.ads.show");
assert.equal(show.response.status, 200);
assert.deepEqual(JSON.parse(show.response.body).data.result, {});
assert.deepEqual(JSON.parse(show.response.body).ret, ["SUCCESS::调用成功"]);

const batch = runRequest("mtop.cainiao.guoguo.nbnetflow.ads.batch.show.v2");
assert.deepEqual(JSON.parse(batch.response.body).data.result, []);

const cleaned = runResponse("mtop.cainiao.guoguo.nbnetflow.ads.mshow", {
  data: {
    result: {
      placements: [
        { id: "splash", floatview_url: "https://example.com/ad.png", link: "taobao://ad" },
        { id: "promo", mainpic: "ad.png", btnpic: "open.png" },
        { id: "parcel", packageId: "P1", status: "派送中", image: "box.png", link: "cainiao://parcel/P1" },
      ],
      services: [{ name: "寄快递", link: "cainiao://send" }],
    },
  },
});
assert.deepEqual(Array.from(cleaned.data.result.placements, (item) => item.id), ["parcel"]);
assert.equal(cleaned.data.result.services.length, 1);

const unrelated = runRequest("mtop.cainiao.package.list");
assert.equal(Object.keys(unrelated).length, 0);

console.log("cainiao-splash-clean: all tests passed");
