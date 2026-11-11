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
const {createRuntime, classify, normalizeCandidates, probes} = context.module.exports;
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
          const body = isIP ? JSON.stringify({ip: options.node ? '203.0.113.8' : '198.51.100.9'}) :
            isRobots ? 'User-agent: *\nDisallow: /private' : '{"error":{"type":"authentication_error","message":"API key required"}}';
          callback(null, {status: isIP || isRobots ? 200 : 401}, body);
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
  return classify(probes.find(p => p.id === id), error, status === null ? null : {status}, body, 123.6);
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
  const h = harness({candidateText: JSON.stringify(['香港 01', '<img src=x onerror=alert(1)>', {name:'secret',password:'NESTED'}, '香港 01', '\u0001bad', '', null])});
  const out = await h.run(request('/api/state'));
  const data = payload(out);
  assert.equal(out.response.status, 200);
  assert.deepEqual(data.candidates, ['香港 01', '<img src=x onerror=alert(1)>']);
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

test('候选规范化拒绝对象、控制字符、重复、超长名称和非数组 JSON', () => {
  assert.deepEqual(plain(normalizeCandidates(JSON.stringify(['A', 'A', 'B', '', null, {name:'C'}, 'x'.repeat(513), '\nnode']))), ['A','B']);
  assert.deepEqual(plain(normalizeCandidates('{"node":"A"}')), []);
  assert.deepEqual(plain(normalizeCandidates(['A'])), []);
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
  assert.equal(h.time,7000);
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
  assert.equal(h.time,19500);
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
  assert.ok(payload(out).warnings.some(x=>/超时/.test(x)));
  assert.equal(h.time,1800);
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
