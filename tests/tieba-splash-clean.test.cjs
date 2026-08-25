const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../scripts/tieba-splash-clean.js"), "utf8");

function run(payload) {
  let result;
  vm.runInNewContext(script, {
    $response: { body: JSON.stringify(payload) },
    $done(value) { if (result === undefined) result = value; },
    console,
  });
  return result?.body ? JSON.parse(result.body) : payload;
}

const splash = run({ error_code: 0, data: { creative: "ad" }, keep: "ok" });
assert.equal(splash.error_code, 2230209);
assert.equal(splash.data, null);
assert.equal(splash.keep, "ok");

const serverError = run({ error_code: 1, data: { reason: "server" } });
assert.equal(serverError.error_code, 1);
assert.equal(serverError.data.reason, "server");

console.log("tieba-splash-clean: all tests passed");
