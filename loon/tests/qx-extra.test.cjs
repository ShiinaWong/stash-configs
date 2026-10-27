"use strict";
const {test, before} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const plugin = fs.readFileSync(path.join(__dirname, "../shiina-adblock-supplement.plugin"), "utf8");
const ownSource = fs.readFileSync(path.join(__dirname, "../scripts/qx-extra-clean-v0.4.0.js"), "utf8");
const amapURL = "https://raw.githubusercontent.com/ddgksf2013/Scripts/0cddbb6bc31344315afba773ebb4e7ce29f7fd8f/amap.js";
const milkURL = "https://raw.githubusercontent.com/fmz200/wool_scripts/c3f8128dd03c6b3cb35821c347968282cc45b34f/Loon/plugin/blockAdsV2.plugin";
let amapSource, milk;
async function pinned(url, envName, blob) {
  let bytes;
  if (process.env[envName]) bytes = fs.readFileSync(process.env[envName]);
  else {
    const response = await fetch(url, {signal: AbortSignal.timeout(15000)});
    assert.equal(response.status, 200);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  assert.equal(crypto.createHash("sha1").update("blob " + bytes.length + "\0").update(bytes).digest("hex"), blob);
  return bytes.toString("utf8");
}
before(async () => {
  [amapSource, milk] = await Promise.all([
    pinned(amapURL, "AMAP_UPSTREAM_SCRIPT", "578533ad02749c09431997fc3ab70421d51953da"),
    pinned(milkURL, "MILK_PLUGIN", "0eeb11f1fe45618966ba3d4a2f7c6d9c86b1ee45")
  ]);
});
function urlRegex(line) {
  const match = line.match(/\$\{url\} ~= \/((?:\\.|[^\\])*?)\/([ims]*)(?=\s*(?:then|&&|\|\||\)))/);
  return match ? new RegExp(match[1], match[2]) : null;
}
const newLines = plugin.split("\n").filter(line => /^(request|response) if/.test(line) && /\$\{(?:amap_clean|caiyun_clean|netdisk_clean)\}/.test(line));
const responseLines = newLines.filter(line => line.startsWith("response"));
function hits(url, options = {}) {
  return newLines.filter(line => {
    const control = line.match(/\$\{(amap_clean|caiyun_clean|netdisk_clean)\}/)[1];
    return options[control] !== false && (options.status === undefined || options.status === 200 || line.startsWith("request")) && urlRegex(line).test(url);
  });
}
function run(source, url, body, status = 200) {
  const outputs = [];
  vm.runInNewContext(source, {
    $request: {url}, $response: {status, body: typeof body === "string" ? body : JSON.stringify(body)},
    $done: value => outputs.push(value), console: {log: () => {}}
  }, {timeout: 1000});
  assert.equal(outputs.length, 1, "Complete exactly once");
  return JSON.parse(JSON.stringify(outputs[0]));
}
const cy = endpoint => "https://starplucker.cyapi.cn/v1/" + endpoint;
const bd = endpoint => "https://pan.baidu.com/" + endpoint;
const amapPaths = ["message/notice/list", "shield/frogserver/aocs/updatable", "shield/search/nearbyrec_smart",
  "promotion-web/resource", "faas/amap-navigation/main-page", "msgbox/pull",
  "shield/dsp/profile/index/nodefaas", "shield/search/new_hotword"];
const caiyunPaths = ["operation/homefeatures", "operation/banners", "operation/features", "operation/feeds",
  "notification/message_center", "config/cypage", "campaigns"];
const netdiskPaths = ["api/getsyscfg", "feed/cardinfos", "api/taskscore/tasklist"];
const samples = [...amapPaths.map(p => "https://m5.amap.com/ws/" + p), ...caiyunPaths.map(cy), ...netdiskPaths.map(bd)];

