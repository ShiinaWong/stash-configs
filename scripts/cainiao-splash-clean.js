/*
 * Cainiao splash cleaner for Stash.
 *
 * The splash APIs receive a valid empty MTop response instead of a network
 * rejection, preventing Cainiao from falling back to a previously cached ad.
 * mshow responses are cleaned only when an object has explicit ad-presentation
 * fields; parcel, pickup and logistics arrays are left untouched.
 */

const url = $request.url;
const api = getApi(url);

try {
  if (typeof $response === "undefined") {
    if (/\.(?:show(?:\.login)?|batch\.show(?:\.v2)?)$/i.test(api)) {
      const body = JSON.stringify({
        api,
        data: { result: /batch\.show/i.test(api) ? [] : {} },
        ret: ["SUCCESS::调用成功"],
        v: getVersion(url),
      });
      $done({
        response: {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body,
        },
      });
    } else {
      $done({});
    }
  } else if (/\.mshow$/i.test(api)) {
    const payload = JSON.parse($response.body);
    cleanPresentation(payload?.data?.result);
    $done({ body: JSON.stringify(payload) });
  } else {
    $done({});
  }
} catch (error) {
  console.log(`Cainiao Splash Clean: ${error}`);
  $done({});
}

function getApi(value) {
  const match = value.match(/\/gw\/(mtop\.cainiao\.guoguo\.nbnetflow\.ads\.(?:show(?:\.login)?|batch\.show(?:\.v2)?|mshow))/i);
  return match ? match[1] : "";
}

function getVersion(value) {
  const match = value.match(/[?&]v=([^&]+)/i);
  return match ? decodeURIComponent(match[1]) : "1.0";
}

function cleanPresentation(node) {
  if (!node || typeof node !== "object") return;

  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) {
      node[key] = value.filter((item) => !isPromotion(item));
      for (const item of node[key]) cleanPresentation(item);
    } else if (value && typeof value === "object") {
      cleanPresentation(value);
    }
  }
}

function isPromotion(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return false;
  const keys = new Set(Object.keys(item).map((key) => key.toLowerCase()));
  if ([...keys].some((key) => key.startsWith("floatview"))) return true;
  if (keys.has("mainpic") && keys.has("btnpic")) return true;
  return item.isAd === true || item.isAd === 1 || item.is_ad === true || item.is_ad === 1;
}
