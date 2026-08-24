/*
 * BiliBili UI Clean for Stash
 *
 * Cleans selected app UI responses without touching comments, danmaku,
 * playback URLs, account entitlements, or VIP status fields.
 * UI behavior is inspired by ddgksf2013's BiliBiliAdsLite configuration.
 */

const url = $request.url;
const originalBody = $response.body;

try {
  const payload = JSON.parse(originalBody);

  let handled = true;
  if (/\/x\/v2\/feed\/index(?:\?|$)/.test(url)) {
    cleanHomeFeed(payload);
  } else if (/\/x\/resource\/show\/tab/.test(url)) {
    cleanNavigation(payload);
  } else if (/\/x\/v2\/account\/mine/.test(url)) {
    cleanMinePage(payload);
  } else if (/\/x\/resource\/top\/activity/.test(url)) {
    cleanTopActivity(payload);
  } else {
    handled = false;
  }

  $done(handled ? { body: JSON.stringify(payload) } : {});
} catch (error) {
  console.log(`BiliBili UI Clean: ${error}`);
  $done({});
}

function cleanNavigation(payload) {
  if (!payload.data) return;

  const originalTabs = Array.isArray(payload.data.tab) ? payload.data.tab : [];
  const bangumiUri = JSON.stringify(originalTabs).includes("pgc/home")
    ? "bilibili://pgc/home"
    : "bilibili://following/home_activity_tab/6544";

  payload.data.tab = [
    { id: 39, name: "直播", uri: "bilibili://live/home", tab_id: "直播tab", pos: 1 },
    { id: 40, name: "推荐", uri: "bilibili://pegasus/promo", tab_id: "推荐tab", pos: 2, default_selected: 1 },
    { id: 545, name: "番剧", uri: bangumiUri, tab_id: "bangumi", pos: 3 },
    { id: 41, name: "热门", uri: "bilibili://pegasus/hottopic", tab_id: "hottopic", pos: 4 },
    { id: 151, name: "影视", uri: "bilibili://pgc/cinema-tab", tab_id: "film", pos: 5 },
  ];

  if (Array.isArray(payload.data.top)) {
    payload.data.top = [
      {
        id: 481,
        icon: "http://i0.hdslb.com/bfs/archive/d43047538e72c9ed8fd8e4e34415fbe3a4f632cb.png",
        name: "消息",
        uri: "bilibili://link/im_home",
        tab_id: "消息Top",
        pos: 1,
      },
    ];
  }

  if (Array.isArray(payload.data.bottom)) {
    const allowedBottomIds = new Set([102, 104, 106, 177, 178, 179, 181, 486, 488, 489]);
    payload.data.bottom = payload.data.bottom.filter((item) => allowedBottomIds.has(item.id));
  }
}

function cleanHomeFeed(payload) {
  if (!Array.isArray(payload.data?.items)) return;

  const normalVideoCardTypes = new Set([
    "small_cover_v2",
    "large_cover_v1",
    "large_cover_single_v9",
  ]);

  payload.data.items = payload.data.items.filter((item) => {
    if (Object.prototype.hasOwnProperty.call(item, "banner_item")) return false;
    if (Object.prototype.hasOwnProperty.call(item, "ad_info")) return false;
    if (Object.prototype.hasOwnProperty.call(item, "cm")) return false;
    if (item.is_ad === true || item.is_ad === 1) return false;
    if (typeof item.card_goto === "string" && item.card_goto.includes("ad")) return false;
    if (typeof item.goto === "string" && item.goto.includes("ad")) return false;
    if (typeof item.args?.goto === "string" && item.args.goto.includes("ad")) return false;
    return normalVideoCardTypes.has(item.card_type);
  });
}

function cleanMinePage(payload) {
  if (!payload.data) return;

  const allowedItemIds = new Set([
    396, 397, 398, 399, 402, 404, 407, 410, 425, 426, 427, 428, 430, 432,
    433, 434, 494, 495, 496, 497, 500, 501, 2830, 3072, 3084,
  ]);

  if (Array.isArray(payload.data.sections_v2)) {
    payload.data.sections_v2 = payload.data.sections_v2
      .map((section) => {
        if (Array.isArray(section.items)) {
          section.items = section.items.filter((item) => allowedItemIds.has(item.id));
        }
        section.button = {};
        delete section.be_up_title;
        delete section.tip_icon;
        delete section.tip_title;
        if (section.title === "创作中心" || section.title === "創作中心") {
          delete section.title;
          delete section.type;
        }
        return section;
      })
      .filter((section) => !Array.isArray(section.items) || section.items.length > 0);
  }

  delete payload.data.vip_section_v2;
  delete payload.data.vip_section;
  if ("live_tip" in payload.data) payload.data.live_tip = {};
  if ("answer" in payload.data) payload.data.answer = {};

  // Deliberately preserve payload.data.vip and every account entitlement field.
}

function cleanTopActivity(payload) {
  if (payload.data?.online) payload.data.online.icon = "";
}
