import copy
import importlib.util
import json
from pathlib import Path
import unittest
import yaml

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('renderer', ROOT/'tools/render_private.py')
renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)


class ChainTests(unittest.TestCase):
    def setUp(self):
        self.config = yaml.safe_load((ROOT/'templates/Egern_Mars_Adblock.yaml').read_text())
        self.credentials = {
            'upstream_a': {'server': 'airport-a.example.com', 'port': 12345, 'method': 'aes-256-gcm', 'password': 'synthetic-a'},
            'upstream_b': {'server': 'airport-b.example.com', 'port': 23456, 'method': 'aes-256-gcm', 'password': 'synthetic-b'},
            'mars': {'server': 'mars.example.com', 'port': 34567, 'username': 'synthetic-user', 'password': 'synthetic-mars'},
        }

    def test_all_templates_keep_chain_and_have_only_example_secrets(self):
        examples = json.loads((ROOT/'credentials.example.json').read_text())
        mapping = {'Upstream-A': 'upstream_a', 'Upstream-B': 'upstream_b', 'Mars-via-A': 'mars', 'Mars-via-B': 'mars'}
        for path in (ROOT/'templates').glob('*.yaml'):
            with self.subTest(path=path.name):
                config = yaml.safe_load(path.read_text())
                self.assertTrue(renderer.check_chain(config))
                for entry in config['proxies']:
                    proxy = next(iter(entry.values()))
                    expected = examples[mapping[proxy['name']]]
                    self.assertEqual({k: proxy[k] for k in expected}, expected)
                self.assertEqual(config['modules'], [])
                self.assertEqual(config['mitm']['hostnames']['includes'], [])

    def test_render_changes_credentials_but_preserves_policy_rules_and_prev_hop(self):
        rendered = renderer.render(self.config, self.credentials)
        for key in ['policy_groups', 'rules', 'dns', 'mitm']:
            self.assertEqual(rendered[key], self.config[key])
        for before, after in zip(self.config['proxies'], rendered['proxies']):
            self.assertEqual(next(iter(before.values())).get('prev_hop'), next(iter(after.values())).get('prev_hop'))
        self.assertEqual(rendered['proxies'][2]['socks5']['password'], 'synthetic-mars')
        self.assertNotEqual(rendered['proxies'][2]['socks5']['password'], self.config['proxies'][2]['socks5']['password'])

    def test_example_credentials_are_rejected(self):
        with self.assertRaises(ValueError):
            renderer.render(self.config, json.loads((ROOT/'credentials.example.json').read_text()))

    def test_fail_closed_for_bad_candidates_and_references(self):
        for case in ['direct', 'airport_only', 'missing_previous', 'unknown_previous', 'different_mars', 'cycle', 'bad_default', 'udp']:
            with self.subTest(case=case):
                config = copy.deepcopy(self.config)
                if case == 'direct': config['policy_groups'][0]['select']['policies'].append('DIRECT')
                if case == 'airport_only': config['policy_groups'][0]['select']['policies'].append('Upstream-A')
                if case == 'missing_previous': del config['proxies'][2]['socks5']['prev_hop']
                if case == 'unknown_previous': config['proxies'][2]['socks5']['prev_hop'] = 'missing'
                if case == 'different_mars': config['proxies'][3]['socks5']['port'] += 1
                if case == 'cycle': config['policy_groups'][0]['select']['policies'].append('AI-Mars')
                if case == 'bad_default': config['rules'][-1]['default']['policy'] = 'DIRECT'
                if case == 'udp': config['proxies'][2]['socks5']['udp_relay'] = True
                with self.assertRaises(ValueError): renderer.check_chain(config)

    def test_credentials_cannot_override_previous_hop(self):
        self.credentials['mars']['prev_hop'] = 'DIRECT'
        with self.assertRaises(ValueError): renderer.render(self.config, self.credentials)

    def test_reserved_addresses_and_invalid_port_rejected(self):
        for address in ['127.0.0.1', '192.0.2.1', '198.51.100.2', '10.0.0.1', 'https://not-a-host']:
            with self.subTest(address=address):
                credentials = copy.deepcopy(self.credentials)
                credentials['mars']['server'] = address
                with self.assertRaises(ValueError): renderer.render(self.config, credentials)
        for port in [0, -1, 65536, True, '1234']:
            with self.subTest(port=port):
                credentials = copy.deepcopy(self.credentials)
                credentials['mars']['port'] = port
                with self.assertRaises(ValueError): renderer.render(self.config, credentials)


if __name__ == '__main__':
    unittest.main()
