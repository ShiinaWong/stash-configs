"""Static checks for the public starter; no network access or credentials."""
import copy
import ipaddress
from pathlib import Path
import unittest
import yaml

ROOT = Path(__file__).resolve().parent
BASE = 'https://raw.githubusercontent.com/ShiinaWong/stash-configs/main/egern/public/rules/'


class UniqueLoader(yaml.SafeLoader):
    pass


def mapping(loader, node, deep=False):
    result = {}
    for key, value in node.value:
        key = loader.construct_object(key, deep=deep)
        if key in result:
            raise ValueError('duplicate YAML key')
        result[key] = loader.construct_object(value, deep=deep)
    return result


UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, mapping)


def load(path):
    return yaml.load(path.read_text(), Loader=UniqueLoader)


def chain(config):
    assert 'auto_update' not in config
    proxies = {next(iter(r.values()))['name']: r for r in config['proxies']}
    assert set(proxies) == {'Upstream-A', 'Mars-via-A'}
    assert 'shadowsocks' in proxies['Upstream-A']
    assert not proxies['Upstream-A']['shadowsocks'].get('prev_hop')
    assert proxies['Mars-via-A']['socks5']['prev_hop'] == 'Upstream-A'
    assert config['policy_groups'] == [{'select': {
        'name': 'AI-Mars', 'policies': ['Mars-via-A'], 'block_quic': True}}]
    assert config['rules'][-1]['default']['policy'] == 'AI-Mars'
    for entry in config['proxies']:
        p = next(iter(entry.values()))
        assert p['udp_relay'] is False and p['block_quic'] is True
    assert config['modules'] == [] and config['mitm']['hostnames']['includes'] == []


def matches(rule, host, protocol, port, sets, ip=''):
    key, body = next(iter(rule.items()))
    if body.get('disabled'):
        return False
    value = body.get('match')
    if key == 'default': return True
    if key == 'domain': return host == value
    if key == 'domain_suffix': return host == value or host.endswith('.'+value)
    if key == 'domain_keyword': return value in host
    if key == 'protocol': return protocol == value or (value == 'udp' and protocol in ('stun', 'quic'))
    if key == 'dest_port': return str(port) == value
    if key == 'and': return all(matches(r, host, protocol, port, sets, ip) for r in value)
    if key == 'or': return any(matches(r, host, protocol, port, sets, ip) for r in value)
    if key == 'ip_cidr':
        return bool(ip) and ipaddress.ip_address(ip) in ipaddress.ip_network(value)
    if key == 'rule_set':
        data = sets.get(value, {})
        return any(matches({k.removesuffix('_set'): {'match': v}}, host, protocol, port, sets, ip)
                   for k, values in data.items() for v in values)
    raise AssertionError('unsupported fixture rule: '+key)


def route(config, sets, host, protocol='https', port=443):
    return next(next(iter(r.values()))['policy'] for r in config['rules']
                if matches(r, host, protocol, port, sets))


class PublicLinkTests(unittest.TestCase):
    def setUp(self):
        self.config = load(ROOT/'Egern.yaml')
        self.sets = {BASE+p.name: load(p) for p in (ROOT/'rules').glob('*.yaml')}

    def test_public_structure_and_references(self):
        chain(self.config)
        examples = [('shadowsocks', '198.51.100.1', 'REPLACE_UPSTREAM_A_PASSWORD'),
                    ('socks5', '192.0.2.1', 'REPLACE_MARS_PASSWORD')]
        for entry, (kind, server, password) in zip(self.config['proxies'], examples):
            self.assertEqual(entry[kind]['server'], server)
            self.assertEqual(entry[kind]['password'], password)
            self.assertEqual(entry[kind]['port'], 9)
        for data in self.sets.values():
            self.assertLessEqual(set(data), {'domain_set', 'domain_suffix_set', 'domain_keyword_set'})
        def visit(value):
            if isinstance(value, dict):
                for key, child in value.items():
                    if key in ('rule_set', 'proxy_rule_set'):
                        self.assertIn(child['match'], self.sets)
                        self.assertEqual(child['update_interval'], 86400)
                    visit(child)
            elif isinstance(value, list):
                for child in value: visit(child)
        visit(self.config)

    def test_service_routes_and_udp(self):
        for host in ('ios.chat.openai.com', 'gemini.google.com', 'grok.com', 'api.ipify.org',
                     'yuanbao.tencent.com', 'yiyan.baidu.com', 'apple-relay.apple.com',
                     'future-ai.example.org', 'icloud.com.example.org'):
            self.assertEqual(route(self.config, self.sets, host), 'AI-Mars', host)
        for host in ('gateway.icloud.com', 'inappcheck.itunes.apple.com', 'idmsa.apple.com',
                     'p01.icloud.com.cn', 'weixin.qq.com', 'www.bilibili.com'):
            self.assertEqual(route(self.config, self.sets, host), 'DIRECT', host)
        self.assertEqual(route(self.config, self.sets, 'imap.gmail.com', 'tcp', 993), 'Upstream-A')
        for host in ('grok.com', 'gateway.icloud.com', 'imap.gmail.com'):
            self.assertEqual(route(self.config, self.sets, host, 'quic', 443), 'REJECT')
        self.assertEqual(route(self.config, self.sets, 'mask-h2.icloud.com'), 'REJECT')

    def test_remote_additions_precede_domestic_and_mail(self):
        updated = copy.deepcopy(self.sets)
        updated[BASE+'AI.yaml']['domain_set'] += ['new-ai.tencent.com', 'imap.gmail.com']
        for host in ('new-ai.tencent.com', 'imap.gmail.com'):
            self.assertEqual(route(self.config, updated, host, 'tcp', 993), 'AI-Mars')
            self.assertEqual(route(self.config, updated, host, 'stun', 3478), 'REJECT')
        updated[BASE+'DomesticDirect.yaml']['domain_set'].append('new-service.example.org')
        self.assertEqual(route(self.config, updated, 'new-service.example.org'), 'DIRECT')
        self.assertEqual(route(self.config, self.sets, 'new-service.example.org'), 'AI-Mars')

    def test_local_ai_guards_survive_absent_or_conflicting_remote_rules(self):
        conflict = copy.deepcopy(self.sets)
        conflict[BASE+'DomesticDirect.yaml']['domain_set'].append('ios.chat.openai.com')
        for sets in ({}, conflict):
            for host in ('ios.chat.openai.com', 'gemini.google.com', 'grok.com', 'yuanbao.tencent.com'):
                self.assertEqual(route(self.config, sets, host), 'AI-Mars')
        # This models missing matches only; it does not emulate Egern download/cache errors.

    def test_bypass_mutations_fail(self):
        for kind in ('previous', 'direct', 'airport', 'default', 'whole_update'):
            c = copy.deepcopy(self.config)
            if kind == 'previous': c['proxies'][1]['socks5']['prev_hop'] = 'DIRECT'
            elif kind == 'direct': c['policy_groups'][0]['select']['policies'].append('DIRECT')
            elif kind == 'airport': c['policy_groups'][0]['select']['policies'].append('Upstream-A')
            elif kind == 'default': c['rules'][-1]['default']['policy'] = 'DIRECT'
            else: c['auto_update'] = {'url': 'https://example.invalid/full-profile', 'interval': 86400}
            with self.assertRaises(AssertionError): chain(c)


if __name__ == '__main__':
    unittest.main(verbosity=2)
