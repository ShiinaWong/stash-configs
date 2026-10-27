"use strict";
const {test, before} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const plugin = fs.readFileSync(path.join(__dirname, "../shiina-adblock-supplement.plugin"), "utf8");
const source = fs.readFileSync(path.join(__dirname, "../scripts/moyu-extra-clean-v0.5.0.js"), "utf8");
const sourceURL = "https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/loon/scripts/moyu-extra-clean-v0.5.0.js";
const milkURL = "https://raw.githubusercontent.com/fmz200/wool_scripts/c3f8128dd03c6b3cb35821c347968282cc45b34f/Loon/plugin/blockAdsV2.plugin";
const controls = ["goofish_clean", "mailmaster_clean", "qishui_clean", "tencentdocs_clean", "taopiaopiao_clean", "idaily_clean"];
let milk;
before(async () => {
  let bytes;
  if (process.env.MILK_PLUGIN) bytes = fs.readFileSync(process.env.MILK_PLUGIN);
  else {
    const response = await fetch(milkURL, {signal: AbortSignal.timeout(15000)});
    assert.equal(response.status, 200);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  assert.equal(crypto.createHash("sha1").update("blob " + bytes.length + "\0").update(bytes).digest("hex"),
    "0eeb11f1fe45618966ba3d4a2f7c6d9c86b1ee45");
  milk = bytes.toString("utf8");
});
function urlRegex(line) {
  const match = line.match(/\$\{url\} ~= \/((?:\\.|[^\\])*?)\/([ims]*)(?=\s*(?:then|&&|\|\||\)))/);
  return match ? new RegExp(match[1], match[2]) : null;
}
const entries = plugin.split("\n").filter(line => /^(request|response) if/.test(line) &&
  controls.some(control => line.includes("${" + control + "}"))).map(line => ({
    line, re:urlRegex(line), phase:line.split(" ")[0],
    control:controls.find(control => line.includes("${" + control + "}"))
  }));
// Evaluates the URL, switch and status subset used here, not the official Loon parser.
function hits(url, options = {}) {
  return entries.filter(entry => options[entry.control] !== false && entry.re.test(url) &&
    (entry.phase === "request" || options.status === undefined || options.status === 200));
}
function run(url, body, status = 200) {
  const outputs = [], logs = [];
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  vm.runInNewContext(source, {
    $request:{url}, $response:{status,body:raw}, $done:value => outputs.push(value),
    console:{log:value => logs.push(value)}
  }, {timeout:1000});
  assert.equal(outputs.length, 1, "Complete exactly once");
  assert.deepEqual(logs, [], "Never log response bodies");
  return JSON.parse(JSON.stringify(outputs[0]));
}
const cleaned = (url, data) => {
  const result = run(url, data);
  assert.equal(typeof result.body, "string", url);
  assert.deepEqual(Object.keys(result), ["body"], "Only return a modified body");
  return JSON.parse(result.body);
};
const fish = (api, host="g-acs.m.goofish.com") => "https://" + host + "/gw/" + api + "/1.0/";
const film = api => "https://acs.m.taobao.com/gw/" + api + "/1.0/";
const music = (api, host="beta-luna.douyin.com") => "https://" + host + "/luna/" + api;
const mail = "https://appconf.mail.163.com/mailmaster/api/page/myconf.do";
const daily = "https://app-cdn.2q10.com/app/idaily/honored";
const envelope = data => ({ret:["SUCCESS::调用成功"],data,version:"synthetic",trace:"retain"});
const fishAPIs = ["mtop.taobao.idle.user.strategy.list", "mtop.taobao.idlemtopsearch.search.shade",
  "mtop.taobao.idlemtopsearch.item.search.activate", "mtop.taobao.idlemtopsearch.search.discover"];
const filmAPIs = ["mtop.film.independentadvertiseapi.querypreloadadvertise",
  "mtop.film.mtopindependentadvertiseapi.queryadvertise", "mtop.film.mtopitemadvertiseapi.queryadvertise",
  "mtop.film.life.aristotle.get", "mtop.film.life.popup.get"];
