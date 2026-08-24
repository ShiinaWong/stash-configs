const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../scripts/essentials-health-tile.js"), "utf8");

function run(statuses = {}) {
  const requests = [];

  return new Promise((resolve, reject) => {
    const context = {
      $httpClient: {
        get(options, callback) {
          requests.push(options);
          const status = statuses[options.url] ?? 206;
          callback(null, { statusCode: status }, "");
        },
      },
      $done(result) {
        resolve({ result, requests });
      },
      console,
      Promise,
      Number,
    };

    try {
      vm.runInNewContext(script, context);
    } catch (error) {
      reject(error);
    }
  });
}

(async () => {
  const healthy = await run();
  assert.equal(healthy.requests.length, 5);
  assert.ok(healthy.requests.every((request) => request.headers.Range === "bytes=0-0"));
  assert.ok(healthy.requests.every((request) => request["auto-redirect"] === true));
  assert.match(healthy.result.title, /v0\.3\.0/);
  assert.match(healthy.result.content, /全部依赖正常/);

  const failingUrl = healthy.requests[3].url;
  const unhealthy = await run({ [failingUrl]: 503 });
  assert.match(unhealthy.result.content, /❌ 轻量广告规则镜像 \(503\)/);
  assert.match(unhealthy.result.content, /异常 1 项/);

  console.log("essentials-health-tile: all tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
