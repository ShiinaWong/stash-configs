/* Mars AI 链路快检 1.0.1
 * Built for: Mars-链式 = 香港手动策略,Mars-ISP
 * This file never reads node credentials or changes routing rules.
 * API references: https://nsloon.app/docs/Script/script_api/
 */
(function () {
  'use strict';
  var PANEL_HTML = __MARS_PANEL_HTML__;
  var VERSION = '1.0.1';
  var ORIGIN = 'http://mars.loon.test';
  var ENTRY = '香港手动策略';
  var EXIT = 'Mars-ISP';
  var CHAIN = 'Mars-链式';
  var PREFIX = 'shiina.mars-ai.v1.';
  var REQUEST_TIMEOUT = 6500;
  var PROBES = [
    {id:'entry-ip', label:'香港入口单测', scope:'entry', kind:'ip', url:'https://api.ipify.org?format=json'},
    {id:'route-ip', label:'当前分流出口', scope:'route', kind:'ip', url:'https://api.ipify.org?format=json'},
    {id:'openai-api', label:'OpenAI API', scope:'route', kind:'openai', url:'https://api.openai.com/v1/models'},
    {id:'chatgpt-web', label:'ChatGPT 网页域名', scope:'route', kind:'robots', url:'https://chatgpt.com/robots.txt'},
    {id:'claude-api', label:'Claude API', scope:'route', kind:'anthropic', url:'https://api.anthropic.com/v1/models'},
    {id:'claude-web', label:'Claude 网页域名', scope:'route', kind:'robots', url:'https://claude.ai/robots.txt'},
    {id:'gemini-api', label:'Gemini API', scope:'route', kind:'google', url:'https://generativelanguage.googleapis.com/v1beta/models'},
    {id:'gemini-web', label:'Gemini 网页域名', scope:'route', kind:'robots', url:'https://gemini.google.com/robots.txt'}
  ];

  function fault(code, message, status) {
    var e = new Error(message);
    e.code = code; e.status = status || 400;
    return e;
  }
  function parseJSON(s) { try { return JSON.parse(s); } catch (_) { return null; } }
  function header(headers, name) {
    var keys = Object.keys(headers || {});
    for (var i=0;i<keys.length;i++) if (keys[i].toLowerCase() === name.toLowerCase()) return String(headers[keys[i]]);
    return '';
  }
  function normalizeCandidates(text) {
    var value = typeof text === 'string' ? parseJSON(text) : null;
    if (!Array.isArray(value)) return [];
    var seen = Object.create(null);
    return value.filter(function (x) {
      if (typeof x !== 'string' || !x.trim() || x.length > 512 || /[\u0000-\u001f]/.test(x) || seen[x]) return false;
      seen[x] = true; return true;
    }).slice(0,1000);
  }
  function validIP(ip) {
    // The supplied profile is IPv4-only, and api.ipify.org is the IPv4 endpoint.
    if (typeof ip !== 'string' || !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) return false;
    return ip.split('.').every(function (x) { return Number(x) <= 255; });
  }
  function networkMessage(error) {
    var e = String(error || '').toLowerCase();
    if (/timeout|timed out|超时/.test(e)) return '请求超时；本轮不自动重试。';
    if (/certificate|ssl|tls|证书/.test(e)) return 'TLS 或证书校验失败；检查设备时间、代理连接和解密配置。';
    if (/dns|resolve|name.*found|解析/.test(e)) return '域名解析未完成；检查当前 DNS 和分流。';
    if (/407|socks|authentication|认证/.test(e)) return '代理连接或认证未完成；需结合 Loon 请求记录定位。';
    return '未完成 HTTP 请求；可能涉及网络、入口、Mars 或目标服务，单次结果无法定位具体一跳。';
  }
  function classify(probe, error, response, data, latencyMs) {
    var status = response && Number(response.status);
    var r = {id:probe.id,label:probe.label,scope:probe.scope,url:probe.url,
      httpStatus:status >= 100 && status <= 599 ? status : null,
      latencyMs:Math.max(0,Math.round(latencyMs)),reachable:false,outcome:'network',title:'未完成 HTTP 探测',detail:''};
    if (!r.httpStatus) { r.detail = networkMessage(error); return r; }
    r.reachable = true;
    if (error) {
      r.outcome='unexpected'; r.title='已收到 HTTP 状态，传输未完整结束'; r.detail=networkMessage(error); return r;
    }
    var text = typeof data === 'string' ? data.slice(0,65536) : '';
    var json = parseJSON(text);
    var err = json && json.error && typeof json.error === 'object' ? json.error : {};
    var code = [err.code,err.type,err.status].filter(function (v) { return typeof v==='string'; }).join(' ').toLowerCase();
    var message = typeof err.message === 'string' ? err.message.toLowerCase() : '';
    var regional = /(?:^|\s)(?:unsupported_country_region_territory|region_not_supported|country_not_supported)(?:$|\s)/.test(code) ||
      /country, region,? or territory not supported|user location is not supported for the api use|your country is not supported/.test(message);
    if (regional) {
      r.outcome='restricted'; r.title='服务明确报告地域受限';
      r.detail='已收到目标响应；当前服务返回了明确的地区限制错误。切换前置入口未必改变 Mars 最终出口。'; return r;
    }
    if (status===401) {
      r.outcome='auth'; r.title='HTTP 可达 · 需要鉴权';
      r.detail='本探测没有发送账号或 API 密钥。401 证明收到 HTTP 响应，不证明账号、模型或完整网页可用。'; return r;
    }
    if (status===403) {
      r.outcome='restricted'; r.title='HTTP 可达 · 请求被拒绝';
      r.detail=/cloudflare|cf-chl-|challenge-platform|just a moment|captcha/i.test(text) ?
        '返回了风控或挑战页面；不能仅据此判断地区不支持，也不表示代理完全不通。' :
        '可能是未提供密钥、权限、风控或访问策略；未发现明确地域错误，不能判断为地区封锁。'; return r;
    }
    if (status===429) {
      r.outcome='limited'; r.title='HTTP 可达 · 限流或额度限制'; r.detail='请求已有响应；限速、配额或风控原因需在对应服务中确认。'; return r;
    }
    if (status>=500) {
      r.outcome='server'; r.title='已响应 · 服务端异常'; r.detail='目标服务或中间网关返回 '+status+'；不能仅据此认定香港入口故障。'; return r;
    }
    if (status>=300 && status<400) {
      r.outcome='redirect'; r.title='HTTP 可达 · 返回跳转'; r.detail='为控制请求数量，本次没有继续跟随跳转；最终页面尚未验证。'; return r;
    }
    if (status>=200 && status<300) {
      if (probe.kind==='ip' && json && validIP(json.ip)) {
        r.outcome='ok'; r.title='已取得出口 IP'; r.ip=json.ip;
        r.detail=probe.scope==='entry' ? '强制使用“香港手动策略”单测，仅代表前置入口。' : '沿用当前路由；你的配置预期由 api.ipify.org 规则进入 Mars-链式。'; return r;
      }
      var expected = probe.kind==='robots' ? /(?:^|\n)\s*(?:user-agent|disallow|allow|sitemap)\s*:/i.test(text) && !/<html|cf-chl-|challenge-platform/i.test(text) :
        json && ((probe.kind==='openai' || probe.kind==='anthropic') ? Array.isArray(json.data) : probe.kind==='google' && Array.isArray(json.models));
      if (expected) {
        r.outcome='ok'; r.title='HTTP 可达 · 响应符合预期';
        r.detail=probe.kind==='robots' ? '只验证 robots.txt；登录、对话、上传和流式输出尚未验证。' : '模型目录端点有正常响应；没有调用生成接口，也未验证账号权限。'; return r;
      }
      r.outcome='unexpected'; r.title='已响应 · 内容不符合预期';
      r.detail='HTTP '+status+' 但未得到预期内容；可能是挑战页、空响应、拦截替换或端点变化，不能当作检查通过。'; return r;
    }
    r.outcome='unexpected'; r.title='HTTP 可达 · 需确认服务返回';
    r.detail='收到 HTTP '+status+'；没有完成业务操作，可能需要鉴权、其他方法或不同端点。'; return r;
  }
  function summarize(results, mode, stale) {
    var entry=results.filter(function(r){return r.id==='entry-ip';})[0];
    var exit=results.filter(function(r){return r.id==='route-ip';})[0];
    var ai=results.filter(function(r){return r.kind!=='ip' && r.id!=='entry-ip' && r.id!=='route-ip';});
    var reachable=ai.filter(function(r){return r.reachable;}).length;
    if(stale) return {headline:'检查期间入口或模式发生变化',detail:'本轮结果已过期，不能用于评价当前选择；请重新检查。'};
    if(mode!==1) return {headline:'当前模式无法验证预期的 Mars 分流',detail:'请在 Loon 使用分流模式，再重新检查。以下结果只反映本轮当前路由。'};
    if(exit && exit.ip && reachable===ai.length) {
      var limited=ai.some(function(r){return r.outcome!=='ok' && r.outcome!=='auth';});
      if(entry && !entry.ip) return {headline:'出口与 AI 已响应，入口单测需复查',detail:'入口 IP 查询没有有效结果；单个探测服务的差异不能证明香港入口断开。'};
      return {headline:limited?'出口已连通，部分 AI 响应需确认':'当前分流可达，AI HTTP 探测有响应',detail:'已取得当前出口 IP；服务响应不等于账号可用，也不构成经过每一跳的直接证据。'};
    }
    if(exit && exit.ip) return {headline:'已取得出口 IP，部分 AI 探测未完成',detail:'优先查看失败服务的状态；若只有单个域名失败，检查其分流命中、服务状态和限制。'};
    if(reachable>0) return {headline:'部分 AI 已响应，出口查询未确认',detail:'IP 查询失败不等于整条网络中断；结合下方各服务结果和 Loon 请求记录定位。'};
    if(entry && entry.ip) return {headline:'入口单测正常，当前分流请求未完成',detail:'重点检查 Mars-ISP 连通性、链式配置与规则命中；本结果仍不能直接确定故障在哪一跳。'};
    return {headline:'本轮未取得有效出口或 AI 响应',detail:'先检查网络、Loon 运行模式和香港入口；也可能是超时或多个目标服务暂时无响应。'};
  }

  function createRuntime(api, panelHTML) {
    var finished=false, leaseId=null;
    var now=api.now || Date.now;
    function requireConfig() {
      if(!api.config || typeof api.config.getSelectedPolicy!=='function' || typeof api.config.getConfig!=='function')
        throw fault('API_UNAVAILABLE','Loon 配置 API 不可用；请确认由 Loon 运行脚本并检查版本。',503);
    }
    function current() { requireConfig(); var v=api.config.getSelectedPolicy(ENTRY); return typeof v==='string'?v:''; }
    function mode() {
      requireConfig();
      var c=parseJSON(api.config.getConfig() || '{}');
      var m=c && c.running_model;
      return m===0 || m===1 || m===2 ? m : null;
    }
    function modeLabel(m) { return m===1?'分流模式':m===0?'全局直连':m===2?'全局代理':'模式未知'; }
    function storageRead(key) {
      if(!api.store || typeof api.store.read!=='function' || typeof api.store.write!=='function')
        throw fault('STORAGE_UNAVAILABLE','Loon 本地存储 API 不可用，无法启动面板保护。',503);
      return api.store.read(PREFIX+key);
    }
    function storageWrite(key,value) {
      storageRead(key);
      if(api.store.write(value,PREFIX+key)!==true) throw fault('STORAGE_FAILED','Loon 本地存储写入失败，请稍后重新打开面板。',503);
    }
    function nonce() {
      // Origin checking and a custom header are the primary CSRF protections.
      // This is a per-installation anti-CSRF nonce, not a cryptographic login key.
      var v=''; for(var i=0;i<8;i++) v+=Math.floor(Math.random()*0x100000000).toString(16).padStart(8,'0');
      return v;
    }
    function token() {
      var v=storageRead('csrf');
      if(typeof v==='string' && /^[a-f0-9]{64}$/.test(v)) return v;
      v=nonce(); storageWrite('csrf',v); return v;
    }
    function busy() {
      var l=parseJSON(storageRead('lease') || 'null');
      return !!(l && typeof l.until==='number' && l.until>now());
    }
    function acquire() {
      if(busy()) throw fault('BUSY','另一个检查或切换仍在运行；请等待完成，异常中断后最多 40 秒自动解锁。',409);
      leaseId=nonce(); storageWrite('lease',JSON.stringify({id:leaseId,until:now()+40000}));
      var actual=parseJSON(storageRead('lease') || 'null');
      if(!actual || actual.id!==leaseId) { leaseId=null; throw fault('BUSY','另一个操作已先开始，请稍后再试。',409); }
    }
    function release() {
      if(!leaseId) return;
      try {
        var l=parseJSON(storageRead('lease') || 'null');
        if(l && l.id===leaseId) api.store.write(undefined,PREFIX+'lease');
      } catch(_) {}
      leaseId=null;
    }
    function complete(payload) {
      if(finished) return;
      finished=true; release(); api.done(payload);
    }
    function headers(type,nonceValue) {
      var h={'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
      if(nonceValue) h['Content-Security-Policy']="default-src 'none'; script-src 'nonce-"+nonceValue+"'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
      return h;
    }
    function jsonResponse(status,payload) { return {response:{status:status,headers:headers('application/json'),body:JSON.stringify(payload)}}; }
    function verifyRequest(request) {
      if(header(request.headers,'X-Mars-Token')!==token()) throw fault('BAD_TOKEN','页面令牌失效，请刷新面板后重试。',403);
      var origin=header(request.headers,'Origin');
      if(origin && origin!==ORIGIN) throw fault('BAD_ORIGIN','拒绝跨站请求。',403);
      if(request.method==='POST') {
        if(origin!==ORIGIN) throw fault('BAD_ORIGIN','写入操作必须来自本面板；请在 Safari 重新打开面板。',403);
        if(!/^application\/json(?:\s*;|$)/i.test(header(request.headers,'Content-Type'))) throw fault('BAD_CONTENT_TYPE','只接受 JSON 请求。',415);
      }
    }
    function bodyJSON(request,allowed) {
      if(typeof request.body!=='string' || request.body.length>4096) throw fault('BAD_BODY','请求格式不正确或内容过长。');
      var body=parseJSON(request.body);
      if(!body || typeof body!=='object' || Array.isArray(body) || Object.keys(body).some(function(k){return allowed.indexOf(k)<0;})) throw fault('BAD_BODY','请求字段不正确。');
      return body;
    }
    function sameSelection(expected) {
      var c=current();
      if(typeof expected!=='string' || expected!==c) throw fault('STALE_SELECTION','当前入口已变化；请先刷新状态，再执行操作。',409);
      if(!c) throw fault('GROUP_MISSING','未找到“香港手动策略”的当前选择，请检查主配置和订阅。',409);
      return c;
    }
    function candidates() {
      return new Promise(function(resolve,reject) {
        var settled=false;
        function finish(err,value) { if(settled || finished) return; settled=true; if(err) reject(err); else resolve(value); }
        api.schedule(function(){finish(fault('CANDIDATES_TIMEOUT','读取入口候选超时；请确认策略组名称、Loon 版本和订阅状态。',504));},1800);
        if(!api.config || typeof api.config.getSubPolicies!=='function') {finish(fault('API_UNAVAILABLE','当前 Loon 不提供候选读取接口。',503));return;}
        try {api.config.getSubPolicies(ENTRY,function(text){finish(null,normalizeCandidates(text));});}
        catch(_) {finish(fault('CANDIDATES_FAILED','读取入口候选失败；请检查策略组和 Loon 版本。',503));}
      });
    }
    async function state() {
      var c=current(),m=mode(),list=[],warnings=[];
      try { list=await candidates(); } catch(e) { warnings.push(e.message); }
      if(!c) warnings.push('未取得香港手动策略的当前选项；请检查主配置中的策略组。');
      if(!list.length) warnings.push('未取得可选节点；手动切换暂不可用。');
      if(m!==1) warnings.push('当前为'+modeLabel(m)+'，不能用现有 AI 分流规则验证预期的 Mars 链路。');
      return {ok:true,version:VERSION,panelUrl:ORIGIN+'/',chainName:CHAIN,entryGroup:ENTRY,exitNode:EXIT,current:c,candidates:list,mode:m,modeLabel:modeLabel(m),warnings:warnings,busy:busy()};
    }
    function probe(spec) {
      return new Promise(function(resolve) {
        var settled=false,start=now();
        function finish(error,response,data,callbackMissing) {
          if(settled || finished) return; settled=true;
          var result=classify(spec,error,response,data,now()-start);
          if(callbackMissing) {
            result.callbackMissing=true;
            result.detail='HTTP 接口未在时限内返回回调，已停止调度后续探测。请稍后重试并检查 Loon 运行状态。';
          }
          if(result.ip && api.utils) {
            var details=[];
            [['geoip','地区'],['ipasn','ASN'],['ipaso','网络']].forEach(function(pair){
              try {
                if(typeof api.utils[pair[0]]==='function') {
                  var v=api.utils[pair[0]](result.ip);
                  if((typeof v==='string' || typeof v==='number') && String(v).length<160) details.push(pair[1]+'：'+v);
                }
              } catch(_) {}
            });
            if(details.length) result.detail+=' 本地数据库：'+details.join(' · ')+'（仅供核对）。';
          }
          resolve(result);
        }
        var opts={url:spec.url,timeout:REQUEST_TIMEOUT,headers:{'Accept':spec.kind==='robots'?'text/plain,*/*;q=0.1':'application/json','Cache-Control':'no-cache','Pragma':'no-cache','Connection':'close'},'auto-redirect':false,'auto-cookie':false,insecure:false};
        if(spec.scope==='entry') opts.node=ENTRY;
        if(spec.kind==='anthropic') opts.headers['anthropic-version']='2023-06-01';
        api.schedule(function(){finish('request timeout',null,'',true);},REQUEST_TIMEOUT+500);
        try {api.http.get(opts,finish);} catch(_) {finish('request failed',null,'');}
      });
    }
    async function check(expected) {
      var startCurrent=sameSelection(expected),startMode=mode();
      if(!api.http || typeof api.http.get!=='function') throw fault('HTTP_UNAVAILABLE','Loon HTTP 脚本接口不可用。',503);
      acquire();
      var startedAt=new Date(now()).toISOString();
      var results=new Array(PROBES.length),next=0,callbackMissing=false;
      async function worker() {
        while(next<PROBES.length && !finished && !callbackMissing) {
          var i=next++;
          results[i]=await probe(PROBES[i]);
          if(results[i].callbackMissing) { callbackMissing=true; delete results[i].callbackMissing; }
        }
      }
      await Promise.all([worker(),worker(),worker()]);
      if(finished) return null;
      PROBES.forEach(function(spec,i){
        if(!results[i]) {
          results[i]=classify(spec,'request timeout',null,'',0);
          results[i].title='未运行 · 前序请求未结束';
          results[i].detail='为避免堆积连接，HTTP 接口失去回调后不再启动后续请求。请先检查 Loon 运行状态。';
        }
      });
      var stale=current()!==startCurrent || mode()!==startMode;
      var warnings=['出口与 AI 检查沿用当前路由；脚本无法直接证明每一跳或读取实际命中规则。','本轮不带账号、Cookie 或 API 密钥；没有调用对话生成接口。'];
      if(callbackMissing) warnings.unshift('部分 HTTP 接口未按时返回回调，已停止后续探测，避免继续堆积连接。');
      if(startMode!==1) warnings.unshift('当前不是分流模式，结果不能用于验证预期的 Mars 分流。');
      if(stale) warnings.unshift('检查过程中入口或运行模式改变，本轮结果已过期。');
      if(results[0].ip && results[1].ip && results[0].ip===results[1].ip) warnings.push('入口与当前分流出口 IP 相同：请核对 Mars 出口和请求记录；相同 IP 本身不能证明代理链被绕过。');
      return {ok:true,startedAt:startedAt,finishedAt:new Date(now()).toISOString(),current:startCurrent,mode:startMode,stale:stale,summary:summarize(results,startMode,stale),results:results,warnings:warnings};
    }
    async function select(body) {
      var previous=sameSelection(body.expectedCurrent);
      if(typeof body.node!=='string' || body.node.length>512) throw fault('BAD_NODE','请选择有效的入口节点。');
      acquire();
      var list=await candidates();
      if(list.indexOf(body.node)<0) throw fault('NODE_NOT_ALLOWED','目标不在“香港手动策略”的当前候选中；请刷新节点列表。',400);
      sameSelection(previous);
      if(body.node!==previous) {
        if(!api.config || typeof api.config.setSelectPolicy!=='function') throw fault('API_UNAVAILABLE','当前 Loon 不提供节点切换接口。',503);
        if(api.config.setSelectPolicy(ENTRY,body.node)!==true) throw fault('SELECT_REJECTED','Loon 未接受切换；请检查候选节点是否仍存在。',409);
        if(current()!==body.node) throw fault('SELECT_UNCONFIRMED','已发出切换，但尚未读回目标节点；请刷新状态确认，勿连续重复切换。',409);
      }
      return {ok:true,previous:previous,current:current(),changed:body.node!==previous,warning:'切换会影响所有复用“香港手动策略”的流量。原配置不会主动断开旧连接；请重新检查，必要时重开 AI App。Mars-ISP 末端保持原配置。'};
    }
    async function dispatch(request) {
      if(!request) {
        var c=current();
        if(!c) throw fault('GROUP_MISSING','未找到香港手动策略，请检查主配置。',409);
        var result=await check(c);
        if(!result) return null;
        var lines=[result.summary.headline,result.summary.detail,'入口：'+result.current,'模式：'+modeLabel(result.mode),''];
        result.results.forEach(function(r){lines.push(r.label+'：'+r.title+' · '+(r.httpStatus===null?'无 HTTP 响应':'HTTP '+r.httpStatus)+' · '+r.latencyMs+' ms'+(r.ip?' · '+r.ip:''));});
        lines.push('','打开面板切换节点：'+ORIGIN+'/','时间：'+result.finishedAt,'检查按当前路由运行，不是逐跳证明。');
        return {title:'Mars AI 链路快检',content:lines.join('\n')};
      }
      var match=/^http:\/\/mars\.loon\.test(?::80)?(\/[^?#]*)?(?:\?[^#]*)?$/i.exec(String(request.url || ''));
      if(!match) return jsonResponse(404,{ok:false,error:{code:'NOT_FOUND',message:'非面板地址。'}});
      var path=match[1] || '/';
      var method=String(request.method || 'GET').toUpperCase();
      request={url:request.url,method:method,headers:request.headers || {},body:request.body};
      if(path==='/' && method==='GET') {
        var t=token();
        return {response:{status:200,headers:headers('text/html',t),body:panelHTML.split('__MARS_CSRF_TOKEN__').join(t)}};
      }
      if(path==='/favicon.ico' && method==='GET') return {response:{status:204,headers:headers('text/plain'),body:''}};
      if(['/api/state','/api/check','/api/select'].indexOf(path)<0) throw fault('NOT_FOUND','没有这个接口。',404);
      if((path==='/api/state' && method!=='GET') || (path!=='/api/state' && method!=='POST')) throw fault('METHOD_NOT_ALLOWED','请求方法不支持。',405);
      verifyRequest(request);
      if(path==='/api/state') return jsonResponse(200,await state());
      if(path==='/api/check') {
        var body=bodyJSON(request,['expectedCurrent']);
        var checked=await check(body.expectedCurrent);
        return checked ? jsonResponse(200,checked) : null;
      }
      return jsonResponse(200,await select(bodyJSON(request,['node','expectedCurrent'])));
    }
    async function run(request) {
      api.schedule(function(){
        if(finished) return;
        var e={ok:false,error:{code:'RUN_TIMEOUT',message:'本轮运行超过 30 秒，已结束。请检查 Loon 日志和网络后再试。'}};
        complete(request?jsonResponse(504,e):{title:'Mars AI 快检未完成',content:e.error.message});
      },30000);
      try {var payload=await dispatch(request); if(payload) complete(payload);}
      catch(e) {
        if(!e || (typeof e!=='object' && typeof e!=='function')) e={};
        var error={code:e.code || 'INTERNAL_ERROR',message:e.code?e.message:'脚本未完成，请检查 Loon 版本、主配置和脚本日志。'};
        complete(request?jsonResponse(e.status || 500,{ok:false,error:error}):{title:'Mars AI 快检未完成',content:error.message});
      }
    }
    return {run:run};
  }

  if(typeof module!=='undefined' && module.exports) {
    module.exports={createRuntime:createRuntime,classify:classify,summarize:summarize,normalizeCandidates:normalizeCandidates,probes:PROBES,version:VERSION};
    return;
  }
  var api={
    config:typeof $config==='undefined'?null:$config,
    store:typeof $persistentStore==='undefined'?null:$persistentStore,
    http:typeof $httpClient==='undefined'?null:$httpClient,
    utils:typeof $utils==='undefined'?null:$utils,
    schedule:function(fn,ms){setTimeout(fn,ms);},
    done:function(payload){$done(payload);}
  };
  createRuntime(api,PANEL_HTML).run(typeof $request==='undefined'?null:$request);
})();
