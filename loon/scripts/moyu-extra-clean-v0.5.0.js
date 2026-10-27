/*
 * Shiina Loon supplement v0.5.0.
 * Endpoint/field references: ddgksf2013 GoofishAds V1.0.11,
 * NeteaseMailAds V1.0.2, QiShuiMusicAds V1.0.6,
 * TaoPiaoPiaoAds V1.0.5 and iDailyAds V1.0.1.
 * Source revisions and intentional exclusions: docs/moyu-third-batch.md.
 * Independent implementation: only the selected promotional UI fields change.
 * No requests, storage, body logging, account or entitlement changes.
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
    var mtop = /^\/gw\/(mtop\.[a-z0-9.]+?)(?:\/\d+(?:\.\d+)*)?$/.exec(path);
    var api = mtop ? mtop[1] : "";
    var fishExtra = [
      "mtop.taobao.idle.user.strategy.list",
      "mtop.taobao.idlemtopsearch.search.shade",
      "mtop.taobao.idlemtopsearch.item.search.activate",
      "mtop.taobao.idlemtopsearch.search.discover"
    ];
    var filmExtra = [
      "mtop.film.independentadvertiseapi.querypreloadadvertise",
      "mtop.film.mtopindependentadvertiseapi.queryadvertise",
      "mtop.film.mtopitemadvertiseapi.queryadvertise",
      "mtop.film.life.aristotle.get",
      "mtop.film.life.popup.get"
    ];
    var fish = (host === "g-acs.m.goofish.com" && fishExtra.indexOf(api) !== -1) ||
      ((host === "acs.m.goofish.com" || host === "g-acs.m.goofish.com") &&
        api === "mtop.taobao.idle.item.recommend");
    var mail = host === "appconf.mail.163.com" &&
      /^\/mailmaster\/api\/page\/[^?#]*conf\.do$/.test(path);
    var music = (host === "beta-luna.douyin.com" || host === "api.qishui.com") &&
      ["/luna/me", "/luna/search-block", "/luna/activities"].indexOf(path) !== -1;
    var film = host === "acs.m.taobao.com" && filmExtra.indexOf(api) !== -1;
    var daily = host === "app-cdn.2q10.com" && /^\/app\/\w+\/honored$/.test(path);
    if (!fish && !mail && !music && !film && !daily) {
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
    // A HTTP 200 can still contain a login, rate-limit or business error.
    var error = !object(body) || ["errno", "error_code", "code", "status_code"].some(function (key) {
      return own(body, key) && [0, "0", 200, "200"].indexOf(body[key]) === -1;
    });
    if (!error && own(body, "success") && body.success !== true && body.success !== "true") error = true;
    if (!error && own(body, "ret")) {
      error = !Array.isArray(body.ret) || !body.ret.length || body.ret.some(function (item) {
        return typeof item !== "string" || !/^SUCCESS(?:::|$)/.test(item);
      });
    }
    if (error) {
      $done(output);
      return;
    }
    var changed = false;
    function remove(parent, keys) {
      keys.forEach(function (key) {
        if (own(parent, key)) {
          delete parent[key];
          changed = true;
        }
      });
    }
    function clearArray(parent, key) {
      if (object(parent) && Array.isArray(parent[key]) && parent[key].length) {
        parent[key] = [];
        changed = true;
      }
    }
    // Keep the author's empty-object placeholder for these MTOP UI lists.
    function placeholder(parent, key) {
      if (!object(parent) || !Array.isArray(parent[key])) return;
      var items = parent[key];
      if (items.length === 1 && object(items[0]) && !Object.keys(items[0]).length) return;
      parent[key] = [{}];
      changed = true;
    }
    function filter(parent, key, keep) {
      if (!object(parent) || !Array.isArray(parent[key])) return;
      var next = parent[key].filter(keep);
      if (next.length !== parent[key].length) {
        parent[key] = next;
        changed = true;
      }
    }
    if (fish) {
      if (api === "mtop.taobao.idle.item.recommend") {
        filter(body.data, "cardList", function (card) {
          return !object(card) || !object(card.cardData) || card.cardData.bizType !== "mamaAD";
        });
      } else if (api === "mtop.taobao.idle.user.strategy.list") {
        placeholder(body.data, "strategies");
      } else if (api === "mtop.taobao.idlemtopsearch.search.shade") {
        placeholder(body.data, "singleShadeWords");
      } else if (api === "mtop.taobao.idlemtopsearch.item.search.activate") {
        placeholder(body.data, "cardList");
      } else if (api === "mtop.taobao.idlemtopsearch.search.discover") {
        remove(body.data, ["resultList"]);
      }
    } else if (mail) {
      remove(body.data, ["masterOperatorList", "functionOperatorInfoList", "memberOperator", "activityTabInfoList"]);
    } else if (music) {
      var field = {"/luna/me":"reward_ad_banner", "/luna/search-block":"search_chart_block", "/luna/activities":"activity_map"}[path];
      remove(body, [field]);
    } else if (film) {
      if (api === "mtop.film.life.aristotle.get") {
        if (object(body.data) && Array.isArray(body.data.nodes)) {
          body.data.nodes.forEach(function (group) {
            filter(group, "nodes", function (node) {
              return !object(node) || !object(node.data) || node.data.componentId !== "tpp_banner_loop";
            });
          });
        }
      } else if (api === "mtop.film.life.popup.get") {
        if (object(body.data) && Object.keys(body.data).length) {
          body.data = {};
          changed = true;
        }
      } else if (api === "mtop.film.mtopitemadvertiseapi.queryadvertise") {
        remove(body.data, ["returnValue"]);
      } else {
        clearArray(body.data, "returnValue");
      }
    } else if (daily) {
      remove(body, ["apps", "grids", "banner_popups", "badge", "banner"]);
    }
    if (changed) output = {body: JSON.stringify(body)};
  } catch (_) {
    // Invalid JSON, JSONP and unexpected formats retain the original response.
    output = {};
  }
  $done(output);
})();
