/* Remove known ad containers from SMZDM while preserving articles and account data. */

const url = $request.url;

function hideSplash(item) {
  if (!item || typeof item !== "object") return;
  item.start_date = "2090-12-31 00:00:00";
  item.end_date = "2090-12-31 23:59:59";
  item.unix_start_date = "3818332800";
  item.unix_end_date = "3818419199";
  item.is_show_ad = "0";
}

function filterArray(container, key, keep) {
  if (!Array.isArray(container?.[key])) return false;
  const before = container[key].length;
  container[key] = container[key].filter(keep);
  return before !== container[key].length;
}

try {
  const payload = JSON.parse($response.body);
  const data = payload?.data;
  let changed = false;

  if (url.includes("/util/loading")) {
    const items = Array.isArray(data) ? data : [data];
    items.filter(Boolean).forEach(hideSplash);
    changed = items.some(Boolean);
  } else if (url.includes("/advert_distribution/get_all_advertise")) {
    hideSplash(data);
    changed = Boolean(data);
  } else if (url.includes("homepage-api.smzdm.com/v3/home")) {
    if (Array.isArray(data?.component)) {
      data.component = data.component.filter((component) => {
        if (["top_banner", "hongbao"].includes(component?.zz_type)) return false;
        if (component?.zz_type === "banner" && Array.isArray(component.zz_content)) {
          component.zz_content = component.zz_content.filter((item) => item?.tag !== "广告");
        }
        if (component?.zz_type === "list" && Array.isArray(component.zz_content)) {
          component.zz_content = component.zz_content.filter((item) => item?.model_type !== "ads");
        }
        return true;
      });
      changed = true;
    }
  } else if (url.includes("haojia-api.smzdm.com/home/list")) {
    changed = filterArray(data, "rows", (item) => !item?.ad_banner_id) || changed;
    changed = filterArray(data, "banner_v2", (item) => item?.cell_type === "21028") || changed;
  } else if (url.includes("haojia.m.smzdm.com/detail_modul/article_releated_modul")) {
    if (data && Object.prototype.hasOwnProperty.call(data, "lanmu_qikan")) {
      data.lanmu_qikan = {};
      changed = true;
    }
  } else if (url.includes("baike-api.smzdm.com/home_v3/list")) {
    changed = filterArray(data, "rows", (item) => !item?.ad_banner_id) || changed;
  } else if (url.includes("s-api.smzdm.com/sou/list_v10")) {
    changed = filterArray(data, "rows", (item) => item?.article_tag !== "广告") || changed;
  } else if (url.includes("s-api.smzdm.com/sou/filter/tags/hot_tags")) {
    if (data && Object.prototype.hasOwnProperty.call(data, "hongbao")) {
      data.hongbao = {};
      changed = true;
    }
  }

  $done(changed ? { body: JSON.stringify(payload) } : {});
} catch (error) {
  console.log(`SMZDM Ad Clean: ${error}`);
  $done({});
}
