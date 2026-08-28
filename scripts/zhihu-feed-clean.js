/* Conservatively remove explicit ads from the Zhihu recommendation feed. */

function normalizedType(value) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function isAdType(value) {
  const type = normalizedType(value);
  return type === "ad" ||
    type === "advert" ||
    type === "feed_advert" ||
    type.startsWith("ad_") ||
    type.endsWith("_ad") ||
    type.includes("_advert");
}

function hasAdLabel(elements) {
  if (!Array.isArray(elements)) return false;
  return elements.some((element) => {
    const text = element?.text?.panel_text ?? element?.text?.text ?? element?.text;
    return typeof text === "string" && /(广告|合作推广)/.test(text);
  });
}

function isExplicitAd(item) {
  if (!item || typeof item !== "object") return false;
  if (
    isAdType(item.type) ||
    isAdType(item.card_type) ||
    isAdType(item.origin_data?.type) ||
    isAdType(item.origin_data?.resource_type)
  ) return true;

  if (item.adjson != null || item.promotion_extra != null || item.ad_info != null) {
    return true;
  }

  return hasAdLabel(item.common_card?.footline?.elements) ||
    hasAdLabel(item.common_card?.feed_content?.source_line?.elements);
}

try {
  const payload = JSON.parse($response.body);
  const feed = Array.isArray(payload?.data)
    ? payload.data
    : (Array.isArray(payload?.data?.data) ? payload.data.data : null);

  if (!feed) {
    $done({});
  } else {
    const cleaned = feed.filter((item) => !isExplicitAd(item));
    if (cleaned.length === feed.length) {
      $done({});
    } else {
      if (Array.isArray(payload.data)) payload.data = cleaned;
      else payload.data.data = cleaned;
      $done({ body: JSON.stringify(payload) });
    }
  }
} catch (error) {
  console.log(`Zhihu Feed Clean: ${error}`);
  $done({});
}
