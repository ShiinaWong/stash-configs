/*
 * Minimal DOM simulation for panel interaction logic. Uses only Node built-ins.
 * This does not render CSS or verify a browser/iPhone. All values below are fixtures.
 * Run: node tests/panel-dom.test.cjs
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../src/panel.html'), 'utf8');
const script = html.match(/<script nonce="__MARS_CSRF_TOKEN__">([\s\S]*?)<\/script>/)[1];
new vm.Script(script);

class Element {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.listeners = {};
    this.value = '';
    this.textContent = '';
    this.className = '';
    this.hidden = false;
    this.disabled = false;
    this.open = false;
    this.classList = {
      toggle: (name, present) => {
        const names = this.className.split(/\s+/).filter(value => value && value !== name);
        if (present) names.push(name);
        this.className = names.join(' ');
      },
      remove: name => { this.className = this.className.split(/\s+/).filter(value => value !== name).join(' '); }
    };
  }
  get firstChild() { return this.children[0] || null; }
  get childNodes() { return this.children; }
  appendChild(node) {
    this.children.push(node);
    node.parentNode = this;
    if (this.tagName === 'select' && this.children.length === 1) this.value = node.value;
    return node;
  }
  removeChild(node) {
    this.children.splice(this.children.indexOf(node), 1);
    if (this.tagName === 'select' && this.value === node.value) this.value = this.children[0] ? this.children[0].value : '';
  }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  focus() {}
  select() {}
  setSelectionRange() {}
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
}

const nodes = {};
for (const match of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*?\bid="([^"]+)"[^>]*>/g)) {
  const node = new Element(match[1]);
  node.disabled = /\bdisabled\b/.test(match[0]);
  node.hidden = /\bhidden\b/.test(match[0]);
  nodes[match[2]] = node;
}
const document = {
  getElementById: id => nodes[id],
  querySelector: () => ({ content: 'fixture-csrf-token' }),
  createElement: tag => new Element(tag),
  addEventListener() {},
  execCommand: () => false,
  body: new Element('body')
};
const copied = [];
const navigator = { clipboard: { writeText: async value => { copied.push(value); } } };
const calls = [];
let state = {
  ok: true, version: '1.0.2', chainName: 'Mars-链式', entryGroup: '香港手动策略', exitNode: 'Mars-ISP',
  current: '香港 A', candidates: [], mode: 1, modeLabel: '分流模式', warnings: [], busy: false,
  candidateDiagnostics: { api: 'getSubPolicies', shape: 'object', count: 0, reason: 'unrecognized_shape' },
  privateConfiguration: 'PRIVATE_CONFIGURATION'
};
let delayCheck = false;
let releaseCheck;

function fixtureResults(profile) {
  const ids = profile === 'chatgpt'
    ? ['entry-ip','route-ip','openai-api','chatgpt-web','chatgpt-ios','chatgpt-auth','apple-attest']
    : ['entry-ip','route-ip','openai-api','chatgpt-web','claude-api','gemini-api','google-web','endpoint-trace'];
  return ids.map((id, index) => ({
    id, label: id, scope: index === 0 ? 'entry' : 'route',
    httpStatus: index === 2 ? 401 : 200, latencyMs: 120 + index, reachable: true,
    outcome: index === 2 ? 'auth' : index === 3 ? 'unexpected' : 'ok',
    title: index === 2 ? 'HTTP 已响应，需要鉴权' : index === 3 ? '收到非预期页面' : 'HTTP 已响应',
    detail: '这是一段模拟的重复说明，仅应在折叠详情或完整导出中出现。'.repeat(8),
    ...(index < 2 ? { ip: index === 0 ? '192.0.2.12' : '203.0.113.24' } : {}),
    evidence: {
      bodyType: 'string', bodyFormat: index === 3 ? 'html' : 'json', bodyBytes: 145 + index,
      contentType: index === 3 ? 'text/html' : 'application/json', bodySource: 'response.body',
      ...(index < 2 ? { country: 'US', asn: 64500 } : {}),
      requestId: 'fixture-request-id', rawBody: 'PRIVATE_RESPONSE_BODY', authorization: 'PRIVATE_AUTHORIZATION'
    }
  }));
}

async function fetchMock(url, options) {
  assert.match(url, /^\/api\/(state|check|select)$/);
  assert.equal(options.headers['X-Mars-Token'], 'fixture-csrf-token');
  assert.equal(options.credentials, 'omit');
  calls.push({ url, method: options.method, body: options.body });
  let payload;
  if (url === '/api/state') payload = structuredClone(state);
  if (url === '/api/check') {
    const input = JSON.parse(options.body);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.equal(input.expectedCurrent, state.current);
    assert.ok(input.profile === 'all' || input.profile === 'chatgpt');
    if (delayCheck) await new Promise(resolve => { releaseCheck = resolve; });
    const results = fixtureResults(input.profile);
    payload = {
      ok: true, current: state.current, mode: state.mode, profile: input.profile, stale: false,
      startedAt: '2026-11-11T10:00:00Z', finishedAt: '2026-11-11T10:00:03Z', probeCount: results.length,
      candidateDiagnostics: { api: 'getSubPolicies', shape: 'object-array:name', count: 3, reason: 'ok' },
      summary: { headline: '模拟结论：需要继续核对 App 连接', detail: '模拟完整解释。'.repeat(80) },
      results, warnings: ['模拟提示一','模拟提示一','模拟提示二','API401不代表ChatGPT App可用。']
    };
  }
  if (url === '/api/select') {
    const input = JSON.parse(options.body);
    assert.equal(options.method, 'POST');
    assert.equal(input.expectedCurrent, state.current);
    assert.ok(state.candidates.includes(input.node));
    const previous = state.current;
    state.current = input.node;
    payload = { ok: true, previous, current: state.current, changed: true, warning: '' };
  }
  return { ok: true, json: async () => structuredClone(payload) };
}

vm.runInNewContext(script, {
  document, navigator, fetch: fetchMock, AbortController, Promise, Date, Math, JSON, Array, Object,
  String, Error, TypeError, isFinite, isNaN, setTimeout, clearTimeout, console
});

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const click = id => nodes[id].listeners.click();
const descendants = node => [node, ...node.children.flatMap(descendants)];
const classNodes = name => descendants(nodes['result-groups']).filter(node => node.className === name);
const summaryMetrics = value => ({ lines: value.split('\n').length, characters: Array.from(value).length, utf16Length: value.length });

(async () => {
  await tick();
  assert.deepEqual(calls.map(call => call.url), ['/api/state']);
  assert.equal(nodes['copy-button'].disabled, false);
  assert.equal(nodes['select-button'].disabled, true);
  assert.equal(nodes['candidate-details'].open, true);
  assert.match(nodes['candidate-diagnostics'].textContent, /unrecognized_shape/);
  assert.doesNotMatch(nodes['node-select'].children[0].textContent, /没有.*节点|没有可用/);
  await click('copy-button');
  const beforeCheck = copied.at(-1);
  assert.match(beforeCheck, /未检查/);
  assert.match(beforeCheck, /unrecognized_shape/);
  assert.equal(calls.filter(call => call.url === '/api/check').length, 0);

  state.candidates = ['香港 A', '香港 B', '<script>not executed</script>'];
  state.candidateDiagnostics = { api: 'getSubPolicies', shape: 'state-later-shape', count: 99, reason: 'ok' };
  await click('refresh-button');
  assert.equal(nodes['node-select'].children[2].textContent, '<script>not executed</script>');
  assert.equal(nodes['node-select'].children[2].children.length, 0);

  delayCheck = true;
  const checking = click('check-button');
  await tick();
  for (const id of ['check-button','gpt-button','refresh-button','select-button','copy-button','copy-full-button']) assert.equal(nodes[id].disabled, true);
  releaseCheck();
  await checking;
  delayCheck = false;
  assert.equal(classNodes('result-item').length, 8);
  assert.ok(classNodes('result-item').every(node => node.tagName === 'details' && !node.open));
  assert.ok(classNodes('result-item').every(node => node.children[0].tagName === 'summary'));
  assert.ok(classNodes('result-badge').some(node => node.textContent === '可达 · 需鉴权'));
  await click('copy-button');
  const aiSummary = copied.at(-1);
  assert.match(aiSummary, /AI快检\(all\)/);
  assert.match(aiSummary, /候选：3.*object-array:name/);
  assert.doesNotMatch(aiSummary, /state-later-shape/);
  assert.match(aiSummary, /US AS64500/);
  assert.match(aiSummary, /\[体:string\/html/);
  assert.equal(aiSummary.split('\n').filter(line => /^(入|路)\//.test(line)).length, 8);
  assert.equal(aiSummary.split('\n').filter(line => line.startsWith('提示：')).length, 2);
  assert.equal(aiSummary.split('API401不代表ChatGPT App可用。').length - 1, 1);
  assert.ok(aiSummary.length <= 1800);
  assert.ok(aiSummary.split('\n').length >= 15 && aiSummary.split('\n').length <= 22);
  assert.doesNotMatch(aiSummary, /PRIVATE_|fixture-csrf-token|模拟的重复说明/);

  await click('gpt-button');
  assert.equal(JSON.parse(calls.filter(call => call.url === '/api/check').at(-1).body).profile, 'chatgpt');
  assert.equal(classNodes('result-item').length, 7);
  await click('copy-button');
  const gptSummary = copied.at(-1);
  assert.match(gptSummary, /GPT专项\(chatgpt\)/);
  assert.match(gptSummary, /chatgpt-ios/);
  assert.match(gptSummary, /chatgpt-auth/);
  assert.match(gptSummary, /apple-attest/);
  assert.equal(gptSummary.split('\n').filter(line => /^(入|路)\//.test(line)).length, 7);
  assert.ok(gptSummary.length <= 1800);
  assert.doesNotMatch(html, /正在检查\s*8|一轮\s*8/);

  await click('copy-full-button');
  const full = copied.at(-1);
  assert.match(full, /模拟的重复说明/);
  assert.match(full, /requestId: fixture-request-id/);
  assert.doesNotMatch(full, /PRIVATE_|fixture-csrf-token/);

  nodes['node-select'].value = '香港 B';
  nodes['node-select'].listeners.change();
  await click('select-button');
  assert.equal(nodes['current-node'].textContent, '香港 B');
  assert.equal(nodes['summary-title'].textContent, '这份结果已过期');
  assert.ok(classNodes('result-badge').every(node => node.textContent === '旧结果'));
  navigator.clipboard = undefined;
  await click('copy-button');
  assert.equal(nodes['copy-modal'].hidden, false);
  assert.match(nodes['copy-text'].value, /已过期/);
  assert.ok(nodes['copy-text'].value.length <= 1800);

  console.log(JSON.stringify({
    passed: true,
    verification: 'Node syntax and minimal DOM simulation only; no CSS/browser/iPhone verification',
    fixtures: { beforeCheck: summaryMetrics(beforeCheck), aiEightProbes: summaryMetrics(aiSummary), chatgptSevenProbes: summaryMetrics(gptSummary) },
    checks: ['state-only copy with empty candidates','candidate diagnostics preferred from check','compact closed details','AI/GPT profile requests','token and expectedCurrent guards','one-line probe summaries','bounded short copy','evidence allowlist','stale after selection','HTTP clipboard fallback']
  }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
