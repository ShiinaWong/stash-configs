/*
 * Shiina Loon supplement v0.4.0 — Caiyun / Baidu Netdisk.
 * Endpoint and field references: ddgksf2013 CaiYunAds.conf, caiyun_json.js
 * V1.0.8 and https://ddgksf2013.top/scripts/bdpan.ads.js V1.0.5.
 * This implementation only cleans the selected promotional UI responses.
 * It keeps response metadata, unknown shapes, account data and file APIs.
 * No network requests, persistent storage, body logging or account spoofing.
 */
(function () {
  "use strict";
  var result = {};
  try {
    if (typeof $request === "undefined" || typeof $response === "undefined") {
      $done(result);
      return;
    }
    var address = /^https?:\/\/([^/?#]+)(\/[^?#]*)/.exec($request.url || "");
    var raw = $response.body;
    if (!address || Number($response.status) !== 200 || typeof raw !== "string") {
      $done(result);
      return;
    }
    var host = address[1].toLowerCase();
    var path = address[2].replace(/\/$/, "");
    var caiyun = host === "starplucker.cyapi.cn" &&
      /^\/v\d+\/(?:operation\/(?:homefeatures|banners|features|feeds)|notification\/message_center|config\/cypage|campaigns)$/.test(path);
    var netdisk = host === "pan.baidu.com" &&
      /^\/(?:api\/getsyscfg|feed\/cardinfos|api\/taskscore\/tasklist)$/.test(path);
    if (!caiyun && !netdisk) {
      $done(result);
      return;
    }
    var data = JSON.parse(raw);
    function object(value) {
      return value !== null && typeof value === "object" && !Array.isArray(value);
    }
    if (!object(data)) {
      $done(result);
      return;
    }
    // A successful HTTP response can still carry a business/login error.
    var errors = ["errno", "error_code", "code"].some(function (key) {
      return Object.prototype.hasOwnProperty.call(data, key) &&
        [0, "0", 200, "200"].indexOf(data[key]) === -1;
    });
    if (errors || (caiyun && Object.prototype.hasOwnProperty.call(data, "status") &&
        ["ok", "success", 0, 200].indexOf(data.status) === -1)) {
      $done(result);
      return;
    }
    var changed = false;
    function clear(parent, key) {
      if (object(parent) && Array.isArray(parent[key]) && parent[key].length) {
        parent[key] = [];
        changed = true;
      }
    }
    function filter(parent, key, keep) {
      if (!object(parent) || !Array.isArray(parent[key])) return;
      var next = parent[key].filter(keep);
      if (next.length !== parent[key].length) {
        parent[key] = next;
        changed = true;
      }
    }
    function nativeOrUnknown(item) {
      return !object(item) || typeof item.url !== "string" || item.url.indexOf("cy://") === 0;
    }
    if (caiyun) {
      if (/\/operation\/(homefeatures|banners)$/.test(path)) {
        clear(data, "data");
      } else if (/\/notification\/message_center$/.test(path)) {
        clear(data, "messages");
      } else if (/\/config\/cypage$/.test(path)) {
        clear(data, "popups");
        clear(data, "actions");
      } else if (/\/operation\/features$/.test(path)) {
        filter(data, "data", nativeOrUnknown);
      } else if (/\/operation\/feeds$/.test(path)) {
        filter(data, "data", function (item) {
          return !object(item) || typeof item.category_times_text !== "string" ||
            item.category_times_text.indexOf("人查看") !== -1;
        });
      } else if (/\/campaigns$/.test(path)) {
        filter(data, "campaigns", nativeOrUnknown);
      }
    } else if (path === "/api/getsyscfg") {
      Object.keys(data).forEach(function (key) {
        // Anchor the category name: "download_area" must not match "ad_".
        if (/^(ad_|advertise_|splash_)/.test(key)) clear(data[key], "cfg_list");
      });
    } else if (path === "/feed/cardinfos") {
      var cards = object(data.data) ? data.data.cards : null;
      // Only compact a recognizable file/home feed, not a wholly new schema.
      if (Array.isArray(cards) && cards.some(function (card) {
        return object(card) && (card.source === "product" || card.source === "recent");
      })) {
        filter(data.data, "cards", function (card) {
          return !object(card) || typeof card.source !== "string" ||
            card.source === "product" || card.source === "recent";
        });
      }
    } else if (path === "/api/taskscore/tasklist") {
      clear(data.result, "list");
    }
    if (changed) result = {body: JSON.stringify(data)};
  } catch (_) {
    // Invalid JSON / an unexpected shape passes through unchanged.
    result = {};
  }
  $done(result);
})();
