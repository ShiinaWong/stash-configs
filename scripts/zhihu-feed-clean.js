/* Remove explicitly marked ads from Zhihu content feeds without hiding normal content. */

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

function hasValue(value) {
  if (value == null) return false;
  if (typeof value !== "object") return true;
  return Object.keys(value).length > 0;
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
  const candidates = [item, item.origin_data, item.target, item.data];
  if (candidates.some((candidate) => candidate && (
    isAdType(candidate.type) ||
    isAdType(candidate.card_type) ||
    isAdType(candidate.resource_type) ||
    candidate.is_ad === true ||
    candidate.is_advert === true ||
    hasValue(candidate.adjson) ||
    hasValue(candidate.promotion_extra) ||
    hasValue(candidate.ad_info)
  ))) return true;

  return hasAdLabel(item.common_card?.footline?.elements) ||
    hasAdLabel(item.common_card?.feed_content?.source_line?.elements) ||
    (typeof item.target?.metrics_area?.text === "string" &&
      /(?:广告|合作推广)/.test(item.target.metrics_area.text));
}

function cleanArrays(value) {
  let changed = false;

  if (Array.isArray(value)) {
    for (let index = value.length - 1; index >= 0; index -= 1) {
      if (isExplicitAd(value[index])) {
        value.splice(index, 1);
        changed = true;
      } else if (cleanArrays(value[index])) {
        changed = true;
      }
    }
  } else if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      if (cleanArrays(child)) changed = true;
    }
  }

  return changed;
}

function removeAdMetadata(value) {
  let changed = false;
  for (const container of [value, value?.data]) {
    if (container && typeof container === "object" && !Array.isArray(container) &&
      Object.prototype.hasOwnProperty.call(container, "ad_info")) {
      delete container.ad_info;
      changed = true;
    }
  }
  return changed;
}

try {
  const payload = JSON.parse($response.body);
  const metadataChanged = removeAdMetadata(payload);
  const arraysChanged = cleanArrays(payload);
  const changed = metadataChanged || arraysChanged;
  $done(changed ? { body: JSON.stringify(payload) } : {});
} catch (error) {
  console.log(`Zhihu Feed Clean: ${error}`);
  $done({});
}
