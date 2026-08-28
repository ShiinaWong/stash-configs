/* Remove native ads from WeChat Official Account article responses. */

try {
  const payload = JSON.parse($response.body);
  const isObject = payload && typeof payload === "object" && !Array.isArray(payload);
  const hasAdFields = isObject && (
    Object.prototype.hasOwnProperty.call(payload, "advertisement_num") ||
    Object.prototype.hasOwnProperty.call(payload, "advertisement_info")
  );

  if (!hasAdFields) {
    $done({});
  } else {
    payload.advertisement_num = 0;
    payload.advertisement_info = [];
    delete payload.appid;
    $done({ body: JSON.stringify(payload) });
  }
} catch (error) {
  console.log(`WeChat Official Ads Clean: ${error}`);
  $done({});
}
