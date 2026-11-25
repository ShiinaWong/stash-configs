"use strict";
const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const code=fs.readFileSync(path.join(__dirname,'../scripts/ipquality-current-route.js'),'utf8');
const plugin=fs.readFileSync(path.join(__dirname,'../shiina-ipquality.plugin'),'utf8');
let core;
before(async()=>{
 let bytes;
 if(process.env.IPQUALITY_CORE)bytes=fs.readFileSync(process.env.IPQUALITY_CORE);
 else {const r=await fetch('https://raw.githubusercontent.com/MaYIHEI/paperclip/eaa04fe0a9f37ccfafdd11930d28fd5ff3f04718/loon/ipquality/ipquality.js',{signal:AbortSignal.timeout(15000)});assert.equal(r.status,200);bytes=Buffer.from(await r.arrayBuffer());}
 assert.equal(crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),'ed957937796f7f1ed1a2fa2a27de1a973bd18dc7');core=bytes.toString('utf8');
});
async function simulate(options={}){
 const calls=[],results=[],logs=[],writes=[];let finish;
 const complete=new Promise(resolve=>finish=resolve);
 const ip='198.51.100.42';
 function request(method,req,cb){
  calls.push({method,...req});
  if(req.url.includes('/loon/ipquality/ipquality.js')){
   cb(options.downloadError||null,{status:options.downloadStatus||200},options.downloadBody??core);return;
  }
  if(options.networkError){cb('synthetic private endpoint '+ip,{status:502},'');return;}
  const host=new URL(req.url).hostname;
  const obj={ip,country:'Example',country_code:'ZZ',countryCode:'ZZ',city:'Example',region:'Example',isp:'Synthetic ISP',asn:{asn:64500,org:'Synthetic ISP'},company:{name:'Synthetic ISP',type:'isp'}};
  if(/cloudflare/.test(host)){cb(null,{status:200},'ip='+ip+'\nloc=ZZ\n');return;}
  cb(null,{status:200,headers:{}},JSON.stringify(obj));
 }
 const context={
  $argument:options.argument??'basic',
  $environment:{params:{node:'synthetic airport first hop',nodeInfo:{name:'synthetic first hop'}}},
  $config:{getConfig:()=>options.config??JSON.stringify({running_model:options.mode??1,final:options.final??'境外家宽'})},
  $persistentStore:{read:()=>null,write:(...a)=>writes.push(a)},
  $httpClient:{get:(r,c)=>request('GET',r,c),post:(r,c)=>request('POST',r,c)},
  $done:r=>{results.push(r);finish();},
  console:{log:(...a)=>logs.push(a)},
  $utils:{geoip:()=> 'ZZ',ipasn:()=>64500,ipaso:()=> 'Synthetic ISP'},
  $notification:{post:()=>assert.fail('No unsolicited notifications')},
  setTimeout:()=>0,clearTimeout:()=>{},URL,TextEncoder,TextDecoder,Uint8Array
 };
 vm.runInNewContext(code,context,{timeout:1500});
 let timeout;
 try{await Promise.race([complete,new Promise((_,reject)=>timeout=setTimeout(()=>reject(new Error('Synthetic run did not finish')),2000))]);}finally{clearTimeout(timeout);}
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(results.length,1);assert.deepEqual(logs,[]);assert.deepEqual(writes,[]);
 return {calls,result:results[0],ip};
}
test('plugin exposes only three manual entries and no rules, MitM or scheduled work',()=>{
 const sections=[...plugin.matchAll(/^\[([^\]]+)\]/gm)].map(m=>m[1]);assert.deepEqual(sections,['Script']);
 assert.equal(plugin.split('\n').filter(l=>l.startsWith('generic then script(')).length,3);
 assert.ok(!/^(cron|network-changed|request|response)\s/m.test(plugin));
 for(const key of ['basic','risk','media'])assert.ok(plugin.includes(', "'+key+'")'));
});
test('mode and final-policy guards prevent testing the wrong current configuration',async()=>{
 for(const o of [{mode:0},{mode:2},{final:'DIRECT'},{config:'not JSON'},{config:'null'}]){const {calls,result}=await simulate(o);assert.equal(calls.length,0);assert.ok(result.content);}
});
test('invalid modules are rejected before download',async()=>{
 for(const argument of ['','unknown','__proto__','constructor'])assert.equal((await simulate({argument})).calls.length,0);
});
test('all original basic probes and DIRECT database lookups inherit normal routing and validate TLS',async()=>{
 const {calls,result,ip}=await simulate();assert.ok(calls.length>=6);assert.ok(result.htmlMessage);
 assert.ok(calls.some(r=>r.url.includes('ipinfo.io')),'Exercise original DIRECT lookup');
 for(const call of calls){assert.ok(!Object.hasOwn(call,'node'));assert.ok(!Object.hasOwn(call,'policy'));assert.equal(call.insecure,false);}
 assert.ok(!JSON.stringify(result).includes(ip));assert.ok(!JSON.stringify(result).includes('synthetic airport first hop'));
});
test('risk and media reports run through original core with IP masking and current routing',async()=>{
 for(const argument of ['risk','media']){
  const {calls,result,ip}=await simulate({argument});assert.ok(result.htmlMessage);assert.ok(calls.length>6);
  assert.ok(!JSON.stringify(result).includes(ip));
  for(const call of calls){assert.ok(!Object.hasOwn(call,'node'));assert.ok(!Object.hasOwn(call,'policy'));assert.equal(call.insecure,false);}
 }
});
test('download failures and unexpected source cannot execute or expose raw errors',async()=>{
 for(const options of [{downloadError:'sensitive-example'},{downloadStatus:404},{downloadBody:'<!doctype html>'}]){
  const {calls,result}=await simulate(options);assert.equal(calls.length,1);assert.ok(result.content.includes('下载失败'));assert.ok(!JSON.stringify(result).includes('sensitive-example'));
 }
});
test('probe failure ends with a useful message without echoing endpoint details',async()=>{
 const {result,ip}=await simulate({networkError:true});assert.ok(result.content.includes('检测未完成'));assert.ok(!JSON.stringify(result).includes(ip));
});
