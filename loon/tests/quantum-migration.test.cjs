"use strict";
const {test,before}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const crypto=require("node:crypto");
const plugin=fs.readFileSync(path.join(__dirname,"../shiina-adblock-supplement-v0.8.0.plugin"),"utf8");
const legacy=fs.readFileSync(path.join(__dirname,"../shiina-adblock-supplement.plugin"),"utf8");
const controls=["safari_search","google_cn_redirect","netease_extra","douban_web"];
const raw=plugin.split("\n").filter(l=>/^(request|response) if/.test(l));
function urlRegex(line){const m=line.match(/\$\{url\} ~= \/((?:\\.|[^\\])*?)\/([ims]*)(?=\s*(?:as\s|then|&&|\|\||\)))/);assert.ok(m,"URL regex parsed");return new RegExp(m[1],m[2]);}
const entries=raw.filter(l=>controls.some(c=>l.includes("${"+c+"}"))).map(line=>({line,re:urlRegex(line),control:controls.find(c=>line.includes("${"+c+"}"))}));
// Evaluate the restricted URL/method/switch subset for semantic fixtures, not Loon's parser.
function dispatch(url,options={}){
 for(const entry of entries){if(options[entry.control]===false)continue;if(entry.line.includes('${request.method} == "GET"')&&(options.method||"GET")!=="GET")continue;
  const match=entry.re.exec(url);if(!match)continue;
  if(entry.control==="douban_web"&&((options.status??200)!==200||!/^text\/html(?:\s*;|$)/i.test(options.contentType||"text/html")))continue;
  const redirect=entry.line.match(/then redirect\(302, "([^"]+)"\)/);
  return {control:entry.control,location:redirect?redirect[1].replace(/\$\{(?:search|google)\.(\d+)\}/g,(_,i)=>match[Number(i)]):null};
 }return null;
}
let milk,douban;
async function pinned(url,env,hash){let b;if(process.env[env])b=fs.readFileSync(process.env[env]);else{const response=await fetch(url,{signal:AbortSignal.timeout(15000)});assert.equal(response.status,200);b=Buffer.from(await response.arrayBuffer());}assert.equal(crypto.createHash("sha1").update("blob "+b.length+"\0").update(b).digest("hex"),hash);return b.toString("utf8");}
before(async()=>{[milk,douban]=await Promise.all([
 pinned("https://raw.githubusercontent.com/fmz200/wool_scripts/58f6cce6dbd5c5fe50c2998938f9c2ba631a7c18/Loon/plugin/blockAds.plugin","MILK_PLUGIN","a699c8de8b6e82be3d46c03fc126a1749fe002f4"),
 pinned("https://raw.githubusercontent.com/ddgksf2013/Scripts/203e38b7b8dd1082ececbd17de3aeb587ac2826c/douban.js","DOUBAN_UPSTREAM_SCRIPT","1b4e988aec077c64c7385daf54604796bfaf5551")
]);});
test("all existing active instructions remain and r4 plugin stays usable",()=>{
 const old=legacy.split("\n").filter(l=>/^(request|response) if|^DOMAIN/.test(l));for(const line of old)assert.ok(plugin.split("\n").includes(line));
 assert.ok(legacy.includes("v0.7.2"));assert.ok(!legacy.includes("safari_search"));
 for(const l of raw)assert.ok(urlRegex(l));
 assert.equal(raw.filter(l=>l.startsWith("request")).length,100);assert.equal(raw.filter(l=>l.startsWith("response")).length,19);
 for(const c of controls)assert.ok(plugin.includes(c+" = switch,true,"));
});
test("Safari search supports commands before or after multiword terms and reordered parameters",()=>{
 const cases=[
 ['https://duckduckgo.com/?q=gh+loon+proxy&t=iphone','https://github.com/search?q=loon+proxy'],
 ['https://duckduckgo.com/?t=iphone&q=loon+proxy+gh','https://github.com/search?q=loon+proxy'],
 ['https://duckduckgo.com/?q=bli%20%E9%9F%B3%E4%B9%90','https://m.bilibili.com/search?keyword=%E9%9F%B3%E4%B9%90'],
 ['https://duckduckgo.com/?q=hello%20world%20yt&ia=web','https://www.youtube.com/results?search_query=hello%20world'],
 ['https://duckduckgo.com/?q=%E6%B5%8B%E8%AF%95+loon','https://www.google.com/search?q=%E6%B5%8B%E8%AF%95+loon'],
 ['https://duckduckgo.com/?q=gh+hello%26world%3D1','https://github.com/search?q=hello%26world%3D1'],
 ['https://duckduckgo.com/?q=zh+hello','https://www.zhihu.com/search?q=hello'],
 ['https://duckduckgo.com/?q=yd+hello','https://dict.youdao.com/search?q=hello']
 ];for(const [input,output]of cases)assert.equal(dispatch(input).location,output);
});
test("Safari prefix wins over suffix, normal queries remain intact, and disabled feature passes through",()=>{
 assert.equal(dispatch('https://duckduckgo.com/?q=yt+gh').location,'https://www.youtube.com/results?search_query=gh');
 for(const url of ['https://duckduckgo.com/?q=python+github','https://duckduckgo.com/?q=cn','https://duckduckgo.com/?q=gh'])assert.ok(dispatch(url).location.startsWith('https://www.google.com/search?q='));
 assert.equal(dispatch('https://duckduckgo.com/?q=gh+test',{safari_search:false}),null);
 for(const url of ['https://duckduckgo.com.evil.invalid/?q=gh+test','https://evil.invalid/?next=https://duckduckgo.com/?q=gh+test','https://duckduckgo.com/?notq=gh+test','https://duckduckgo.com/?q=','https://duckduckgo.com/?q=gh+test\r\nX-Test:one','https://duckduckgo.com/html/?q=gh+test'])assert.equal(dispatch(url),null);
 assert.equal(dispatch('https://duckduckgo.com/?q=gh+test',{method:'POST'}),null);
});
test("Google CN redirect preserves path/query and cannot capture unrelated hosts",()=>{
 for(const h of ['g.cn','www.g.cn','google.cn','www.google.cn'])for(const tail of ['', '/', '/search?q=loon%20proxy&hl=zh-CN'])assert.equal(dispatch('https://'+h+tail).location,'https://www.google.com'+tail);
 for(const u of ['https://google.cn.evil.invalid/','https://www.google.com/','https://evil.invalid/?q=https://google.cn/'])assert.equal(dispatch(u),null);
 assert.equal(dispatch('https://g.cn/',{google_cn_redirect:false}),null);assert.equal(dispatch('https://g.cn/',{method:'POST'}),null);
});
const endpoints=['content/activity/music/jar/template/list','vipmall/couponcfg/get','comment/feed/inserted/resources'];
test("NetEase supplements cover the three source endpoints and preserve music/account/purchase APIs",()=>{
 for(const host of ['interface',...Array.from({length:10},(_,i)=>'interface'+i)])for(const api of ['api','eapi'])for(const p of endpoints)for(const suffix of ['','/','?fixture=1']){
  const u='https://'+host+'.music.163.com/'+api+'/'+p+suffix;assert.equal(dispatch(u).control,'netease_extra');assert.equal(dispatch(u,{netease_extra:false}),null);
 }
 for(const p of ['song/enhance/player/url','user/account','vip/cashier/order/create',...endpoints.map(x=>x+'_extra')])assert.equal(dispatch('https://interface3.music.163.com/eapi/'+p),null);
 assert.equal(dispatch('https://interface3.music.163.com.evil.invalid/eapi/'+endpoints[0]),null);
});
test("new URLs have no existing Naisi URL handler or reject-domain match",()=>{
 const relevant=milk.split('\n').filter(l=>/^(request|response) if/.test(l)&&/music|douban|duckduckgo|google|g\\\.cn/.test(l));
 const checks=relevant.map(l=>urlRegex(l));
 const urls=['https://duckduckgo.com/?q=gh+loon','https://www.google.cn/search?q=loon','https://m.douban.com/movie/subject/12345/',...['interface','interface3','interface8'].flatMap(h=>endpoints.map(p=>'https://'+h+'.music.163.com/eapi/'+p))];
 const domainRules=milk.split('\n').filter(l=>/^DOMAIN(?:-SUFFIX)?,[^,]+,REJECT(?:,|$)/.test(l)).map(l=>l.split(','));
 for(const u of urls){assert.ok(!checks.some(re=>re.test(u)),u);const h=new URL(u).hostname;assert.ok(!domainRules.some(([type,d])=>h===d||(type==='DOMAIN-SUFFIX'&&h.endsWith('.'+d))),u);}
});
test("Douban runs only for successful HTML on the named mobile paths",()=>{
 for(const p of ['home_guide','movie','tv','book','group','music'])assert.equal(dispatch('https://m.douban.com/'+p+'/',{contentType:'text/html; charset=utf-8'}).control,'douban_web');
 for(const options of [{status:401},{status:500},{contentType:'application/json'},{contentType:'text/htmlx'},{douban_web:false}])assert.equal(dispatch('https://m.douban.com/movie/subject/123/',options),null);
 for(const u of ['https://m.douban.com/movienotvalid','https://m.douban.com.evil.invalid/movie/','https://api.douban.com/movie/'])assert.equal(dispatch(u),null);
});
test("pinned original Douban script cleans synthetic HTML once without network calls or logs",()=>{
 const outputs=[],logs=[],network=[];
 const html='<html><head><title>测试</title></head><body><div class="sub-vendor">推广</div><p id="keep">影评正文</p><img src="https://at3.doubanio.com/item.png"></body></html>';
 vm.runInNewContext(douban,{$request:{url:'https://m.douban.com/movie/subject/12345/'},$response:{status:200,headers:{'Content-Type':'text/html'},body:html},$done:r=>outputs.push(r),console:{log:(...a)=>logs.push(a)},$httpClient:{get:()=>network.push('get'),post:()=>network.push('post')}},{timeout:1500});
 assert.equal(outputs.length,1);assert.deepEqual(network,[]);assert.deepEqual(logs,[]);assert.ok(outputs[0].body.includes('影评正文'));assert.ok(!outputs[0].body.includes('sub-vendor'));assert.ok(outputs[0].body.includes('subject-banner'));assert.ok(outputs[0].body.includes('https://douban.com/item.png'));
});
test("MITM additions are exact hosts and keep Google global, banking and payment outside the additions",()=>{
 const hosts=plugin.match(/^hostname = (.+)$/m)[1].split(', ');const old=legacy.match(/^hostname = (.+)$/m)[1].split(', ');const added=hosts.filter(h=>!old.includes(h));
 assert.deepEqual(added,['duckduckgo.com','google.cn','www.google.cn','g.cn','www.g.cn','m.douban.com','interface.music.163.com',...Array.from({length:10},(_,i)=>'interface'+i+'.music.163.com')]);
 assert.equal(new Set(hosts).size,hosts.length);assert.equal(hosts.length,56);assert.ok(!hosts.includes('www.google.com'));
});
