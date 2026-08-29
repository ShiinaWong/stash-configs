/* Remove explicitly marked promotions from Xianyu feeds without changing trades or messages. */

const url = $request.url;

function isAd(value) {
  if (!value || typeof value !== "object") return false;
  const candidates = [
    value.bizType,
    value.modelType,
    value.model_type,
    value.cardType,
    value.card_type,
    value?.data?.bizType,
    value?.cardData?.bizType,
    value?.data?.item?.main?.clickParam?.args?.biz_type,
  ].filter((item) => typeof item === "string").map((item) => item.toLowerCase());

  return value.isAd === true ||
    value.is_ad === true ||
    value.isAliMaMaAD === true ||
    value.isAliMaMaAD === "true" ||
    value?.data?.item?.main?.exContent?.isAliMaMaAD === true ||
    value?.data?.item?.main?.exContent?.isAliMaMaAD === "true" ||
    candidates.some((item) => item === "ad" || item === "mamaad" || item.includes("advert"));
}

function filterArray(container, key) {
  if (!Array.isArray(container?.[key])) return false;
  const before = container[key].length;
  container[key] = container[key].filter((item) => !isAd(item));
  return container[key].length !== before;
}

try {
  const payload = JSON.parse($response.body);
  const data = payload?.data;
  let changed = false;

  if (url.includes("idlehome.home.nextfresh")) {
    if (data && Object.prototype.hasOwnProperty.call(data, "bannerReturnDO")) {
      delete data.bannerReturnDO;
      changed = true;
    }
    changed = filterArray(data, "sections") || changed;
  } else if (url.includes("idle.local.home")) {
    changed = filterArray(data, "sections") || changed;
  } else if (url.includes("idlemtopsearch.search")) {
    changed = filterArray(data, "resultList") || changed;
  } else if (url.includes("idle.item.recommend")) {
    changed = filterArray(data, "cardList") || changed;
  }

  $done(changed ? { body: JSON.stringify(payload) } : {});
} catch (error) {
  console.log(`Xianyu Feed Clean: ${error}`);
  $done({});
}
