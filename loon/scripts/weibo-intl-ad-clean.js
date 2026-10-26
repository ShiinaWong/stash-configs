/*
 * Shiina Loon supplement v0.2.0 — Weibo International.
 * Only the three observed endpoints below are handled. No network requests,
 * storage, account changes, or request/response content logging.
 */
(function () {
  "use strict";

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function routeFor(url, method) {
    if (typeof url !== "string") return null;
    const match = url.match(/^https:\/\/([^/?#]+)(\/[^?#]*)(?:\?([^#]*))?$/);
    if (!match) return null;
    const host = match[1];
    const path = match[2];
    if (host === "bootpreload.uve.weibo.com" &&
        path === "/v1/ad/preload" && method === "POST") return "splash";
    if (host !== "weibointl.api.weibo.cn" || path !== "/portal.php" ||
        method !== "GET") return null;
    const actions = (match[3] || "").split("&").filter(function (part) {
      return part.indexOf("a=") === 0;
    });
    if (actions.length !== 1) return null;
    if (actions[0] === "a=get_coopen_ads") return "ad-config";
    if (actions[0] === "a=open_app") return "feed-config";
    return null;
  }

  function cleanResponse(url, body, method, status) {
    const route = routeFor(url, method);
    if (!route || status !== 200 || typeof body !== "string") return null;
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (_) {
      return null;
    }
    if (!isObject(payload)) return null;
    const changed = [];
    function clearArray(object, key) {
      if (Array.isArray(object[key]) && object[key].length > 0) {
        object[key] = [];
        changed.push(key);
      }
    }
    function disableFlag(object, key) {
      // Only the numeric 1 observed in the capture is rewritten.
      // Missing fields and unexpected types are preserved.
      if (object[key] === 1) {
        object[key] = 0;
        changed.push(key);
      }
    }
    if (route === "splash") {
      if (payload.code !== 200 || !Array.isArray(payload.ads)) return null;
      clearArray(payload, "ads");
    } else {
      if (payload.retcode !== 0 || !isObject(payload.data)) return null;
      const data = payload.data;
      if (route === "ad-config") {
        disableFlag(data, "display_ad");
        ["ad_list", "pic_ad", "gdt_video_ad_ios"].forEach(function (key) {
          clearArray(data, key);
        });
      } else {
        // These are ad-specific switches, not timeline post filters.
        // Client-side effectiveness still needs an on-device check.
        ["uve_feed_ad", "uve_hot_ad", "new_ad_status_timeline",
          "new_ad_status_search", "new_ad_status_hot"].forEach(function (key) {
          disableFlag(data, key);
        });
      }
    }
    if (changed.length === 0) return null;
    return { body: JSON.stringify(payload), route: route, changed: changed };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { cleanResponse: cleanResponse, routeFor: routeFor };
  }
  if (typeof $done === "function") {
    let result = null;
    try {
      if (typeof $request !== "undefined" && typeof $response !== "undefined") {
        result = cleanResponse($request.url, $response.body,
          $request.method, $response.status);
      }
    } catch (_) {
      result = null;
    }
    // No URL, query values, headers, tokens, or body is logged.
    if (result) {
      try {
        console.log("[Shiina Weibo Intl] " + result.route +
          ": changed " + result.changed.length + " fields");
      } catch (_) { /* Diagnostics must not interfere with the response. */ }
    }
    $done(result ? { body: result.body } : {});
  }
})();
