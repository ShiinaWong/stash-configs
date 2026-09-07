import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('ai', Path(__file__).resolve().parents[1] / 'tools/sync_ai_rules.py')
ai = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ai)


class AIRulesTests(unittest.TestCase):
    def test_reject_extra_fields_instead_of_silently_dropping(self):
        with self.assertRaises(SystemExit):
            ai.parse_rules('IP-CIDR,192.0.2.0/24,no-resolve', 'fixture')

    def test_exclusions_and_supplements(self):
        upstream = 'payload:\n' + '\n'.join('  - DOMAIN,host%d.example.com' % i for i in range(60))
        upstream += '\n  - DOMAIN-SUFFIX,amazonaws.com\n  - DOMAIN,api.example.com'
        supplement = ai.SUPPLEMENT.read_text() + '\nDOMAIN-SUFFIX,chatgpt.com\nDOMAIN-SUFFIX,claude.ai\nDOMAIN,api.example.com'
        rules = ai.parse_rules(ai.render(upstream, supplement), 'output')
        self.assertNotIn(('DOMAIN-SUFFIX', 'amazonaws.com'), rules)
        self.assertEqual(rules.count(('DOMAIN', 'api.example.com')), 1)
        self.assertIn(('DOMAIN-SUFFIX', 'chatgpt.site'), rules)


if __name__ == '__main__':
    unittest.main()