test("every declared URL guard compiles, options bind to declared switches, MitM is scoped", () => {
  const names = new Set([...plugin.matchAll(/^(\w+) = switch,/gm)].map(m => m[1]));
  for (const line of plugin.split("\n").filter(line => /^(request|response) if/.test(line))) {
    assert.ok(urlRegex(line));
    for (const m of line.matchAll(/\$\{(\w+)\}/g)) {
      if (m[1] !== "url") assert.ok(names.has(m[1]), m[1]);
    }
    if (line.includes("then script(")) {
      assert.match(line, /enable=\$\{\w+\}/);
      assert.ok(line.includes("requires_body=true"));
    }
  }
  assert.equal(responseLines.length, 3);
  assert.ok(responseLines.find(l => l.includes(amapURL)));
  const hosts = plugin.match(/^hostname = (.+)$/m)[1].split(", ");
  assert.equal(new Set(hosts).size, hosts.length);
  assert.equal(hosts.filter(h => /weibo\.(?:cn|com)$|amap\.com$|cyapi\.cn$|^pan\.baidu\.com$/.test(h)).length, 19);
  assert.ok(hosts.every(h => /^[a-z0-9.-]+$/.test(h)));
  assert.ok(!hosts.some(h => /openai|chatgpt|anthropic/.test(h)));
});
test("each added response endpoint matches one script; switches and status guards work", () => {
  for (const url of samples) {
    for (const suffix of ["", "?sample=1", "/?sample=1"]) {
      assert.equal(hits(url + suffix).length, 1, url + suffix);
      assert.ok(hits(url + suffix)[0].includes("then script("));
    }
    assert.equal(hits(url, {amap_clean:false,caiyun_clean:false,netdisk_clean:false}).length, 0);
    assert.equal(hits(url, {status:500}).length, 0);
  }
});
test("account, weather forecast, file operations, route calculation and adjacent paths are excluded", () => {
  const excluded = [
    "https://m5.amap.com/ws/direction/path/plan", "https://m5.amap.com/ws/mapapi/poi/info",
    "https://api.caiyunapp.com/v2.6/sample/forecast", "https://biz.cyapi.cn/v2/user",
    "https://biz.cyapi.cn/api/v1/user_detail", bd("api/list"), bd("api/download"), bd("api/filemanager"),
    bd("api/streaming"), bd("api/getconfig"), bd("rest/2.0/membership/user?method=gamecenter"),
    bd("rest/2.0/membership/guide"), bd("feed/cardinfos_extra"),
    "https://pan.baidu.com.example.test/feed/cardinfos", "https://login.example.test/api/getsyscfg",
    "https://example.test/v1/operation/banners"
  ];
  for (const url of excluded) {
    assert.equal(hits(url).length, 0, url);
    assert.deepEqual(run(ownSource, url, {data:[],result:{list:[1]}}), {}, url);
  }
});
test("selected scripts are not intercepted by the audited milk V2 Rewrite/Script rules", () => {
  const candidateLines = milk.split("\n").filter(l => /^(request|response) if/.test(l));
  const relevant = candidateLines.filter(l => /amap|cyapi|caiyun|pan\\.baidu/.test(l));
  for (const line of relevant) assert.ok(urlRegex(line), "Relevant rule must be examined");
  const rules = candidateLines.flatMap(line => {
    try { const re = urlRegex(line); return re ? [{line,re}] : []; } catch { return []; }
  });
  for (const url of samples) {
    assert.deepEqual(rules.filter(r => r.re.test(url + "?sample=1")).map(r => r.line), [], url);
  }
  // These existing milk routes are deliberately left to that plugin.
  for (const url of ["https://m5.amap.com/ws/valueadded/alimama/splash_screen",
    "https://wrapper.cyapi.cn/v1/activity?type_id=A03", "https://api.caiyunapp.com/v1/activity",
    "https://afd.baidu.com/afd/entry", bd("rest/2.0/pcs/ad")]) assert.equal(hits(url).length, 0);
});
test("new request rejections target dedicated promotion paths", () => {
  for (const url of ["https://ai.amap.com/v1/ai_rec/feed", "https://m5.amap.com/ws/faas/amap-navigation/card-service-route-plan",
    "https://m5.amap.com/ws/shield/scene/recommend", "https://m5.amap.com/ws/boss/order_web/abcdefgh_information",
    "https://m5.amap.com/ws/asa/ads_attribution", "https://ad.cyapi.cn/v1/banner",
    bd("feed/hotlist"), bd("queryintent/queryhint"), bd("coins/center/notice"), bd("recommend/shortseries/list")]) {
    assert.equal(hits(url).length, 1, url);
    assert.ok(hits(url)[0].startsWith("request"));
  }
});
test("Caiyun clears promotional arrays while preserving metadata and native features", () => {
  for (const endpoint of ["operation/homefeatures", "operation/banners"]) {
    const out = JSON.parse(run(ownSource, cy(endpoint), {status:"ok", data:[{title:"promotion"}], cursor:"keep"}).body);
    assert.deepEqual(out, {status:"ok",data:[],cursor:"keep"});
  }
  const native = {url:"cy://page_driving_weather",name:"driveweather"}, unknown = {id:"new-shape"};
  for (const endpoint of ["operation/features","campaigns"]) {
    const key = endpoint === "campaigns" ? "campaigns" : "data";
    const out = JSON.parse(run(ownSource, cy(endpoint), {[key]:[native,{url:"https://example.test/promo"},unknown],code:0}).body);
    assert.deepEqual(out[key],[native,unknown]);
    assert.equal(out.code,0);
  }
});
test("Caiyun feed filtering retains article entries and unknown records", () => {
  const normal={category_times_text:"12人查看",title:"天气知识"}, unknown={title:"new schema"};
  const out=JSON.parse(run(ownSource,cy("operation/feeds"),{data:[normal,{category_times_text:"推广"},unknown],next:"keep"}).body);
  assert.deepEqual(out,{data:[normal,unknown],next:"keep"});
  assert.deepEqual(JSON.parse(run(ownSource,cy("notification/message_center"),{messages:[1],status:"ok"}).body),{messages:[],status:"ok"});
  assert.deepEqual(JSON.parse(run(ownSource,cy("config/cypage"),{popups:[1],actions:[2],version:3}).body),{popups:[],actions:[],version:3});
});
test("Netdisk ad-category cleanup does not accidentally match download_area or user data", () => {
  const normal={cfg_list:[{file:"synthetic.txt"}]};
  const input={errno:0,advertise_home:{cfg_list:[1],version:2},splash_area:{cfg_list:[2]},ad_home:{cfg_list:[3]},
    download_area:normal,home_card_area:normal,my_settings:normal,vip_info:{is_vip:0}};
  const out=JSON.parse(run(ownSource,bd("api/getsyscfg"),input).body);
  assert.deepEqual(out.advertise_home,{cfg_list:[],version:2});
  assert.deepEqual(out.splash_area.cfg_list,[]);
  assert.deepEqual(out.ad_home.cfg_list,[]);
  for(const key of ["download_area","home_card_area","my_settings","vip_info"]) assert.deepEqual(out[key],input[key]);
});
test("Netdisk compact home feed keeps files/recent and unknown shapes; unknown feeds pass through", () => {
  const cards=[{source:"product",name:"文件"},{source:"recent",name:"最近"},{source:"promotion"},{new_shape:true}];
  const out=JSON.parse(run(ownSource,bd("feed/cardinfos"),{errno:0,data:{cards,cursor:"keep"},vip:0}).body);
  assert.deepEqual(out,{errno:0,data:{cards:[cards[0],cards[1],cards[3]],cursor:"keep"},vip:0});
  assert.deepEqual(run(ownSource,bd("feed/cardinfos"),{data:{cards:[{source:"new-unknown"}]}}),{});
  assert.deepEqual(JSON.parse(run(ownSource,bd("api/taskscore/tasklist"),{result:{list:[{id:1}],score:12},errno:0}).body),
    {result:{list:[],score:12},errno:0});
});
test("invalid JSON, wrong shapes, business errors and non-200 responses pass through unchanged", () => {
  for(const url of [...caiyunPaths.map(cy),...netdiskPaths.map(bd)]) {
    for(const body of ["not JSON", "null", "[]", {data:null}, {data:{new:"unknown"}},
      {errno:401,data:[1],messages:[1]}, {code:500,data:[1]}, {error_code:"login_required",messages:[1]}]) {
      assert.deepEqual(run(ownSource,url,body),{},url);
    }
    assert.deepEqual(run(ownSource,url,{data:[1],messages:[1],result:{list:[1]}},500),{});
  }
  assert.deepEqual(run(ownSource,cy("operation/banners"),{status:"error",data:[1]}),{});
});
test("pinned Amap main/profile cleanup retains the author's business cards and unrelated fields", () => {
  const main={data:{cardList:[{dataType:"LoginCard"},{dataType:"FrequentLocation"},{dataType:"Promotion"}],
    pull3:{msgs:[1],version:2},business_position:[1],mapBizList:[2],route:{polyline:"keep"}}};
  const out=JSON.parse(run(amapSource,"https://m5.amap.com/ws/faas/amap-navigation/main-page",main).body);
  assert.deepEqual(out.data.cardList,main.data.cardList.slice(0,2));
  assert.deepEqual(out.data.pull3,{msgs:[],version:2});
  assert.deepEqual(out.data.route,main.data.route);
  assert.deepEqual(out.data.business_position,[]);assert.deepEqual(out.data.mapBizList,[]);
  const profile=JSON.parse(run(amapSource,"https://m5.amap.com/ws/shield/dsp/profile/index/nodefaas",{
    data:{tipData:{id:1},cardList:[{dataType:"MyOrderCard"},{dataType:"GdRecommendCard"},{dataType:"Promotion"}],user:{id:"synthetic"}}
  }).body);
  assert.equal(profile.data.cardList.length,2);assert.ok(!("tipData" in profile.data));
  assert.deepEqual(profile.data.user,{id:"synthetic"});
});
test("pinned Amap nearby/promotion/hotword/notice responses keep unrelated data", () => {
  const cases=[
    ["shield/search/nearbyrec_smart",{data:{coupon:{},scene:{},activity:{},commodity_rec:{},operation_activity:{},modules:["coupon","poi"],pois:[1]}},
      {data:{modules:["poi"],pois:[1]}}],
    ["promotion-web/resource",{data:{banner:[1],popup:[2],fare:{amount:10}}},{data:{banner:[],popup:[],fare:{amount:10}}}],
    ["shield/search/new_hotword",{data:{header_hotword:[1],history:[2]}},{data:{header_hotword:[],history:[2]}}],
    ["message/notice/list",{data:{noticeList:[1],version:2}},{data:{noticeList:[],version:2}}],
    ["msgbox/pull",{msgs:[1],pull3:{msgs:[2]},version:3},{msgs:[],pull3:{msgs:[]},version:3}]
  ];
  for(const [endpoint,input,expected] of cases) assert.deepEqual(JSON.parse(run(amapSource,"https://m5.amap.com/ws/"+endpoint,input).body),expected);
});
test("pinned Amap home configuration disables promotion/AI entries but retains map settings", () => {
  const input={data:{home_business_position_config:{status:0,value:"ad"},ai_feature:{status:0,value:"promo"},map_tile_config:{status:0,value:"keep"}}};
  const out=JSON.parse(run(amapSource,"https://m5.amap.com/ws/shield/frogserver/aocs/updatable",input).body);
  assert.deepEqual(out.data.home_business_position_config,{status:1,version:"",value:""});
  assert.deepEqual(out.data.ai_feature,{status:1,version:"",value:""});
  assert.deepEqual(out.data.map_tile_config,input.data.map_tile_config);
});
