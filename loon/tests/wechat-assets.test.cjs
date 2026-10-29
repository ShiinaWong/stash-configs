"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const plugin=fs.readFileSync(path.join(__dirname,"../shiina-adblock-supplement.plugin"),"utf8");
const lines=plugin.split("\n").filter(l=>/^request if/.test(l)&&l.includes("${wechat_dxm_assets}"));
const rule=lines[0];
const match=rule.match(/\$\{url\} ~= \/((?:\\.|[^\\])*?)\/([ims]*)(?=\s*then)/);
const re=new RegExp(match[1],match[2]);
// Shared ad-creative identifiers only. No captured URL query, cookie or user data.
const prefix="https://wximg.wxs.qq.com/141/20204/snscosdownload/SZ/reserved/";
const images=[
  "6a98f4ff00064c2c2b4bef679a68bc1e0000008d00004eec",
  "6abce3f5000becb30d0176c02668bc1e0000008d00004eec",
  "6ae0150e000b368d0ecef4e1820155150000008d00004eec",
  "6a9a2dd6000a79921bc5dad63b6bae1e0000008d00004eec"
];
test("four visually confirmed brand assets are scoped to one switch and exact host",()=>{
  assert.equal(lines.length,1);
  assert.ok(plugin.includes("wechat_dxm_assets = switch,true,"));
  assert.match(rule,/\$\{wechat_dxm_assets\} == true/);
  assert.match(rule,/then reject\(404\)$/);
  assert.ok(plugin.match(/^hostname = (.+)$/m)[1].split(", ").includes("wximg.wxs.qq.com"));
  assert.equal(plugin.split("\n").filter(l=>/^response if/.test(l)&&l.includes("wechat_dxm_assets")).length,0);
});
test("known ad assets match both HTTP schemes and arbitrary fresh query parameters",()=>{
  for(const id of images) for(const scheme of ["https:","http:"]) for(const query of ["","?test=1","?fresh=value&next=2"]) {
    assert.equal(re.test((prefix+id+query).replace("https:",scheme)),true);
  }
});
test("ordinary WeChat images, articles, communication and unverified creatives remain outside the rule",()=>{
  const normal=[
    prefix+"synthetic-unverified-image",
    "https://wximg.wxs.qq.com/other/path/"+images[0],
    "https://wximg.wxs.qq.com/normal?next="+new URL(prefix+images[0]).pathname,
    "https://mmbiz.qpic.cn/mmbiz_png/synthetic-article/640",
    "https://wx.qlogo.cn/mmopen/synthetic-avatar/64",
    "https://mp.weixin.qq.com/mp/getainfo",
    "https://mp.weixin.qq.com/mp/tts",
    "https://mp.weixin.qq.com/s?test=1",
    "https://szextshort.weixin.qq.com/mmtls/synthetic",
    "https://wxsmw.wxs.qq.com/131/20210/snssvpdownload/SH/reserved/ads_svp_video__synthetic.mp4"
  ];
  for(const url of normal)assert.equal(re.test(url),false,url);
  for(const id of images) {
    assert.equal(re.test(prefix+id+"_unknown_variant"),false);
    assert.equal(re.test(prefix.replace("wximg.wxs.qq.com","wximg.wxs.qq.com.example.test")+id),false);
  }
});
test("the verified asset URLs do not duplicate the audited milk URL or domain rules",async()=>{
  let bytes;
  if(process.env.MILK_PLUGIN)bytes=fs.readFileSync(process.env.MILK_PLUGIN);
  else{
    const response=await fetch("https://raw.githubusercontent.com/fmz200/wool_scripts/c3f8128dd03c6b3cb35821c347968282cc45b34f/Loon/plugin/blockAdsV2.plugin",{signal:AbortSignal.timeout(15000)});
    assert.equal(response.status,200);bytes=Buffer.from(await response.arrayBuffer());
  }
  assert.equal(crypto.createHash("sha1").update("blob "+bytes.length+"\0").update(bytes).digest("hex"),"0eeb11f1fe45618966ba3d4a2f7c6d9c86b1ee45");
  const rules=[],unparsed=[];
  for(const line of bytes.toString("utf8").split("\n")){
    if(/^(request|response) if/.test(line)){
      try{
        const m=line.match(/\$\{url\} ~= \/((?:\\.|[^\\])*?)\/([ims]*)(?=\s*(?:then|&&|\|\||\)))/);
        if(m)rules.push(new RegExp(m[1],m[2]));else unparsed.push(line);
      }catch{unparsed.push(line);}
    }
    const [kind,value,policy]=line.split(",").map(s=>s.trim());
    if(/^REJECT/.test(policy||"")){
      const host="wximg.wxs.qq.com";
      const blocked=kind==="DOMAIN"?host===value:kind==="DOMAIN-SUFFIX"?host===value||host.endsWith("."+value):kind==="DOMAIN-KEYWORD"?host.includes(value):false;
      assert.equal(blocked,false,"Base domain reject must not hide the new rule");
    }
  }
  assert.ok(rules.length>1000);
  assert.deepEqual(unparsed.filter(l=>/wximg|wxs|weixin/.test(l)),[]);
  for(const id of images)assert.equal(rules.filter(r=>r.test(prefix+id+"?test=1")).length,0);
});