const responseSamples = [
  ...fishAPIs.map(api => fish(api)),
  fish("mtop.taobao.idle.item.recommend"), fish("mtop.taobao.idle.item.recommend", "acs.m.goofish.com"),
  mail, mail.replace("myconf.do", "v2/homeconf.do"),
  ...["beta-luna.douyin.com", "api.qishui.com"].flatMap(host => ["me", "search-block", "activities"].map(api => music(api,host))),
  ...filmAPIs.map(film), daily, daily.replace("/idaily/", "/idays/"), daily.replace("/idaily/", "/idaily_portable/")
];
const requestSamples = [
  fish("mtop.taobao.idlecommerce.splash.ads"),
  fish("mtop.idle.ad.expose"), fish("mtop.idle.ad.expose", "acs.m.goofish.com"),
  "https://dashi.163.com/task-center-api/fapi/task/list",
  "https://appconf.mail.163.com/mailmaster/api/config/function.do",
  ...["beta-luna.douyin.com", "api.qishui.com"].flatMap(host => ["ads", "media_ads"].map(api => music(api,host))),
  "https://docs.qq.com/api/advertise/list", "https://docs.qq.com/api/ad/list", "https://docs.qq.com/api/v2/ad/list",
  "https://idaily-cdn.idailycdn.com/api/intro",
  "https://icity-pres.2q10.com/api/v1/idly/common/launching",
  "https://idaily-cdn.idailycdn.com/app/idaily_portable/honored",
  "https://app-cdn.2q10.com/app/idays/popups", "https://idays-cdn.2q10.com/app/idays/app_ad"
];
const excluded = [
  // These endpoints are deliberately owned by the base milk plugin.
  fish("mtop.taobao.idlecommerce.splash.ads", "acs.m.goofish.com"),
  ...fishAPIs.map(api => fish(api,"acs.m.goofish.com")),
  fish("mtop.taobao.idle.item.recommend.list", "acs.m.goofish.com"),
  fish("mtop.taobao.idlehome.home.nextfresh"), fish("mtop.taobao.idle.local.home"),
  "https://appconf.mail.163.com/mmad/master/get.do",
  music("card"), music("more-panel"), music("commerce/v2/commerce_info"),
  film("mtop.film.mtopadvertiseapi.queryloadingbanner"), film("mtop.film.mtopadvertiseapi.queryadvertise"),
  // Account, music, movie and document functionality must remain untouched.
  fish("mtop.taobao.idle.trade.order.query"), fish("mtop.idle.user.page.my.adapter"),
  fish("mtop.taobao.idlemtopsearch.search"), fish("mtop.taobao.idle.item.buy.feeds"),
  "https://appconf.mail.163.com/mailmaster/getRegConfig.do",
  "https://mail.163.com/fgw/mailsrv-webrobot/v1/user/info",
  "https://dashi.163.com/mail/send", "https://dashi.163.com/mail/messages",
  music("feed/song-tab"), music("commerce/pay"), music("player/play"),
  "https://beta-luna.douyin.com/location/info", "https://tnc3-alisc1.zijieapi.com/get_domains",
  film("mtop.film.order.create"), film("mtop.film.mtopintegrationapi.homeconfig"),
  film("mtop.film.mtopsearchapi.getranklistbytypeforsearch"),
  "https://docs.qq.com/doc/SYNTHETIC", "https://docs.qq.com/api/document/save",
  "https://docs.qq.com/api/document/open?next=/api/ad/list",
  "https://docs.qq.com/api/document/open?next=/api/advertise/list",
  "https://idaily-cdn.idailycdn.com/api/news", "https://idays-cdn.2q10.com/app/idays/events",
  // Near matches must not expand the interception scope.
  music("ads_info"), music("me_extra"), "https://dashi.163.com/task-center-api/fapi/taskscore",
  "https://idaily-cdn.idailycdn.com/api/introduction", daily + "_extra",
  "https://appconf.mail.163.com/mailmaster/api/page/conf.do_extra",
  "https://docs.qq.com/api/document/open?next=https://docs.qq.com/api/ad/list"
];

