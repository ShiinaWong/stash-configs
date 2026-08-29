// SPDX-License-Identifier: GPL-3.0-only
/*
 * Remove splash payloads from Taobao and JD while preserving normal startup data.
 * Endpoint behavior was cross-checked against fmz200/wool_scripts and yfamilys Ultra+.
 */

function cleanTaobao(payload, url) {
  if (url.includes("mtop.taobao.cloudvideo.video.query")) {
    if (payload?.data && typeof payload.data === "object") {
      payload.data.duration = "0";
      if (Array.isArray(payload.data.resources)) payload.data.resources = [];
      if (Array.isArray(payload.data.caches)) payload.data.caches = [];
    }
    return;
  }

  const sections = payload?.data?.containers?.splash_home_base?.base?.sections;
  if (!Array.isArray(sections)) return;
  for (const section of sections) {
    const splash = section?.bizData?.["taobao-splash"];
    if (Array.isArray(splash?.data)) splash.data = [];
  }
}

function cleanJd(payload) {
  if (Array.isArray(payload?.images)) payload.images = [];
  if (payload && typeof payload === "object" && "showTimesDaily" in payload) {
    payload.showTimesDaily = 0;
  }
}

try {
  const url = $request.url;
  const payload = JSON.parse($response.body);

  if (url.includes("guide-acs.m.taobao.com")) {
    cleanTaobao(payload, url);
  } else if (url.includes("api.m.jd.com") && url.includes("functionId=start")) {
    cleanJd(payload);
  }

  $done({ body: JSON.stringify(payload) });
} catch (error) {
  console.log(`E-commerce Splash Clean: ${error}`);
  $done({});
}
