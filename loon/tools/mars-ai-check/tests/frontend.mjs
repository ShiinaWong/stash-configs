// Real panel + mocked Loon runtime. No external network or user configuration.
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()] }));
const root = new URL('../',import.meta.url);
const code = await readFile(new URL('../../scripts/mars-ai-check-v1.0.1.js',root),'utf8');
const artifactDir = new URL('tests/artifacts/',root);
await mkdir(artifactDir,{recursive:true});
const store = new Map();
let selected='香港 HK 01 · 测试节点', mode=1, requests=0, writes=0;
const names=[selected,'香港 HK 02 · 测试节点','香港 <img src=x onerror=alert(1)>'];
const routes=[],pageErrors=[],external=[];
function loon(request) {
  return new Promise((resolve,reject)=>{
    const timers=[];
    let calls=0;
    const context={
      $request:request,
      $config:{
        getConfig:()=>JSON.stringify({running_model:mode,privateValue:'NEVER_SHOW_THIS'}),
        getSelectedPolicy:()=>selected,
        getSubPolicies:(_name,cb)=>cb(JSON.stringify(names)),
        setSelectPolicy:(name,node)=>{assert.equal(name,'香港手动策略');assert(names.includes(node));selected=node;writes++;return true;}
      },
      $persistentStore:{read:key=>store.get(key),write:(value,key)=>{value==null?store.delete(key):store.set(key,value);return true;}},
      $httpClient:{get:(options,cb)=>{
        requests++;
        assert.equal(options.insecure,false);
        assert.equal(options['auto-cookie'],false);
        let status=200,body='User-agent: *\nDisallow: /private\n';
        if(options.url.includes('ipify'))body=JSON.stringify({ip:options.node?'198.51.100.7':'203.0.113.14'});
        else if(options.url.includes('api.openai.com') || options.url.includes('api.anthropic.com')){status=401;body=JSON.stringify({error:{message:'API key required'}});}
        else if(options.url.includes('generativelanguage')){status=403;body=JSON.stringify({error:{message:'Unregistered callers are not allowed',status:'PERMISSION_DENIED'}});}
        const t=setTimeout(()=>cb(null,{status,headers:{}},body),60);timers.push(t);
      }},
      $done:payload=>{calls++;assert.equal(calls,1);timers.forEach(clearTimeout);resolve(payload);},
      setTimeout:(fn,ms)=>{const t=setTimeout(fn,ms);timers.push(t);return t;},
      console
    };
    try{vm.runInNewContext(code,context,{timeout:1000});}catch(e){timers.forEach(clearTimeout);reject(e);}
  });
}
const executablePath=process.env.MARS_BROWSER_PATH || (existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
const browser=await chromium.launch({headless:true,executablePath});
try {
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1});
 const page=await context.newPage();
 page.on('pageerror',e=>pageErrors.push(e.message));
 await page.route('**/*',async route=>{
  const r=route.request();routes.push(r.url());
  if(!r.url().startsWith('http://mars.loon.test/')){external.push(r.url());return route.abort();}
  const output=await loon({url:r.url(),method:r.method(),headers:await r.allHeaders(),body:r.postData() || ''});
  assert(output.response);
  await route.fulfill({status:output.response.status,headers:output.response.headers,body:output.response.body});
 });
 await page.goto('http://mars.loon.test/');
 await page.waitForFunction(()=>document.querySelector('#current-node').textContent.includes('HK 01'));
 assert.equal(requests,0,'Opening the panel must not start probes');
 assert.equal(writes,0,'Opening the panel must not change the node');
 assert.equal(await page.locator('#node-select option').count(),3);
 assert.equal(await page.locator('img').count(),0,'Node names must not become HTML');
 const overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
 assert.equal(await overflow(),false,'390px viewport must not overflow');
 await page.screenshot({path:new URL('mars-phone-initial.png',artifactDir).pathname,fullPage:true});
 await page.locator('#check-button').click();
 assert(await page.locator('#select-button').isDisabled(),'Disable switching during a check');
 await page.waitForFunction(()=>!document.querySelector('#results-content').hidden && document.querySelector('#check-button').disabled===false);
 assert.equal(requests,8,'Exactly eight requests per round');
 assert((await page.locator('#result-groups').textContent()).includes('需要鉴权'));
 assert((await page.locator('#result-groups').textContent()).includes('203.0.113.14'));
 assert.equal(await page.locator('#result-groups').textContent().then(t=>t.includes('NEVER_SHOW_THIS')),false);
 await page.screenshot({path:new URL('mars-phone-results.png',artifactDir).pathname,fullPage:true});
 await page.locator('#node-select').selectOption(names[1]);
 await page.locator('#select-button').click();
 await page.waitForFunction(()=>document.querySelector('#current-node').textContent.includes('HK 02'));
 assert.equal(writes,1);
 assert.equal(requests,8,'Switching must not silently start another probe round');
 assert.match(await page.locator('#summary-state').textContent(),/过期|重新/);
 // Force HTTP clipboard fallback; the visible textarea must include a stale marker.
 await page.evaluate(()=>{document.execCommand=()=>false;});
 await page.locator('#copy-button').click();
 await page.waitForFunction(()=>!document.querySelector('#copy-modal').hidden);
 assert.match(await page.locator('#copy-text').inputValue(),/过期/);
 await page.locator('#copy-close').click();
 // A refresh after a native mode change must not present old checks as fresh.
 mode=0;
 await page.locator('#refresh-button').click();
 await page.waitForFunction(()=>document.querySelector('#mode-label').textContent.includes('全局直连'));
 assert.match(await page.locator('#state-warnings').textContent(),/分流/);
 assert.equal(requests,8);
 await page.setViewportSize({width:320,height:568});
 assert.equal(await overflow(),false,'320px viewport must not overflow');
 await page.screenshot({path:new URL('mars-phone-small.png',artifactDir).pathname,fullPage:true});
 await page.setViewportSize({width:1024,height:768});
 assert.equal(await overflow(),false,'Desktop viewport must not overflow');
 assert.deepEqual(pageErrors,[]);
 assert.deepEqual(external,[],'Panel UI must not load remote resources');
 console.log(JSON.stringify({result:'PASS',probeRequests:requests,nodeChanges:writes,viewportWidths:[320,390,1024],pageErrors,externalResources:external,screenshots:3},null,2));
 await context.close();
}finally{await browser.close();}
