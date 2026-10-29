/*
 * Shiina Loon supplement v0.6.0 — Unicom / Moji Weather.
 * Field references: ddgksf2013 ChinaUnicomAds.conf V1.0.4 and
 * MoJiWeatherAds.conf V1.0.2. See docs/moyu-fourth-batch.md.
 * Independent, scoped implementation; no network, storage or body logging.
 */
(function () {
  "use strict";
  var output = {};
  try {
    if (typeof $request === "undefined" || typeof $response === "undefined" ||
        Number($response.status) !== 200 || typeof $response.body !== "string") {
      $done(output);
      return;
    }
    var address = /^https?:\/\/([^/?#]+)(\/[^?#]*)/.exec($request.url || "");
    if (!address) {
      $done(output);
      return;
    }
    var host = address[1].toLowerCase();
    var path = address[2].replace(/\/$/, "");
    var unicom = host === "m.client.10010.com" &&
      ["/search_service/search/searchScrollWord", "/clientIndex/homefusion/fuInter"].indexOf(path) !== -1;
    // These hosts are already rejected by the audited base milk plugin.
    var mojiHost = /^(?:[a-z0-9-]+\.)+api\.moji\.com$/.test(host) &&
      host.indexOf("me.api.moji.com") === -1 && host !== "ad.api.moji.com" &&
      host !== "fds.api.moji.com" && !/\.fds\.api\.moji\.com$/.test(host);
    var moji = mojiHost && path === "/json/entrance/list";
    if (!unicom && !moji) {
      $done(output);
      return;
    }
    var body = JSON.parse($response.body);
    function object(value) {
      return value !== null && typeof value === "object" && !Array.isArray(value);
    }
    function own(parent, key) {
      return object(parent) && Object.prototype.hasOwnProperty.call(parent, key);
    }
    function successCode(value) {
      if (value === 0 || value === 200) return true;
      // Permit zero-padded zero codes, but never coerce false/null/empty strings.
      return typeof value === "string" && (/^0+$/.test(value) || value === "200");
    }
    var error = !object(body) || ["code", "errno", "error_code", "status_code", "statusCode", "resultCode"].some(function (key) {
      return own(body, key) && !successCode(body[key]);
    });
    if (!error && own(body, "success") && body.success !== true && body.success !== "true") error = true;
    if (!error && own(body, "status") &&
        ["ok", "success", 0, "0", 200, "200"].indexOf(body.status) === -1) error = true;
    if (error) {
      $done(output);
      return;
    }
    var changed = false;
    function remove(parent, key) {
      if (own(parent, key)) {
        delete parent[key];
        changed = true;
      }
    }
    if (unicom && path === "/search_service/search/searchScrollWord") {
      if (Array.isArray(body["113000004"]) && body["113000004"].length) {
        body["113000004"] = [];
        changed = true;
      }
    } else if (unicom) {
      // Dots belong to the literal key names, not to nested JSON paths.
      remove(body, "HomeFusion.backGroundQuery");
      remove(body["HomeFusion.bottomLabel"], "bottomMallKey");
    } else if (Array.isArray(body.entrance_region_res_list)) {
      var next = body.entrance_region_res_list.filter(function (region) {
        return !object(region) || region.region_name !== "banner区";
      });
      if (next.length !== body.entrance_region_res_list.length) {
        body.entrance_region_res_list = next;
        changed = true;
      }
    }
    if (changed) output = {body: JSON.stringify(body)};
  } catch (_) {
    // Invalid JSON, JSONP and unexpected structures retain the original body.
    output = {};
  }
  $done(output);
})();
