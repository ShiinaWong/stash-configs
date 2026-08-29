/* Pure ad cleanup for Xiaohongshu; deliberately excludes watermark and download changes. */

const url = $request.url;

function normalized(value) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function isAd(value) {
  if (!value || typeof value !== "object") return false;
  const types = [value.model_type, value.type, value.card_type, value.resource_type];

  return value.is_ad === true ||
    value.is_advert === true ||
    value.ads_info != null ||
    value.ad_info != null ||
    types.some((type) => {
      const text = normalized(type);
      return text === "ad" ||
        text === "advert" ||
        text.startsWith("ad_") ||
        text.endsWith("_ad") ||
        text.includes("_advert") ||
        text.includes("advertisement");
    });
}

function cleanArrays(value) {
  let changed = false;
  if (Array.isArray(value)) {
    for (let index = value.length - 1; index >= 0; index -= 1) {
      if (isAd(value[index])) {
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

try {
  const payload = JSON.parse($response.body);
  let changed = false;

  if (url.includes("/system_service/splash_config")) {
    if (Array.isArray(payload?.data?.ads_groups) && payload.data.ads_groups.length) {
      payload.data.ads_groups = [];
      changed = true;
    }
  } else if (url.includes("/system_service/config")) {
    for (const key of ["splash", "loading_img"]) {
      if (payload?.data && Object.prototype.hasOwnProperty.call(payload.data, key)) {
        delete payload.data[key];
        changed = true;
      }
    }
  } else {
    changed = cleanArrays(payload);
  }

  $done(changed ? { body: JSON.stringify(payload) } : {});
} catch (error) {
  console.log(`Xiaohongshu Ad Clean: ${error}`);
  $done({});
}
