"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const plugin=fs.readFileSync(path.join(__dirname,"../shiina-adblock-supplement.plugin"),"utf8");
const control="wechat_dxm_assets"; // Keep v0.6 saved switch preferences.
const lines=plugin.split("\n").filter(l=>/^request if/.test(l)&&l.includes("${"+control+"}"));
function urlRegex(line){
  const m=line.match(/\$\{url\} ~= \/((?:\\.|[^\\])*?)\/([ims]*)(?=\s*(?:then|&&|\|\||\)))/);
  return m?new RegExp(m[1],m[2]):null;
}
const entries=lines.map(line=>({line,re:urlRegex(line),action:line.split(" then ")[1]}));
function hits(url,enabled=true){return enabled?entries.filter(e=>e.re.test(url)):[];}
const imagePrefix="https://wximg.wxs.qq.com/141/20204/snscosdownload/SZ/reserved/";
const videoPrefix="https://wxsmw.wxs.qq.com/131/20210/snssvpdownload/SH/reserved/";
// Shared creative identifiers from v0.6 only, with no captured query parameters.
const previousImages=[
  "6a98f4ff00064c2c2b4bef679a68bc1e0000008d00004eec",
  "6abce3f5000becb30d0176c02668bc1e0000008d00004eec",
  "6ae0150e000b368d0ecef4e1820155150000008d00004eec",
  "6a9a2dd6000a79921bc5dad63b6bae1e0000008d00004eec"
];
const freshImages=[
  imagePrefix+"synthetic_new_brand_001",
  imagePrefix+"a".repeat(44)+"_synthetic_resize",
  imagePrefix.replace("141/20204","142/20205").replace("/SZ/","/SH/")+"synthetic_banner.jpg",
  imagePrefix+"synthetic_icon.png",imagePrefix+"synthetic_banner.webp",
  imagePrefix+"synthetic_banner.gif",imagePrefix+"synthetic_banner.avif"
];
const freshVideos=[
  videoPrefix+"ads_svp_video__synthetic.f124003.mp4",
  videoPrefix.replace("131/20210","132/20211").replace("/SH/","/SZ/")+"ads_svp_video__synthetic_new_brand.mp4"
];
test("generic WeChat keeps the saved control and uses media-aware placeholders on two exact hosts",()=>{
  assert.equal(entries.length,2);
  assert.ok(plugin.includes(control+" = switch,true,tag=微信通用广告素材,"));
  for(const entry of entries){assert.ok(entry.re);assert.ok(entry.line.includes("${"+control+"} == true"));}
  assert.deepEqual(entries.map(e=>e.action),["reject_img(200)","reject_video(200)"]);
  const hosts=plugin.match(/^hostname = (.+)$/m)[1].split(", ");
  assert.ok(hosts.includes("wximg.wxs.qq.com"));assert.ok(hosts.includes("wxsmw.wxs.qq.com"));
  assert.ok(!hosts.some(h=>h.includes("*")&&h.includes("qq.com")));
  assert.equal(plugin.split("\n").filter(l=>/^response if/.test(l)&&l.includes("${"+control+"}")).length,0);
});
test("the four previously verified images are still covered with fresh query parameters",()=>{
  for(const id of previousImages)for(const query of ["","?test=1","?fresh=value&next=2"]){
    const match=hits(imagePrefix+id+query);
    assert.equal(match.length,1);assert.equal(match[0].action,"reject_img(200)");
  }
});
test("new brands, asset identifiers, image variants and SH/SZ routes match without adding hashes",()=>{
  for(const url of freshImages)for(const scheme of ["https:","http:"])for(const query of ["","?fresh=synthetic"]){
    const match=hits(url.replace("https:",scheme)+query);
    assert.equal(match.length,1,url);assert.equal(match[0].action,"reject_img(200)");
  }
});
test("generic video matching requires the explicit advertising filename prefix",()=>{
  for(const url of freshVideos)for(const query of ["","?test=1"]){
    const match=hits(url+query);
    assert.equal(match.length,1);assert.equal(match[0].action,"reject_video(200)");
  }
  for(const name of ["ordinary-video.mp4","ads_svp_video__","ads_svp_video__test.mp4_extra","ads_svp_video__test.jpg","nonads_svp_video__test.mp4"]){
    assert.equal(hits(videoPrefix+name).length,0,name);
  }
});
test("ordinary media routes, article APIs, avatars, QR resources and WeChat communication stay outside",()=>{
  const normal=[
    "https://wximg.wxs.qq.com/normal/synthetic.jpg",
    "https://wximg.wxs.qq.com/141/20204/snscosdownload/SZ/ordinary/synthetic",
    "https://wximg.wxs.qq.com/141/20204/snscosdownload/SZ/reserved/",
    "https://wximg.wxs.qq.com/141/20204/snscosdownload/SZ/reserved/synthetic.mp4",
    "https://wximg.wxs.qq.com/141/20204/snscosdownload/SZ/reserved/synthetic/child",
    "https://wxsmw.wxs.qq.com/normal/ads_svp_video__synthetic.mp4",
    "https://wxsmw.wxs.qq.com/131/20210/snssvpdownload/SH/ordinary/ads_svp_video__synthetic.mp4",
    "https://mmbiz.qpic.cn/mmbiz_png/synthetic-article/640",
    "https://mpvideo.qpic.cn/synthetic-article.mp4",
    "https://wx.qlogo.cn/mmopen/synthetic-avatar/64",
    "https://wxa.wxs.qq.com/images/icon/synthetic.png",
    "https://mp.weixin.qq.com/mp/getainfo","https://mp.weixin.qq.com/mp/tts",
    "https://mp.weixin.qq.com/s?test=1",
    "https://szextshort.weixin.qq.com/mmtls/synthetic",
    "https://szshort.weixin.qq.com/mmtls/synthetic",
    "https://weixin.qq.com/pay/synthetic",
    "https://prewxacode.wxqcloud.qq.com.cn/weapp/release_patch_encrypt/synthetic"
  ];
  normal.forEach(url=>assert.equal(hits(url).length,0,url));
});
test("hostname spoofing and an advertising path in a query do not trigger the generic handlers",()=>{
  for(const url of [...freshImages,...freshVideos]){
    const foreign=new URL(url);foreign.hostname+=".example.test";
    assert.equal(hits(foreign.href).length,0);
    const query=new URL(url);query.pathname="/ordinary";query.search="?next="+new URL(url).pathname;
    assert.equal(hits(query.href).length,0);
  }
});
test("turning off the existing WeChat switch disables both generic media handlers",()=>{
  for(const url of [...freshImages,...freshVideos])assert.equal(hits(url,false).length,0);
});
test("generic WeChat URLs do not duplicate the audited milk URL or domain rules",async()=>{
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
      try{const re=urlRegex(line);if(re)rules.push(re);else unparsed.push(line);}catch{unparsed.push(line);}
    }
    const [kind,value,policy]=line.split(",").map(s=>s.trim());
    if(/^REJECT/.test(policy||""))for(const host of ["wximg.wxs.qq.com","wxsmw.wxs.qq.com"]){
      const blocked=kind==="DOMAIN"?host===value:kind==="DOMAIN-SUFFIX"?host===value||host.endsWith("."+value):kind==="DOMAIN-KEYWORD"?host.includes(value):false;
      assert.equal(blocked,false,"Base domain reject must not hide the new rule");
    }
  }
  assert.ok(rules.length>1000);
  assert.deepEqual(unparsed.filter(l=>/wximg|wxsmw|wxs|weixin/.test(l)),[]);
  for(const url of [...previousImages.map(id=>imagePrefix+id),...freshImages,...freshVideos])assert.equal(rules.filter(re=>re.test(url+"?test=1")).length,0);
});
