const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../scripts/ecommerce-splash-clean.js"), "utf8");

function run(url, payload) {
  let result;
  vm.runInNewContext(script, {
    $request: { url },
    $response: { body: JSON.stringify(payload) },
    $done(value) { if (result === undefined) result = value; },
    console,
  });
  return result?.body ? JSON.parse(result.body) : payload;
}

const taobaoImage = run(
  "https://guide-acs.m.taobao.com/gw/mtop.taobao.wireless.home.splash.awesome.get?v=1.0",
  {
    data: {
      containers: {
        splash_home_base: {
          base: {
            sections: [
              { bizData: { "taobao-splash": { data: [{ imgUrl: "ad.jpg" }] } } },
              { bizData: { navigation: { data: [{ title: "正常入口" }] } } },
            ],
          },
        },
      },
    },
  },
);
assert.deepEqual(taobaoImage.data.containers.splash_home_base.base.sections[0].bizData["taobao-splash"].data, []);
assert.equal(taobaoImage.data.containers.splash_home_base.base.sections[1].bizData.navigation.data[0].title, "正常入口");

const taobaoVideo = run(
  "https://guide-acs.m.taobao.com/gw/mtop.taobao.cloudvideo.video.query?v=1.0",
  { data: { duration: "5", resources: [{ url: "ad.mp4" }], caches: [{ id: 1 }], keep: true } },
);
assert.equal(taobaoVideo.data.duration, "0");
assert.deepEqual(taobaoVideo.data.resources, []);
assert.deepEqual(taobaoVideo.data.caches, []);
assert.equal(taobaoVideo.data.keep, true);

const jd = run(
  "https://api.m.jd.com/client.action?functionId=start&client=apple",
  { images: [{ url: "ad.jpg" }], showTimesDaily: 3, keep: { login: true } },
);
assert.deepEqual(jd.images, []);
assert.equal(jd.showTimesDaily, 0);
assert.equal(jd.keep.login, true);

console.log("ecommerce-splash-clean: all tests passed");
