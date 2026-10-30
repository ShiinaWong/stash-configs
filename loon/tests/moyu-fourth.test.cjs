"use strict";
const {test, before} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const plugin = fs.readFileSync(path.join(__dirname,"../shiina-adblock-supplement.plugin"),"utf8");
const source = fs.readFileSync(path.join(__dirname,"../scripts/moyu-extra-clean-v0.6.0.js"),"utf8");
const controls = ["unicom_clean","moji_clean","chelaile_clean"];
let milk;
before(async () => {
  const url = "https://raw.githubusercontent.com/fmz200/wool_scripts/c3f8128dd03c6b3cb35821c347968282cc45b34f/Loon/plugin/blockAdsV2.plugin";
  let bytes;
  if (process.env.MILK_PLUGIN) bytes = fs.readFileSync(process.env.MILK_PLUGIN);
  else {
    const response = await fetch(url,{signal:AbortSignal.timeout(15000)});
    assert.equal(response.status,200);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  assert.equal(crypto.createHash("sha1").update("blob "+bytes.length+"\0").update(bytes).digest("hex"),"0eeb11f1fe45618966ba3d4a2f7c6d9c86b1ee45");
  milk = bytes.toString("utf8");
});
function urlRegex(line) {
  const match=line.match(/\$\{url\} ~= \/((?:\\.|[^\\])*?)\/([ims]*)(?=\s*(?:then|&&|\|\||\)))/);
  return match ? new RegExp(match[1],match[2]) : null;
}
const entries=plugin.split("\n").filter(line=>/^(request|response) if/.test(line) && controls.some(c=>line.includes("${"+c+"}")))
  .map(line=>({line,re:urlRegex(line),phase:line.split(" ")[0],control:controls.find(c=>line.includes("${"+c+"}"))}));
