'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Load the exact production source, replacing only its HTML build placeholder.
const html = '<!doctype html><meta name="mars-token" content="__MARS_CSRF_TOKEN__"><script nonce="__MARS_CSRF_TOKEN__"></script>';
const source = fs.readFileSync(path.join(__dirname, '../src/main.js'), 'utf8')
  .replace('__MARS_PANEL_HTML__', JSON.stringify(html));
const context = {module: {exports: {}}};
vm.runInNewContext(source, context, {filename: 'src/main.js'});
const {createRuntime, classify, normalizeCandidates, candidatePayload, decodeBody, chatgptAssessment, probes, chatgptProbes} = context.module.exports;
const ORIGIN = 'http://mars.loon.test';
const ENTRY = '香港手动策略';
const PREFIX = 'shiina.mars-ai.v1.';
const TOKEN = 'a'.repeat(64);
const plain = value => JSON.parse(JSON.stringify(value));

async function microtasks() {
  // Enough turns for nested Promise workers without depending on wall-clock time.
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

function harness(settings = {}) {
  let time = 0, sequence = 0;
  const tasks = [];
  const outputs = [], rejections = [], calls = [], selections = [];
  const store = settings.store || new Map([[PREFIX + 'csrf', TOKEN]]);
  const model = {
    current: settings.current === undefined ? '香港 01' : settings.current,
    mode: settings.mode === undefined ? 1 : settings.mode
  };
  let active = 0, maxActive = 0;
  const schedule = (fn, delay) => {
    tasks.push({fn, at: time + delay, sequence: sequence++});
  };
  const config = {
    getConfig() {
      if (settings.throwConfig !== undefined) throw settings.throwConfig;
      return JSON.stringify({
        running_model: model.mode,
        password: 'SECRET_PASSWORD_MUST_NOT_LEAK',
        subscription: 'SECRET_SUBSCRIPTION_TOKEN_MUST_NOT_LEAK',
        ca_p12: 'SECRET_PRIVATE_KEY_MUST_NOT_LEAK',
        all_policy_groups: [{password: 'NESTED_SECRET_MUST_NOT_LEAK'}]
      });
    },
    getSelectedPolicy(group) {
      assert.equal(group, ENTRY);
      return model.current;
    },
    getSubPolicies(group, callback) {
      assert.equal(group, ENTRY);
      if (settings.noCandidatesCallback) return;
      schedule(() => {
        if (settings.beforeCandidates) settings.beforeCandidates(model);
        callback(settings.candidateText === undefined ? JSON.stringify(['香港 01', '香港 02']) : settings.candidateText);
        if (settings.duplicateCandidatesCallback) callback(JSON.stringify(['香港 99']));
      }, 2);
    },
    setSelectPolicy(group, node) {
      selections.push({group, node});
      if (settings.rejectSelection) return false;
      if (!settings.keepOldSelection) model.current = node;
      return true;
    }
  };
  const api = {
    config,
    store: {
      read(key) { return store.get(key); },
      write(value, key) {
        if (settings.rejectStore) return false;
        if (value === undefined || value === null) store.delete(key);
        else store.set(key, value);
        return true;
      }
    },
    now: () => 1700000000000 + time,
    schedule,
    http: {
      get(options, callback) {
        active++;
        maxActive = Math.max(maxActive, active);
        const item = {options, callback};
        calls.push(item);
        if (settings.http) {
          settings.http(item, {schedule, model, calls, finish: (...args) => {active--; callback(...args);}});
          return;
        }
        schedule(() => {
          active--;
          const isIP = options.url.includes('api.ipify.org');
          const isRobots = options.url.endsWith('/robots.txt');
          const isOIDC = options.url.endsWith('/.well-known/openid-configuration');
          const isIOS = options.url === 'https://ios.chat.openai.com/';
          const isAttest = options.url === 'https://register.appattest.apple.com/';
          const body = isOIDC ? JSON.stringify({issuer:'https://auth.openai.com',authorization_endpoint:'https://auth.openai.com/api/accounts/authorize'}) : isIP ? JSON.stringify({ip: options.node ? '203.0.113.8' : '198.51.100.9'}) :
            isRobots ? 'User-agent: *\nDisallow: /private' : '{"error":{"type":"authentication_error","message":"API key required"}}';
          callback(null, {status: isIP || isRobots || isOIDC ? 200 : isIOS ? 404 : isAttest ? 405 : 401}, body);
          if (settings.duplicateHttpCallback) callback('timeout', null, '');
        }, 50);
      }
    },
    done(output) {
      outputs.push(output);
      // Loon releases a script's resources at $done. Mock that lifecycle here;
      // production code does not assume a reliable clearTimeout API exists.
      tasks.length = 0;
    }
  };
  if (settings.api) Object.assign(api, settings.api);
  const runtime = createRuntime(api, html);
  function start(request) {
    runtime.run(request).catch(e => rejections.push(e));
  }
  async function settle() {
    await microtasks();
    for (let count = 0; outputs.length === 0 && count < 200; count++) {
      assert.ok(tasks.length, 'runtime stalled without a callback or completion');
      tasks.sort((a, b) => a.at - b.at || a.sequence - b.sequence);
      const task = tasks.shift();
      time = task.at;
      task.fn();
      await microtasks();
    }
    assert.equal(outputs.length, 1, 'one and only one $done call');
    return outputs[0];
  }
  async function run(request) {
    start(request);
    return settle();
  }
  return {api, run, start, settle, model, store, calls, selections, outputs, rejections,
    get maxActive() {return maxActive;}, get time() {return time;}};
}
function request(pathname, method = 'GET', body, overrides = {}) {
  return Object.assign({
    url: ORIGIN + pathname,
    method,
    headers: {'X-Mars-Token': TOKEN, Origin: ORIGIN, 'Content-Type': 'application/json'},
    body: body === undefined ? '' : JSON.stringify(body)
  }, overrides);
}
function payload(output) { return JSON.parse(output.response.body); }
function classified(id, status, body, error = null) {
  return classify(probes.concat(chatgptProbes).find(p => p.id === id), error, status === null ? null : {status}, body, 123.6);
}

test('打开面板只返回本地页面，不请求外部站点、不切换节点', async () => {
  const h = harness();
  const out = await h.run(request('/'));
  assert.equal(out.response.status, 200);
  assert.match(out.response.headers['Content-Type'], /^text\/html/);
  assert.match(out.response.headers['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.match(out.response.headers['Content-Security-Policy'], new RegExp("nonce-" + TOKEN));
  assert.ok(out.response.body.includes(TOKEN));
  assert.ok(!out.response.body.includes('__MARS_CSRF_TOKEN__'));
  assert.equal(h.calls.length, 0);
  assert.equal(h.selections.length, 0);
});

test('状态接口仅返回白名单字段，完整配置中的密码和私钥不泄漏', async () => {
  const h = harness({candidateText: JSON.stringify(['香港 01', '<img src=x onerror=alert(1)>', {name:'香港对象',type:'Shadowsocks',password:'NESTED'}, '香港 01', '\u0001bad', '', null])});
  const out = await h.run(request('/api/state'));
  const data = payload(out);
  assert.equal(out.response.status, 200);
  assert.deepEqual(data.candidates, ['香港 01', '<img src=x onerror=alert(1)>', '香港对象']);
  assert.equal(data.current, '香港 01');
  assert.equal(data.mode, 1);
  assert.equal(data.entryGroup, ENTRY);
  assert.equal(data.exitNode, 'Mars-ISP');
  assert.equal(data.chainName, 'Mars-链式');
  assert.doesNotMatch(out.response.body, /SECRET_|NESTED|ca_p12|password|subscription|all_policy_groups/);
  assert.equal(h.calls.length, 0);
  assert.equal(h.selections.length, 0);
  assert.equal(h.store.has(PREFIX + 'lease'), false);
});

test('候选规范化兼容对象name并拒绝控制字符、重复、超长名称和非数组 JSON', () => {
  assert.deepEqual(plain(normalizeCandidates(JSON.stringify(['A', 'A', 'B', '', null, {name:'C'}, 'x'.repeat(513), '\nnode']))), ['A','B','C']);
  assert.deepEqual(plain(normalizeCandidates('{"node":"A"}')), []);
  assert.deepEqual(plain(normalizeCandidates(['A'])), ['A']);
  assert.deepEqual(plain(normalizeCandidates('not json')), []);
});

const badRequests = [
  ['缺失令牌', request('/api/select','POST',{node:'香港 02',expectedCurrent:'香港 01'},{headers:{Origin:ORIGIN,'Content-Type':'application/json'}}),403,'BAD_TOKEN'],
  ['错误令牌', request('/api/state','GET',undefined,{headers:{'X-Mars-Token':'bad'}}),403,'BAD_TOKEN'],
  ['跨站 Origin', request('/api/select','POST',{node:'香港 02',expectedCurrent:'香港 01'},{headers:{'X-Mars-Token':TOKEN,Origin:'https://evil.example','Content-Type':'application/json'}}),403,'BAD_ORIGIN'],
  ['POST 没有 Origin', request('/api/select','POST',{node:'香港 02',expectedCurrent:'香港 01'},{headers:{'X-Mars-Token':TOKEN,'Content-Type':'application/json'}}),403,'BAD_ORIGIN'],
  ['简单表单 Content-Type', request('/api/select','POST',{node:'香港 02',expectedCurrent:'香港 01'},{headers:{'X-Mars-Token':TOKEN,Origin:ORIGIN,'Content-Type':'text/plain'}}),415,'BAD_CONTENT_TYPE'],
  ['GET 不得切换', request('/api/select'),405,'METHOD_NOT_ALLOWED'],
  ['POST 不得读取状态', request('/api/state','POST',{}),405,'METHOD_NOT_ALLOWED'],
  ['未知策略字段', request('/api/select','POST',{node:'香港 02',expectedCurrent:'香港 01',group:'美国手动策略'}),400,'BAD_BODY'],
  ['任意探测 URL', request('/api/check','POST',{expectedCurrent:'香港 01',url:'https://evil.example'}),400,'BAD_BODY'],
  ['非 JSON', request('/api/select','POST',undefined,{body:'bad JSON'}),400,'BAD_BODY'],
  ['超长请求', request('/api/select','POST',undefined,{body:'x'.repeat(4097)}),400,'BAD_BODY'],
  ['非面板域名', request('/api/select','POST',{node:'香港 02',expectedCurrent:'香港 01'},{url:'http://mars.loon.test.evil.example/api/select'}),404,'NOT_FOUND'],
  ['不同端口', request('/api/select','POST',{node:'香港 02',expectedCurrent:'香港 01'},{url:'http://mars.loon.test:8080/api/select'}),404,'NOT_FOUND']
];
for (const [label, req, status, code] of badRequests) {
  test('拒绝越权请求：' + label, async () => {
    const h = harness();
    const out = await h.run(req);
    assert.equal(out.response.status, status);
    assert.equal(payload(out).error.code, code);
    assert.equal(h.calls.length, 0);
    assert.equal(h.selections.length, 0);
  });
}

test('手动切换只写固定香港组，并读回确认', async () => {
  const h = harness();
  const out = await h.run(request('/api/select','POST',{node:'香港 02',expectedCurrent:'香港 01'}));
  assert.equal(out.response.status, 200);
  assert.deepEqual(h.selections, [{group:ENTRY,node:'香港 02'}]);
  assert.equal(payload(out).current, '香港 02');
  assert.equal(payload(out).previous, '香港 01');
  assert.equal(payload(out).changed, true);
  assert.match(payload(out).warning, /旧连接|原配置不会主动断开/);
  assert.equal(h.calls.length, 0);
  assert.equal(h.store.has(PREFIX + 'lease'), false);
});

test('同一节点的选择不产生重复写入', async () => {
  const h = harness();
  const out = await h.run(request('/api/select','POST',{node:'香港 01',expectedCurrent:'香港 01'}));
  assert.equal(out.response.status, 200);
  assert.equal(payload(out).changed, false);
  assert.equal(h.selections.length, 0);
});

const invalidSelections = [
  ['不在候选白名单', {}, {node:'Mars-ISP',expectedCurrent:'香港 01'},400,'NODE_NOT_ALLOWED',0],
  ['页面选择已经过期', {current:'香港 02'}, {node:'香港 01',expectedCurrent:'香港 01'},409,'STALE_SELECTION',0],
  ['节点 API 拒绝', {rejectSelection:true}, {node:'香港 02',expectedCurrent:'香港 01'},409,'SELECT_REJECTED',1],
  ['读回不匹配', {keepOldSelection:true}, {node:'香港 02',expectedCurrent:'香港 01'},409,'SELECT_UNCONFIRMED',1],
  ['读取候选期间被外部改变', {beforeCandidates:m=>{m.current='香港 03';}}, {node:'香港 02',expectedCurrent:'香港 01'},409,'STALE_SELECTION',0],
  ['候选接口不回调', {noCandidatesCallback:true}, {node:'香港 02',expectedCurrent:'香港 01'},504,'CANDIDATES_TIMEOUT',0]
];
for (const [label, settings, body, status, code, writes] of invalidSelections) {
  test('切换失败不能伪报成功：'+label, async () => {
    const h = harness(settings);
    const out = await h.run(request('/api/select','POST',body));
    assert.equal(out.response.status,status);
    assert.equal(payload(out).error.code,code);
    assert.equal(h.selections.length,writes);
    assert.equal(h.store.has(PREFIX+'lease'),false);
  });
}

test('快检恰好请求8个固定地址，最多3个并发，仅入口指定 node', async () => {
  const h = harness();
  const out = await h.run(request('/api/check','POST',{expectedCurrent:'香港 01'}));
  const data = payload(out);
  assert.equal(out.response.status,200);
  assert.equal(data.results.length,8);
  assert.equal(h.calls.length,8);
  assert.equal(h.maxActive,3);
  assert.equal(h.selections.length,0);
  assert.equal(data.stale,false);
  assert.equal(h.store.has(PREFIX+'lease'),false);
  assert.deepEqual(h.calls.map(x=>x.options.url),plain(probes.map(x=>x.url)));
  h.calls.forEach((call,index)=>{
    const o=call.options;
    assert.equal(o.insecure,false);
    assert.equal(o['binary-mode'],false);
    assert.equal(o['auto-cookie'],false);
    assert.equal(o['auto-redirect'],false);
    assert.equal(o.timeout,6500);
    assert.equal(Object.keys(o.headers).some(k=>/authorization|cookie|x-api-key|x-goog-api-key/i.test(k)),false);
    if(index===0) assert.equal(o.node,ENTRY);
    else assert.equal(Object.hasOwn(o,'node'),false);
    assert.equal(Object.hasOwn(o,'policy'),false);
    assert.equal(Object.hasOwn(o,'proxyChain'),false);
  });
  assert.equal(h.calls[4].options.headers['anthropic-version'],'2023-06-01');
  assert.match(data.summary.headline,/当前分流可达/);
  assert.match(data.summary.detail,/不构成经过每一跳/);
});

test('原生回调全部缺失时只启动3个请求，7秒停止调度并保留未运行结果', async () => {
  const h = harness({http:()=>{}});
  const out = await h.run(request('/api/check','POST',{expectedCurrent:'香港 01'}));
  const data = payload(out);
  assert.equal(out.response.status,200);
  assert.equal(h.calls.length,3);
  assert.equal(h.maxActive,3);
  assert.equal(h.time,7002);
  assert.equal(data.results.length,8);
  assert.ok(data.results.every(r=>r.outcome==='network' && r.reachable===false));
  assert.ok(data.results.slice(0,3).every(r=>/未在时限内返回回调/.test(r.detail)));
  assert.ok(data.results.slice(3).every(r=>r.title==='未运行 · 前序请求未结束' && r.latencyMs===0));
  assert.equal(data.results.filter(r=>/未运行/.test(r.title)).length,5);
  assert.ok(data.warnings.some(r=>/停止后续探测/.test(r)));
  assert.ok(data.results.every(r=>!Object.hasOwn(r,'callbackMissing')));
  assert.equal(h.store.has(PREFIX+'lease'),false);
  h.calls.forEach(call=>{
    call.callback(null,{status:200},'{"ip":"198.51.100.3"}');
    call.callback('timeout',null,'');
  });
  await microtasks();
  assert.equal(h.outputs.length,1);
  assert.equal(h.calls.length,3);
});

test('原生接口正常返回超时错误时继续剩余探测，保持最多3个并发', async () => {
  const h = harness({http:(item,ctx)=>ctx.schedule(()=>ctx.finish('request timeout',null,''),6500)});
  const out = await h.run(request('/api/check','POST',{expectedCurrent:'香港 01'}));
  const data = payload(out);
  assert.equal(out.response.status,200);
  assert.equal(h.calls.length,8);
  assert.equal(h.maxActive,3);
  assert.equal(h.time,19502);
  assert.equal(data.results.length,8);
  assert.ok(data.results.every(r=>r.outcome==='network' && r.reachable===false));
  assert.ok(data.results.every(r=>!/未运行/.test(r.title)));
  assert.equal(data.warnings.some(r=>/停止后续探测/.test(r)),false);
  assert.equal(h.store.has(PREFIX+'lease'),false);
});

test('重复原生回调不会重复完成脚本或覆盖已收到的结果', async () => {
  const h = harness({duplicateHttpCallback:true});
  const out = await h.run(request('/api/check','POST',{expectedCurrent:'香港 01'}));
  assert.equal(h.outputs.length,1);
  assert.equal(payload(out).results.filter(r=>r.outcome==='network').length,0);
});

test('候选 callback 重复只采用第一次结果', async () => {
  const h = harness({duplicateCandidatesCallback:true});
  const out = await h.run(request('/api/state'));
  assert.deepEqual(payload(out).candidates,['香港 01','香港 02']);
  assert.equal(h.outputs.length,1);
});

test('快检期间入口被外部切换，结果标记 stale', async () => {
  const h = harness({http:(item,ctx)=>ctx.schedule(()=>{
    ctx.model.current='香港 02';
    ctx.finish(null,{status:401},'{"error":{"message":"API key required"}}');
  },50)});
  const out = await h.run(request('/api/check','POST',{expectedCurrent:'香港 01'}));
  assert.equal(payload(out).stale,true);
  assert.match(payload(out).summary.detail,/已过期/);
});

test('快检期间运行模式变化，结果标记 stale', async () => {
  const h = harness({http:(item,ctx)=>ctx.schedule(()=>{
    ctx.model.mode=0;
    ctx.finish(null,{status:401},'{}');
  },50)});
  const out=await h.run(request('/api/check','POST',{expectedCurrent:'香港 01'}));
  assert.equal(payload(out).stale,true);
});

for(const mode of [0,2,null]) {
  test('非分流模式 '+mode+' 不能报告已验证 Mars 分流',async()=>{
    const h=harness({mode});
    const out=await h.run(request('/api/check','POST',{expectedCurrent:'香港 01'}));
    const data=payload(out);
    assert.match(data.summary.headline,/无法验证/);
    assert.ok(data.warnings.some(x=>/不是分流模式/.test(x)));
  });
}

test('在检查期间第二个实例不能写入策略；结束后释放租约',async()=>{
  const shared=new Map([[PREFIX+'csrf',TOKEN]]);
  const first=harness({store:shared});
  first.start(request('/api/check','POST',{expectedCurrent:'香港 01'}));
  await microtasks();
  const second=harness({store:shared});
  const out=await second.run(request('/api/select','POST',{node:'香港 02',expectedCurrent:'香港 01'}));
  assert.equal(out.response.status,409);
  assert.equal(payload(out).error.code,'BUSY');
  assert.equal(second.selections.length,0);
  await first.settle();
  assert.equal(shared.has(PREFIX+'lease'),false);
});

test('读取候选超时不会阻塞状态页，返回明确警告',async()=>{
  const h=harness({noCandidatesCallback:true});
  const out=await h.run(request('/api/state'));
  assert.equal(out.response.status,200);
  assert.deepEqual(payload(out).candidates,[]);
  assert.equal(payload(out).candidateDiagnostics.reason,'callback_timeout');
  assert.ok(payload(out).warnings.some(x=>/callback_timeout/.test(x)));
  assert.equal(h.time,2400);
});

test('Generic 手动入口运行快检并提供面板地址，不改变节点',async()=>{
  const h=harness();
  const out=await h.run(null);
  assert.equal(h.calls.length,8);
  assert.match(out.title,/Mars AI/);
  assert.ok(out.content.includes(ORIGIN+'/'));
  assert.equal(h.selections.length,0);
});

const classifications=[
  ['401 表示HTTP已达且需鉴权','openai-api',401,'{"error":{"message":"Missing key"}}','auth',true],
  ['普通403不冒称地域限制','claude-api',403,'{"error":{"type":"permission_error","message":"Forbidden"}}','restricted',true],
  ['429区分限流或额度','openai-api',429,'{"error":{"code":"insufficient_quota"}}','limited',true],
  ['529区分服务过载','claude-api',529,'{"error":{"type":"overloaded_error"}}','server',true],
  ['跳转不直接当目标成功','gemini-web',302,'','redirect',true],
  ['空200替换体不能通过','openai-api',200,'{}','unexpected',true],
  ['IP空200替换体不能通过','route-ip',200,'{}','unexpected',true],
  ['200挑战页不能通过','chatgpt-web',200,'<html><title>Just a moment</title><script>cf-chl-x</script></html>','unexpected',true],
  ['robots正常内容','chatgpt-web',200,'User-agent: *\nDisallow: /','ok',true],
  ['OpenAI模型目录','openai-api',200,'{"object":"list","data":[]}','ok',true],
  ['Claude模型目录','claude-api',200,'{"data":[],"has_more":false}','ok',true],
  ['Gemini模型目录','gemini-api',200,'{"models":[]}','ok',true],
  ['正常IP结果','route-ip',200,'{"ip":"198.51.100.14"}','ok',true],
  ['不合法IP','route-ip',200,'{"ip":"999.1.2.3"}','unexpected',true],
  ['网络超时','openai-api',null,'','network',false]
];
for(const [label,id,status,body,outcome,reachable] of classifications) {
  test('HTTP分类：'+label,()=>{
    const r=classified(id,status,body,status===null?'timeout':null);
    assert.equal(r.outcome,outcome);
    assert.equal(r.reachable,reachable);
    assert.equal(r.latencyMs,124);
    if(status===403) assert.equal(r.title,'HTTP 可达 · 请求被拒绝');
    if(id==='route-ip' && outcome==='ok') assert.equal(r.ip,'198.51.100.14');
  });
}

test('只有明确结构化地域错误才能标为服务报告地域受限',()=>{
  const openai=classified('openai-api',403,'{"error":{"code":"unsupported_country_region_territory","message":"Blocked"}}');
  const google=classified('gemini-api',400,'{"error":{"message":"User location is not supported for the API use."}}');
  assert.equal(openai.title,'服务明确报告地域受限');
  assert.equal(google.title,'服务明确报告地域受限');
  const ordinary=classified('openai-api',403,'{"error":{"message":"Please select a country and region in your account"}}');
  assert.notEqual(ordinary.title,'服务明确报告地域受限');
});

test('收到状态但正文传输报错仍区分为不完整响应',()=>{
  const r=classified('openai-api',200,'{"data":[]}','TLS connection terminated');
  assert.equal(r.reachable,true);
  assert.equal(r.outcome,'unexpected');
  assert.match(r.title,/传输未完整结束/);
});

test('原始网络错误中的敏感字串不会进入输出',()=>{
  const r=classified('openai-api',null,'','socks authentication failed password=DO_NOT_LEAK');
  assert.doesNotMatch(JSON.stringify(r),/DO_NOT_LEAK|password=/);
});

test('非标准 null 异常应立即被安全归一化，不等待总超时',async()=>{
  const h=harness({throwConfig:null});
  const out=await h.run(request('/api/state'));
  assert.equal(out.response.status,500);
  assert.equal(payload(out).error.code,'INTERNAL_ERROR');
  assert.equal(h.rejections.length,0);
  assert.ok(h.time<30000);
});

// v1.0.2 regressions: candidate API shapes observed on phones, byte bodies,
// and a ChatGPT iOS profile whose result must never imply successful login.
test('对象候选只提取name，诊断只保留结构和数量，不返回type或secret',async()=>{
  const raw=[
    {name:'香港 01',type:'Shadowsocks',secret:'CANDIDATE_SECRET_1',server:'PRIVATE_SERVER_1'},
    {name:'香港 02',type:'VMess',password:'CANDIDATE_SECRET_2'},
    {name:'香港 02',type:'Trojan',password:'CANDIDATE_SECRET_3'},
    {name:42,secret:'CANDIDATE_SECRET_4'},
    {policy:'禁止推断此字段',secret:'CANDIDATE_SECRET_5'}
  ];
  const h=harness({candidateText:JSON.stringify(raw)});
  const out=await h.run(request('/api/state'));
  const data=payload(out);
  assert.deepEqual(data.candidates,['香港 01','香港 02']);
  assert.deepEqual(data.candidateDiagnostics,{api:'getSubPolicies',shape:'json:array<object>',count:2,rawCount:5,reason:'ok'});
  assert.doesNotMatch(out.response.body,/CANDIDATE_SECRET|PRIVATE_SERVER|Shadowsocks|VMess|Trojan|禁止推断/);
});

for(const [label,raw,expected] of [
  ['直接对象数组',[{name:'香港 01',secret:'never-export'}],['香港 01']],
  ['直接字符串数组',['香港 01','香港 02'],['香港 01','香港 02']],
  ['BOM JSON','\uFEFF'+JSON.stringify([{name:'香港 01'}]),['香港 01']],
  ['双层 JSON',JSON.stringify(JSON.stringify([{name:'香港 01'}])),['香港 01']],
  ['policies 外层',{policies:[{name:'香港 01'}]},['香港 01']],
  ['subPolicies 外层',{subPolicies:['香港 01']},['香港 01']],
  ['sub_policies 外层',{sub_policies:[{name:'香港 01'}]},['香港 01']],
  ['nodes 外层',{nodes:[{name:'香港 01'}]},['香港 01']],
  ['未承诺外层不递归推断',{credentials:[{name:'香港 01'}]},[]],
  ['不把整个单对象当节点',{name:'香港 01',password:'never-export'},[]]
]) {
  test('候选结构兼容：'+label,()=>{
    assert.deepEqual(plain(normalizeCandidates(raw)),expected);
  });
}

test('对象候选仍可用于真实切换白名单，不需要字符串数组',async()=>{
  const h=harness({candidateText:JSON.stringify([{name:'香港 01',type:'SS',secret:'never'},{name:'香港 02',type:'SS',secret:'never'}])});
  const out=await h.run(request('/api/select','POST',{node:'香港 02',expectedCurrent:'香港 01'}));
  assert.equal(out.response.status,200);
  assert.deepEqual(h.selections,[{group:ENTRY,node:'香港 02'}]);
  assert.doesNotMatch(out.response.body,/secret|never/);
});

test('getSubPolicies的this绑定保留为$config',async()=>{
  const h=harness();
  let called=false;
  h.api.config.getSubPolicies=function(group,callback){
    assert.equal(this,h.api.config);
    assert.equal(group,ENTRY);
    called=true;
    callback(JSON.stringify([{name:'香港 01'}]));
  };
  const out=await h.run(request('/api/state'));
  assert.equal(called,true);
  assert.equal(payload(out).candidateDiagnostics.reason,'ok');
  assert.deepEqual(payload(out).candidates,['香港 01']);
});

for(const primary of ['missing','empty','throws','timeout']) {
  test('主候选API '+primary+' 时回退getSubPolicys并保留this',async()=>{
    const h=harness();
    let fallbackCalls=0;
    if(primary==='missing')delete h.api.config.getSubPolicies;
    if(primary==='empty')h.api.config.getSubPolicies=function(group,callback){callback('[]');};
    if(primary==='throws')h.api.config.getSubPolicies=function(){throw new Error('PRIVATE_NATIVE_ERROR');};
    if(primary==='timeout')h.api.config.getSubPolicies=function(){};
    h.api.config.getSubPolicys=function(group,callback){
      assert.equal(this,h.api.config);
      assert.equal(group,ENTRY);
      fallbackCalls++;
      callback(JSON.stringify([{name:'香港 02',secret:'DO_NOT_EXPORT'}]));
    };
    const out=await h.run(request('/api/state'));
    assert.equal(out.response.status,200);
    assert.deepEqual(payload(out).candidates,['香港 02']);
    assert.equal(payload(out).candidateDiagnostics.api,'getSubPolicys');
    assert.equal(payload(out).candidateDiagnostics.reason,'ok');
    assert.equal(fallbackCalls,1);
    assert.doesNotMatch(out.response.body,/PRIVATE_NATIVE_ERROR|DO_NOT_EXPORT/);
    if(primary==='timeout')assert.equal(h.time,2400);
  });
}

test('两个候选API别名指向同一函数时不重复调用',async()=>{
  const h=harness();
  let calls=0;
  const same=function(group,callback){calls++;callback('[]');};
  h.api.config.getSubPolicies=same;
  h.api.config.getSubPolicys=same;
  const out=await h.run(request('/api/state'));
  assert.equal(calls,1);
  assert.deepEqual(payload(out).candidates,[]);
  assert.equal(payload(out).candidateDiagnostics.reason,'empty_or_unrecognized_items');
});

test('完全没有候选API时状态页返回可导出诊断而非泄漏配置',async()=>{
  const h=harness();
  delete h.api.config.getSubPolicies;
  const out=await h.run(request('/api/state'));
  assert.equal(out.response.status,200);
  assert.deepEqual(payload(out).candidateDiagnostics,{api:'none',shape:'unavailable',count:0,rawCount:0,reason:'API_UNAVAILABLE'});
  assert.doesNotMatch(out.response.body,/SECRET_|PRIVATE_/);
});

test('快检摘要带候选结构诊断，空候选不妨碍HTTP排查',async()=>{
  const h=harness({candidateText:JSON.stringify({unrecognized:{secret:'CANDIDATE_PRIVATE'}})});
  const out=await h.run(request('/api/check','POST',{expectedCurrent:'香港 01'}));
  const data=payload(out);
  assert.equal(out.response.status,200);
  assert.equal(h.calls.length,8);
  assert.equal(data.candidateDiagnostics.count,0);
  assert.equal(data.candidateDiagnostics.shape,'json:object');
  assert.equal(data.candidateDiagnostics.reason,'unrecognized_shape');
  assert.ok(data.warnings.some(x=>/候选读取/.test(x)));
  assert.doesNotMatch(out.response.body,/CANDIDATE_PRIVATE|unrecognized.*secret/);
});

const ipJSON=JSON.stringify({ip:'198.51.100.14'});
const byteBody=Uint8Array.from(Buffer.from(ipJSON));
const arrayBufferBody=byteBody.buffer.slice(byteBody.byteOffset,byteBody.byteOffset+byteBody.byteLength);
const padded=Uint8Array.from([9,9,...byteBody,9]);
for(const [label,data,response,bodyType,format,sourceName] of [
  ['Uint8Array',byteBody,{status:200},'Uint8Array','json','data'],
  ['ArrayBuffer',arrayBufferBody,{status:200},'ArrayBuffer','json','data'],
  ['DataView带偏移',new DataView(padded.buffer,2,byteBody.length),{status:200},'DataView','json','data'],
  ['字节数组',Array.from(byteBody),{status:200},'byte-array','json','data'],
  ['UTF8字节BOM',Uint8Array.from(Buffer.from('\uFEFF'+ipJSON)),{status:200},'Uint8Array','json','data'],
  ['字符串BOM','\uFEFF'+ipJSON,{status:200},'string','json','data'],
  ['纯IP',' 198.51.100.14\n',{status:200},'string','plain-ip','data'],
  ['JSON字符串IP','"198.51.100.14"',{status:200},'string','json','data'],
  ['防御性JSON对象',{ip:'198.51.100.14',secret:'BODY_PRIVATE'},{status:200},'object','json-object','data'],
  ['response.body回退',undefined,{status:200,body:ipJSON},'string','json','response.body'],
  ['null回退response.body',null,{status:200,body:byteBody},'Uint8Array','json','response.body'],
  ['兼容statusCode',ipJSON,{statusCode:200},'string','json','data']
]) {
  test('IP正文兼容：'+label,()=>{
    const r=classify(probes.find(p=>p.id==='route-ip'),null,response,data,7);
    assert.equal(r.outcome,'ok');
    assert.equal(r.ip,'198.51.100.14');
    assert.equal(r.evidence.bodyType,bodyType);
    assert.equal(r.evidence.bodyFormat,format);
    assert.equal(r.evidence.bodySource,sourceName);
    assert.doesNotMatch(JSON.stringify(r),/BODY_PRIVATE/);
  });
}

test('IP不从HTML或错误文字里猜测提取，IPv6只接受完整字面量',()=>{
  for(const body of ['<html>198.51.100.14</html>','error 198.51.100.14','{"ip":1234}','2001:::1']) {
    const r=classified('route-ip',200,body);
    assert.equal(r.outcome,'unexpected');
    assert.equal(Object.hasOwn(r,'ip'),false);
  }
  assert.equal(classified('route-ip',200,'2001:db8::1').ip,'2001:db8::1');
});

test('空200正文依旧不是IP或认证探测成功',()=>{
  for(const data of ['',new Uint8Array(),{},'{}',undefined]) {
    assert.equal(classified('route-ip',200,data).outcome,'unexpected');
    assert.equal(classified('chatgpt-auth',200,data).outcome,'unexpected');
  }
});

test('响应格式证据保留类型/长度/白名单字段，不导出正文或任意头',()=>{
  const response={status:400,headers:{
    'Content-Type':'application/json; charset=utf-8; private=HEADER_PRIVATE',
    'Content-Encoding':'gzip\r\nPRIVATE_ENCODING',
    'Set-Cookie':'session=COOKIE_PRIVATE',
    'Authorization':'Bearer HEADER_PRIVATE',
    'X-Custom':'CUSTOM_PRIVATE'
  }};
  const body=JSON.stringify({ip:{secret:'IP_PRIVATE'},error:{code:'invalid_api_key',message:'MESSAGE_PRIVATE'},password:'BODY_PRIVATE',unlisted:'EXTRA_PRIVATE'});
  const r=classify(probes.find(p=>p.id==='openai-api'),null,response,body,10);
  assert.equal(r.evidence.bodyType,'string');
  assert.equal(r.evidence.bodyBytes,Buffer.byteLength(body));
  assert.equal(r.evidence.bodyFormat,'json');
  assert.equal(r.evidence.contentType,'application/json');
  assert.equal(r.evidence.contentEncoding,'');
  assert.deepEqual(plain(r.evidence.fields),['ip','error']);
  assert.equal(r.evidence.ipType,'object');
  assert.equal(r.evidence.errorCode,'invalid_api_key');
  assert.doesNotMatch(JSON.stringify(r),/_PRIVATE|password|unlisted|Set-Cookie|Authorization|X-Custom/);
  assert.equal(Object.hasOwn(r,'body'),false);
  assert.equal(Object.hasOwn(r,'headers'),false);
});

test('乱码与未解压gzip字节只提供格式证据，不假装已读到正文',()=>{
  const invalid=classified('route-ip',200,Uint8Array.from([0xc3,0x28]));
  assert.equal(invalid.outcome,'unexpected');
  assert.equal(invalid.evidence.bodyFormat,'non-utf8-bytes');
  const gzip=classify(probes[1],null,{status:200,headers:{'content-encoding':'gzip'}},Uint8Array.from([31,139,8,0,1]),10);
  assert.equal(gzip.outcome,'unexpected');
  assert.equal(gzip.evidence.bodyFormat,'gzip-bytes');
  assert.equal(gzip.evidence.bodyBytes,5);
  assert.equal(gzip.evidence.contentEncoding,'gzip');
});

test('字节正文中的中文与BOM按UTF8解析，字节统计准确',()=>{
  const body='\uFEFF'+JSON.stringify({ip:'198.51.100.14',message:'中文🌏',secret:'PRIVATE_UTF8'});
  const r=classified('route-ip',200,Uint8Array.from(Buffer.from(body)));
  assert.equal(r.ip,'198.51.100.14');
  assert.equal(r.evidence.bodyBytes,Buffer.byteLength(body));
  assert.doesNotMatch(JSON.stringify(r),/PRIVATE_UTF8|中文|🌏/);
});

for(const badProfile of ['unknown','CHATGPT','https://evil.example',null,1,{},[]]) {
  test('拒绝未允许的检测profile：'+JSON.stringify(badProfile),async()=>{
    const h=harness();
    const out=await h.run(request('/api/check','POST',{expectedCurrent:'香港 01',profile:badProfile}));
    assert.equal(out.response.status,400);
    assert.equal(payload(out).error.code,'BAD_PROFILE');
    assert.equal(h.calls.length,0);
    assert.equal(h.selections.length,0);
    assert.equal(h.store.has(PREFIX+'lease'),false);
  });
}

test('ChatGPT专项恰好7个固定目标，保留隐私与并发限制',async()=>{
  const h=harness();
  const out=await h.run(request('/api/check','POST',{expectedCurrent:'香港 01',profile:'chatgpt'}));
  const data=payload(out);
  assert.equal(out.response.status,200);
  assert.equal(data.version,'1.0.2');
  assert.equal(data.profile,'chatgpt');
  assert.equal(data.probeCount,7);
  assert.equal(data.results.length,7);
  assert.equal(h.calls.length,7);
  assert.equal(h.maxActive,3);
  assert.deepEqual(h.calls.map(c=>c.options.url),[
    'https://api.ipify.org?format=json',
    'https://api.ipify.org?format=json',
    'https://api.openai.com/v1/models',
    'https://chatgpt.com/robots.txt',
    'https://ios.chat.openai.com/',
    'https://auth.openai.com/.well-known/openid-configuration',
    'https://register.appattest.apple.com/'
  ]);
  for(let i=0;i<h.calls.length;i++) {
    const o=h.calls[i].options;
    assert.equal(o['binary-mode'],false);
    assert.equal(o['auto-cookie'],false);
    assert.equal(o['auto-redirect'],false);
    assert.equal(o.insecure,false);
    assert.equal(Object.hasOwn(o,'policy'),false);
    assert.equal(Object.hasOwn(o,'proxyChain'),false);
    if(i===0)assert.equal(o.node,ENTRY);
    else assert.equal(Object.hasOwn(o,'node'),false);
    assert.equal(Object.keys(o.headers).some(k=>/authorization|cookie|x-api-key|x-goog-api-key/i.test(k)),false);
  }
  assert.equal(data.candidateDiagnostics.count,2);
  assert.match(data.summary.headline,/App 状态仍待核对/);
  assert.match(data.summary.detail,/未验证登录、证书固定、设备证明和 WebSocket/);
  assert.doesNotMatch(JSON.stringify(data.summary),/登录正常|对话正常|App正常|App 正常|登录成功|设备验证通过/);
  assert.equal(h.selections.length,0);
});

test('默认检测仍是all八项，不隐式变为ChatGPT专项',async()=>{
  const h=harness();
  const out=await h.run(request('/api/check','POST',{expectedCurrent:'香港 01'}));
  const data=payload(out);
  assert.equal(data.profile,'all');
  assert.equal(data.probeCount,8);
  assert.equal(Object.hasOwn(data.summary,'chatgpt'),false);
});

const validOIDC={issuer:'https://auth.openai.com',authorization_endpoint:'https://auth.openai.com/api/accounts/authorize'};
test('OIDC只在正确issuer及授权域名组合下成功，支持字节正文',()=>{
  const r=classified('chatgpt-auth',200,Uint8Array.from(Buffer.from(JSON.stringify(validOIDC))));
  assert.equal(r.outcome,'ok');
  assert.equal(r.title,'认证服务公开配置有效');
  assert.match(r.detail,/没有登录/);
});
for(const [label,json] of [
  ['只有issuer',{issuer:'https://auth.openai.com'}],
  ['错误issuer',{...validOIDC,issuer:'https://evil.example'}],
  ['伪子域名',{...validOIDC,authorization_endpoint:'https://auth.openai.com.evil.example/authorize'}],
  ['userinfo伪装',{...validOIDC,authorization_endpoint:'https://auth.openai.com@evil.example/authorize'}],
  ['不安全HTTP',{...validOIDC,authorization_endpoint:'http://auth.openai.com/api/accounts/authorize'}],
  ['模型目录冒充OIDC',{data:[]}]
]) {
  test('OIDC元数据不符合预期：'+label,()=>{
    assert.equal(classified('chatgpt-auth',200,JSON.stringify(json)).outcome,'unexpected');
  });
}

for(const id of ['chatgpt-ios','apple-attest']) {
  for(const status of [404,405]) {
    test(id+'根路径返回'+status+'只说明域名有响应，不报App真实业务失败',()=>{
      const r=classified(id,status,'');
      assert.equal(r.reachable,true);
      assert.equal(r.outcome,'unexpected');
      assert.match(r.title,/域名已响应/);
      assert.match(r.detail,/不代表 App 的真实业务请求失败/);
    });
  }
}

test('OpenAI API401和robots成功不能掩盖iOS域名未完成',()=>{
  const results=[
    classified('openai-api',401,'{}'),
    classified('chatgpt-web',200,'User-agent: *\nDisallow: /'),
    classified('chatgpt-ios',null,'','TLS error'),
    classified('chatgpt-auth',200,JSON.stringify(validOIDC)),
    classified('apple-attest',404,'')
  ];
  const assessment=chatgptAssessment(results);
  assert.equal(assessment.headline,'ChatGPT iOS 域名探测未完成');
  assert.match(assessment.detail,/OpenAI API 有响应不能替代/);
});

test('认证元数据无效或App Attest无响应分别给出限定诊断',()=>{
  const ios=classified('chatgpt-ios',404,'');
  const authOK=classified('chatgpt-auth',200,JSON.stringify(validOIDC));
  const authBad=classified('chatgpt-auth',200,'{}');
  const attestOK=classified('apple-attest',405,'');
  const attestBad=classified('apple-attest',null,'','timeout');
  assert.match(chatgptAssessment([ios,authBad,attestOK]).headline,/认证服务需要复查/);
  const second=chatgptAssessment([ios,authOK,attestBad]);
  assert.match(second.headline,/App Attest 连接需要复查/);
  assert.match(second.detail,/不把根路径响应当作设备证明结果/);
});

test('ChatGPT专项所有HTTP请求有响应仍不能宣称App登录或对话可用',()=>{
  const results=[classified('chatgpt-ios',200,''),classified('chatgpt-auth',200,JSON.stringify(validOIDC)),classified('apple-attest',204,'')];
  const assessment=chatgptAssessment(results);
  assert.match(assessment.headline,/App 状态仍待核对/);
  assert.match(assessment.detail,/未验证登录、证书固定、设备证明和 WebSocket 对话/);
  assert.equal(chatgptAssessment([classified('openai-api',401,'{}')]),null);
});

for(const mode of [0,2]) {
  test('ChatGPT专项在模式'+mode+'下不覆盖分流模式警告',async()=>{
    const h=harness({mode});
    const out=await h.run(request('/api/check','POST',{expectedCurrent:'香港 01',profile:'chatgpt'}));
    assert.match(payload(out).summary.headline,/无法验证/);
    assert.ok(payload(out).warnings.some(x=>/不是分流模式/.test(x)));
  });
}

test('ChatGPT专项遇到候选读取延迟和原生无回调仍有界，不堆积请求',async()=>{
  const h=harness({noCandidatesCallback:true,http:()=>{}});
  const out=await h.run(request('/api/check','POST',{expectedCurrent:'香港 01',profile:'chatgpt'}));
  const data=payload(out);
  assert.equal(out.response.status,200);
  assert.equal(h.time,9400);
  assert.equal(h.calls.length,3);
  assert.equal(h.maxActive,3);
  assert.equal(data.results.length,7);
  assert.equal(data.results.filter(r=>/未运行/.test(r.title)).length,4);
  assert.equal(data.candidateDiagnostics.reason,'callback_timeout');
  assert.equal(h.store.has(PREFIX+'lease'),false);
});