test("v0.5 adds six independent switches, precise MitM and versioned scripts", () => {
  assert.match(plugin, /#!desc = v0\.5\.0/);
  const names = new Set([...plugin.matchAll(/^(\w+) = switch,true,/gm)].map(m => m[1]));
  controls.forEach(control => assert.ok(names.has(control),control));
  assert.equal(entries.filter(e => e.phase === "response").length,6);
  assert.equal(entries.filter(e => e.phase === "request").length,11);
  for (const entry of entries) {
    assert.ok(entry.re);
    if (entry.phase === "response") {
      assert.ok(entry.line.includes('script("' + sourceURL + '")'));
      assert.ok(entry.line.includes("enable=${" + entry.control + "}"));
      assert.ok(entry.line.includes("${response.status} == 200"));
    }
  }
  const hosts = plugin.match(/^hostname = (.+)$/m)[1].split(", ");
  assert.equal(hosts.length,31);
  assert.equal(new Set(hosts).size,31);
  assert.ok(hosts.every(host => /^[a-z0-9.-]+$/.test(host)));
  for (const url of [...responseSamples,...requestSamples]) assert.ok(hosts.includes(new URL(url).hostname),url);
});
test("every selected endpoint has exactly one handler and its own off switch", () => {
  for (const [urls,phase] of [[responseSamples,"response"],[requestSamples,"request"]]) {
    for (const url of urls) {
      for (const candidate of [url,url+"?sample=1",url.replace("https:","http:")]) {
        const matches=hits(candidate);
        assert.equal(matches.length,1,candidate);
        assert.equal(matches[0].phase,phase);
        assert.equal(hits(candidate,{[matches[0].control]:false}).length,0);
        const othersOff=Object.fromEntries(controls.filter(c=>c!==matches[0].control).map(c=>[c,false]));
        assert.equal(hits(candidate,othersOff).length,1,"Other app switches are independent");
        if(phase==="response") assert.equal(hits(candidate,{status:500}).length,0);
      }
    }
  }
});
test("core app APIs, adjacent endpoints and query strings do not trigger cleanup", () => {
  for (const url of excluded) {
    assert.equal(hits(url).length,0,url);
    assert.deepEqual(run(url,{data:{cardList:[{cardData:{bizType:"mamaAD"}}]},reward_ad_banner:{},banner:{}}),{},url);
  }
});
test("foreign hosts and path suffixes cannot inherit a valid app rule", () => {
  for (const url of [...responseSamples,...requestSamples]) {
    const u=new URL(url);u.hostname+=".example.test";
    assert.equal(hits(u.href).length,0,u.href);
    assert.deepEqual(run(u.href,{banner:{},data:{returnValue:[1]}}),{});
  }
});
test("new endpoints do not overlap the audited base plugin's parseable URL rules", () => {
  const lines=milk.split("\n").filter(line=>/^(request|response) if/.test(line));
  const rules=[],unparsed=[];
  for(const line of lines) {
    try { const re=urlRegex(line); if(re) rules.push({line,re});else unparsed.push(line); }
    catch { unparsed.push(line); }
  }
  assert.ok(rules.length>1000,"The full base plugin must be scanned");
  // Node cannot parse some unrelated ICU syntax. Never silently skip a relevant rule.
  assert.deepEqual(unparsed.filter(line=>/goofish|mailmaster|appconf|qishui|luna|mtop.*film|idaily|idays|2q10|docs/.test(line)),[]);
  for(const url of [...responseSamples,...requestSamples]) {
    const matches=rules.filter(rule=>rule.re.test(url+"?sample=1")).map(rule=>rule.line);
    assert.deepEqual(matches,[],url);
  }
});
test("base DOMAIN, DOMAIN-SUFFIX and DOMAIN-KEYWORD rejects do not swallow new app hosts", () => {
  const rules=milk.split("\n").map(line=>line.split(",").map(s=>s.trim())).filter(parts=>
    ["DOMAIN","DOMAIN-SUFFIX","DOMAIN-KEYWORD"].includes(parts[0]) && /^REJECT/.test(parts[2]||""));
  for(const host of new Set([...responseSamples,...requestSamples].map(url=>new URL(url).hostname))) {
    const blocked=rules.filter(([type,value])=>type==="DOMAIN" ? host===value :
      type==="DOMAIN-SUFFIX" ? host===value||host.endsWith("."+value) : host.includes(value));
    assert.deepEqual(blocked,[],host);
  }
});
test("Goofish removes explicit mamaAD cards and retains all other and unknown cards", () => {
  const normal={cardData:{bizType:"item"},title:"普通商品"};
  const unknown={cardData:{bizType:"future_business_type"},id:"retain"};
  const input=envelope({cardList:[normal,{cardData:{bizType:"mamaAD"}},unknown,null,{newFormat:true}],cursor:"keep"});
  for(const host of ["acs.m.goofish.com","g-acs.m.goofish.com"]) {
    const out=cleaned(fish("mtop.taobao.idle.item.recommend",host),input);
    assert.deepEqual(out,envelope({cardList:[normal,unknown,null,{newFormat:true}],cursor:"keep"}));
  }
});
test("Goofish search and floating promotions preserve the author's MTOP placeholders", () => {
  const cases=[[fishAPIs[0],"strategies"],[fishAPIs[1],"singleShadeWords"],[fishAPIs[2],"cardList"]];
  for(const [api,key] of cases) {
    const input=envelope({[key]:[{id:"synthetic-promotion"}],userSettings:{keep:true}});
    assert.deepEqual(cleaned(fish(api),input),envelope({[key]:[{}],userSettings:{keep:true}}));
  }
  assert.deepEqual(cleaned(fish(fishAPIs[3]),envelope({resultList:[1],history:["retain"]})),envelope({history:["retain"]}));
});
test("Mailmaster removes only selected promotional fields and preserves login, account and extensions", () => {
  const keep={masterLoginGuideList:[{id:"login"}],extList:[{id:"future-feature"}],account:{quota:100},settings:{keep:true}};
  const out=cleaned(mail,{code:200,data:{...keep,masterOperatorList:[1],functionOperatorInfoList:[2],memberOperator:{id:3},activityTabInfoList:[4]},serverTime:1});
  assert.deepEqual(out,{code:200,data:keep,serverTime:1});
});
test("Qishui removes only each endpoint's selected field, keeping music and entitlements intact", () => {
  for(const [api,key] of [["me","reward_ad_banner"],["search-block","search_chart_block"],["activities","activity_map"]]) {
    const input={status_code:0,[key]:{id:"promotion"},items:[{type:"track"},{type:"podcast"}],vip_info:{is_vip:false},other:"keep"};
    const { [key]:ignored,...expected }=input;
    for(const host of ["beta-luna.douyin.com","api.qishui.com"]) assert.deepEqual(cleaned(music(api,host),input),expected);
  }
});
test("Taopiaopiao preserves the response envelope when cleaning dedicated ad responses", () => {
  for(const api of filmAPIs.slice(0,2)) {
    assert.deepEqual(cleaned(film(api),envelope({returnValue:[{ad:"synthetic"}],configVersion:3})),
      envelope({returnValue:[],configVersion:3}));
  }
  assert.deepEqual(cleaned(film(filmAPIs[2]),envelope({returnValue:{banner:1},configVersion:3})),envelope({configVersion:3}));
  assert.deepEqual(cleaned(film("mtop.film.life.popup.get"),envelope({campaign:{id:"synthetic"}})),envelope({}));
});
test("Taopiaopiao home filters exact banners while retaining films, recommendations and unknown nodes", () => {
  const movie={data:{componentId:"tpp_movie_list"},list:[{title:"synthetic"}]};
  const guess={data:{componentId:"tpp_guess_like"},list:[1]};
  const unknown={data:{componentId:"future_feature"}};
  const input=envelope({nodes:[{nodes:[movie,{data:{componentId:"tpp_banner_loop"}},guess,unknown,null],id:"group"},null,{unknown:true}],city:"keep"});
  const expected=envelope({nodes:[{nodes:[movie,guess,unknown,null],id:"group"},null,{unknown:true}],city:"keep"});
  assert.deepEqual(cleaned(film("mtop.film.life.aristotle.get"),input),expected);
});
test("iDaily cross-promotion cleanup retains news, calendar data and unknown fields", () => {
  const input={apps:[1],grids:[2],banner_popups:[3],badge:{count:1},banner:{img:"synthetic"},articles:[{title:"retain"}],calendar:{events:[1]},future:{keep:true}};
  assert.deepEqual(cleaned(daily,input),{articles:input.articles,calendar:input.calendar,future:input.future});
});
test("malformed JSON, JSONP, missing bodies, unknown shapes and HTTP errors pass through unchanged", () => {
  for(const url of responseSamples) {
    for(const body of ["not JSON", "callback({})", "null", "[]", "", {new_format:true}, {data:null}, {data:"new-shape"}]) {
      assert.deepEqual(run(url,body),{},url);
    }
    for(const status of [201,204,302,401,403,500]) {
      assert.deepEqual(run(url,{data:{returnValue:[1],cardList:[{cardData:{bizType:"mamaAD"}}]},banner:{}},status),{});
    }
  }
});
test("HTTP 200 business and authentication failures are not rewritten", () => {
  for(const url of responseSamples) {
    for(const error of [{code:401},{errno:1},{error_code:"need_login"},{status_code:500},{success:false},
      {ret:["FAIL_SYS_SESSION_EXPIRED::expired"]},{ret:["SUCCESS::ok","FAIL_BIZ::error"]},{ret:[]},{ret:"unknown"}]) {
      const input={...error,data:{cardList:[{cardData:{bizType:"mamaAD"}}],returnValue:[1],strategies:[1],memberOperator:{}},
        reward_ad_banner:{},activity_map:{},search_chart_block:{},apps:[1],banner:{}};
      assert.deepEqual(run(url,input),{},url);
    }
  }
});
test("empty or unexpected ad-list formats are not coerced into new response structures", () => {
  for(const api of filmAPIs.slice(0,2)) {
    for(const value of [null,{},"unknown",42,[]]) assert.deepEqual(run(film(api),envelope({returnValue:value})),{});
  }
  for(const [api,key] of [[fishAPIs[0],"strategies"],[fishAPIs[1],"singleShadeWords"],[fishAPIs[2],"cardList"]]) {
    for(const value of [null,{},"unknown",42]) assert.deepEqual(run(fish(api),envelope({[key]:value})),{});
  }
  assert.deepEqual(run(fish("mtop.taobao.idle.item.recommend"),envelope({cardList:[{cardData:{bizType:"item"}},null]})),{});
});
test("cleanup is idempotent and returns no body when no further changes are needed", () => {
  const cases=[
    [fish(fishAPIs[0]),envelope({strategies:[1]})],
    [fish("mtop.taobao.idle.item.recommend"),envelope({cardList:[{cardData:{bizType:"mamaAD"}},{id:"keep"}]})],
    [mail,{data:{memberOperator:{}}}], [music("me"),{reward_ad_banner:{},items:[1]}],
    [film(filmAPIs[0]),envelope({returnValue:[1]})],
    [film("mtop.film.life.popup.get"),envelope({campaign:{}})], [daily,{banner:{},articles:[1]}]
  ];
  for(const [url,input] of cases) {
    const first=run(url,input);assert.ok(first.body,url);
    assert.deepEqual(run(url,first.body),{},url);
  }
});