// This evaluates this plugin's URL/switch/status subset, not the Loon parser.
function hits(url,options={}) {
  return entries.filter(e=>options[e.control]!==false && e.re.test(url) && (e.phase==="request" || options.status===undefined || options.status===200));
}
function run(url,body,status=200) {
  const outputs=[],logs=[];
  vm.runInNewContext(source,{
    $request:{url},$response:{status,body:typeof body==="string"?body:JSON.stringify(body)},
    $done:value=>outputs.push(value),console:{log:value=>logs.push(value)}
  },{timeout:1000});
  assert.equal(outputs.length,1,"Complete exactly once");
  assert.deepEqual(logs,[],"Never log bodies");
  return JSON.parse(JSON.stringify(outputs[0]));
}
function cleaned(url,body) {
  const result=run(url,body);
  assert.deepEqual(Object.keys(result),["body"]);
  return JSON.parse(result.body);
}
const search="https://m.client.10010.com/search_service/search/searchScrollWord";
const home="https://m.client.10010.com/clientIndex/homefusion/fuInter";
// Synthetic Moji hosts exercise the documented wildcard; they are not observed endpoints.
const weather="https://sample.api.moji.com/json/entrance/list";
const responseSamples=[search,home,weather,weather.replace("sample.api","region.sample.api")];
const requestSamples=[
  "https://m.client.10010.com/clientIndex/api/v1/index/queryIndexExclusiveOffers",
  "https://sample.api.moji.com/flycard/flyCard",
  "https://sample.api.moji.com/json/advertising_goods",
  ...["api","web","cdn.api","cdn.web"].map(h=>"https://"+h+".chelaile.net.cn/goocity/flowPos/listByPos"),
  "https://cdn.web.chelaile.net.cn/info-flow/index.html",
  ...["cdn.api","cdn.web"].flatMap(h=>["adpub","api/adpub"].map(p=>"https://"+h+".chelaile.net.cn/"+p+"/list")),
  "https://web.chelaile.net.cn/adpub/list",
  "https://api.chelaile.net.cn/api/adpub/list",
  "https://web.chelaile.net.cn/api/operative_position/infoflow"
];
const excluded=[
  ...["myWallet","myPoints","myColorfulRingtone","newUserInfo","getDeviceInfo"].map(p=>"https://m.client.10010.com/clientMyPage/v1/api/"+p),
  "https://m.client.10010.com/mobileserviceimportant/customer/querySmartServicekhd.htm",
  "https://m.client.10010.com/mobileService/login","https://m.client.10010.com/mobileService/payment",
  "https://img.client.10010.com/homejingxuan12/js/pubuliu.js",
  ...["me.api.moji.com","home.api.moji.com","ad.api.moji.com","fds.api.moji.com","sample.fds.api.moji.com","api.moji.com"].flatMap(h=>
    ["json/entrance/list","json/advertising_goods","flycard/flyCard"].map(p=>"https://"+h+"/"+p)),
  ...["forecast","shortvideo","forum","user/dynamic_v1/json/someone_interest"].map(p=>"https://sample.api.moji.com/"+p),
  "https://tnc3-alisc1.zijieapi.com/get_domains",
  "https://api.chelaile.net.cn/goocity/city!","https://api.chelaile.net.cn/goocity/bus/query",
  "https://web.chelaile.net.cn/route/plan","https://api.chelaile.net.cn/adpub/list",
  "https://web.chelaile.net.cn/api/adpub/ad","https://atrace.chelaile.net.cn/wx_preloadAd",
  "https://api.chelaile.net.cn/goocity/flowPos/listByPosition",
  "https://web.chelaile.net.cn/api/operative_position/infoflow_extra",
  weather+"_extra",home+"_extra",search+"_extra",
  "https://sample.api.moji.com/json/user?next=/json/advertising_goods"
];
test("fourth batch has three independent controls, two scripts and nine requests",()=>{
  assert.ok(plugin.includes("moyu-extra-clean-v0.6.0.js"));
  for(const c of controls) assert.ok(plugin.includes(c+" = switch,true,"));
  assert.equal(entries.filter(e=>e.phase==="request").length,9);
  assert.equal(entries.filter(e=>e.phase==="response").length,2);
  for(const e of entries) {
    assert.ok(e.re);
    if(e.phase==="response") {
      assert.ok(e.line.includes("scripts/moyu-extra-clean-v0.6.0.js"));
      assert.ok(e.line.includes("${response.status} == 200"));
      assert.ok(e.line.includes("enable=${"+e.control+"}"));
    }
  }
  const hosts=plugin.match(/^hostname = (.+)$/m)[1].split(", ");
  assert.equal(hosts.length,39);
  assert.equal(new Set(hosts).size,hosts.length);
  assert.deepEqual(hosts.filter(h=>/[?*]/.test(h)),["*.api.moji.com"]);
  for(const u of [...responseSamples,...requestSamples]) {
    const h=new URL(u).hostname;
    assert.ok(hosts.includes(h)||h.endsWith(".api.moji.com"),h);
  }
});
test("representative fourth-batch URLs each have one handler and an independent switch",()=>{
  for(const [urls,phase] of [[responseSamples,"response"],[requestSamples,"request"]]) for(const url of urls) {
    for(const u of [url,url+"?sample=1",url.replace("https:","http:")]) {
      const matches=hits(u);
      assert.equal(matches.length,1,u);assert.equal(matches[0].phase,phase);
      assert.equal(hits(u,{[matches[0].control]:false}).length,0);
      assert.equal(hits(u,Object.fromEntries(controls.filter(c=>c!==matches[0].control).map(c=>[c,false]))).length,1);
      if(phase==="response") assert.equal(hits(u,{status:500}).length,0);
    }
  }
});
test("account, weather, bus and base-owned endpoints stay outside fourth-batch handlers",()=>{
  for(const u of excluded) {
    assert.equal(hits(u).length,0,u);
    assert.deepEqual(run(u,{"113000004":[1],"HomeFusion.backGroundQuery":{},entrance_region_res_list:[{region_name:"banner区"}]}),{},u);
  }
});
test("fourth-batch host lookalikes and query-only matches do not trigger",()=>{
  for(const u of [...responseSamples,...requestSamples]) {
    const foreign=new URL(u);foreign.hostname+=".example.test";
    assert.equal(hits(foreign.href).length,0);
    const query=new URL(u);query.pathname="/ordinary";query.search="?next="+new URL(u).pathname;
    assert.equal(hits(query.href).length,0);
  }
});
test("fourth-batch URLs avoid audited milk URL and domain rejects",()=>{
  const rules=[],unparsed=[];
  for(const line of milk.split("\n").filter(l=>/^(request|response) if/.test(l))) {
    try {const re=urlRegex(line);if(re)rules.push(re);else unparsed.push(line);}catch{unparsed.push(line);}
  }
  assert.ok(rules.length>1000);
  assert.deepEqual(unparsed.filter(l=>/moji|10010|chelaile/.test(l)),[]);
  const domains=milk.split("\n").map(l=>l.split(",").map(s=>s.trim())).filter(p=>
    ["DOMAIN","DOMAIN-SUFFIX","DOMAIN-KEYWORD"].includes(p[0]) && /^REJECT/.test(p[2]||""));
  for(const u of [...responseSamples,...requestSamples]) {
    assert.equal(rules.filter(re=>re.test(u+"?sample=1")).length,0,u);
    const h=new URL(u).hostname;
    const blocked=domains.filter(([t,v])=>t==="DOMAIN"?h===v:t==="DOMAIN-SUFFIX"?h===v||h.endsWith("."+v):h.includes(v));
    assert.deepEqual(blocked,[],h);
  }
});
test("Unicom clears only the known search promotion array",()=>{
  const input={code:"0000","113000004":[{title:"synthetic promotion"}],history:["keep"],account:{balance:42},other:[1]};
  assert.deepEqual(cleaned(search,input),{...input,"113000004":[]});
  for(const value of [null,{},"unknown",[]]) assert.deepEqual(run(search,{"113000004":value}),{});
});
test("Unicom treats HomeFusion keys literally and retains unrelated account data",()=>{
  const input={code:"0000","HomeFusion.backGroundQuery":{image:"synthetic"},
    "HomeFusion.bottomLabel":{bottomMallKey:{badge:"sale"},home:"keep",service:"keep"},
    HomeFusion:{backGroundQuery:{keep:true},bottomLabel:{bottomMallKey:"nested key must remain"}},
    wallet:{balance:42},points:30,newFeature:{keep:true}};
  const expected=JSON.parse(JSON.stringify(input));delete expected["HomeFusion.backGroundQuery"];delete expected["HomeFusion.bottomLabel"].bottomMallKey;
  assert.deepEqual(cleaned(home,input),expected);
});
test("Moji removes banner region only, retaining tools, bulb, normal and unknown entries",()=>{
  const keep=[{region_name:"工具区",items:[1]},{region_name:"我页面灯泡"},{region_name:"future"},null,{newFeature:true}];
  const input={code:200,entrance_region_res_list:[keep[0],{region_name:"banner区"},...keep.slice(1)],weather:{temp:20},user:{vip:false}};
  assert.deepEqual(cleaned(weather,input),{...input,entrance_region_res_list:keep});
  assert.deepEqual(run(weather,{entrance_region_res_list:keep}),{});
});
test("business errors are preserved even when known advertising fields are present",()=>{
  for(const [url,body] of [[search,{"113000004":[1]}],[home,{"HomeFusion.backGroundQuery":{}}],[weather,{entrance_region_res_list:[{region_name:"banner区"}]}]]) {
    for(const field of ["code","errno","error_code","status_code","statusCode","resultCode"]) {
      for(const value of [403,-1,"INVALID",false,null,""]) assert.deepEqual(run(url,{...body,[field]:value}),{},field);
    }
    for(const value of [false,"false",null,0]) assert.deepEqual(run(url,{...body,success:value}),{});
    for(const value of ["error",500,null]) assert.deepEqual(run(url,{...body,status:value}),{});
    for(const status of [201,206,400,500]) assert.deepEqual(run(url,body,status),{});
  }
});
test("known success envelopes including zero-padded codes remain intact",()=>{
  for(const code of [0,"0","0000",200,"200"]) {
    const input={code,success:true,"113000004":[1],trace:"synthetic"};
    assert.deepEqual(cleaned(search,input),{...input,"113000004":[]});
  }
});
test("malformed JSON, JSONP, scalar and unknown responses remain byte-for-byte untouched",()=>{
  for(const u of responseSamples) for(const body of ["bad JSON","callback({})","null","[]","42","\"hello\"","{\"newFormat\":true}"]) {
    assert.deepEqual(run(u,body),{});
  }
  for(const u of responseSamples) assert.deepEqual(run(u,{data:{"113000004":[1],entrance_region_res_list:[{region_name:"banner区"}]}}),{});
});
test("fourth-batch transforms are idempotent",()=>{
  for(const [url,input] of [[search,{"113000004":[1]}],[home,{"HomeFusion.backGroundQuery":{}}],[weather,{entrance_region_res_list:[{region_name:"banner区"}]}]]) {
    assert.deepEqual(run(url,cleaned(url,input)),{});
  }
});
