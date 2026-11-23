"""Render local Egern credentials; never print credentials or accept bypasses."""
import argparse
import copy
import datetime
import ipaddress
import json
import os
from pathlib import Path
import shutil
import sys
import yaml


def check_chain(config):
    proxies = {}
    groups = {}
    for entry in config['proxies']:
        if len(entry) != 1:
            raise ValueError('invalid proxy entry')
        kind, proxy = next(iter(entry.items()))
        if kind not in ('shadowsocks', 'socks5') or proxy['name'] in proxies:
            raise ValueError('invalid proxy type or duplicate name')
        proxies[proxy['name']] = (kind, proxy)
    for entry in config['policy_groups']:
        kind, group = next(iter(entry.items()))
        if kind not in ('select', 'fallback') or group['name'] in groups or group['name'] in proxies:
            raise ValueError('invalid group')
        groups[group['name']] = group
    mars = []

    def walk(name, stack=()):
        if name in stack:
            raise ValueError('policy cycle')
        if name in groups:
            if not groups[name]['policies']:
                raise ValueError('empty AI group')
            for child in groups[name]['policies']:
                walk(child, stack + (name,))
            return
        if name not in proxies or proxies[name][0] != 'socks5':
            raise ValueError('AI candidate must be a complete Mars chain')
        proxy = proxies[name][1]
        previous = proxy.get('prev_hop')
        if previous not in proxies or proxies[previous][0] != 'shadowsocks':
            raise ValueError('Mars requires a valid airport previous hop')
        if proxies[previous][1].get('prev_hop'):
            raise ValueError('unexpected upstream chain')
        mars.append(tuple(proxy[k] for k in ('server', 'port', 'username', 'password')))

    walk('AI-Mars')
    if not mars or len(set(mars)) != 1:
        raise ValueError('both chains must use identical Mars credentials')
    if config['rules'][-1].get('default', {}).get('policy') != 'AI-Mars':
        raise ValueError('default must preserve Mars')
    for kind, proxy in proxies.values():
        if proxy.get('udp_relay') is not False or proxy.get('block_quic') is not True:
            raise ValueError('UDP/QUIC requires separate acceptance')
    return True


def render(template, credentials):
    config = copy.deepcopy(template)
    mapping = {'Upstream-A': 'upstream_a', 'Upstream-B': 'upstream_b',
               'Mars-via-A': 'mars', 'Mars-via-B': 'mars'}
    for entry in config['proxies']:
        kind, proxy = next(iter(entry.items()))
        source = credentials[mapping[proxy['name']]]
        fields = ('server', 'port', 'username', 'password') if kind == 'socks5' else ('server', 'port', 'method', 'password')
        if set(source) != set(fields):
            raise ValueError('credential fields do not match the expected protocol')
        if type(source['port']) is not int or not 0 < source['port'] < 65536:
            raise ValueError('invalid credential port')
        for field in fields:
            if field != 'port' and (not isinstance(source[field], str) or not source[field].strip() or source[field].startswith('REPLACE_')):
                raise ValueError('missing or example credential')
        if kind == 'shadowsocks' and source['method'] not in ('aes-128-gcm', 'aes-256-gcm', 'chacha20-ietf-poly1305'):
            raise ValueError('unsupported cipher for this template')
        try:
            address = ipaddress.ip_address(source['server'])
        except ValueError:
            if '://' in source['server'] or source['server'].endswith('.invalid'):
                raise ValueError('invalid proxy host')
        else:
            if not address.is_global:
                raise ValueError('local, reserved and example proxy addresses are not accepted')
        proxy.update({field: source[field] for field in fields})
    check_chain(config)
    return config


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--template', type=Path, required=True)
    parser.add_argument('--credentials', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    os.umask(0o077)
    try:
        config = render(yaml.safe_load(args.template.read_text()), json.loads(args.credentials.read_text()))
        if args.output.resolve() in (args.template.resolve(), args.credentials.resolve()):
            raise ValueError('output must differ from input')
        if not args.output.name.endswith('.private.yaml'):
            raise ValueError('output name must end in .private.yaml')
        args.output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        if args.output.exists():
            backup = args.output.with_name(args.output.name + '.backup-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f'))
            shutil.copy2(args.output, backup)
            backup.chmod(0o600)
        # Exclusive temporary file plus replace prevents following an output symlink.
        temporary = args.output.with_name(args.output.name + '.tmp-' + str(os.getpid()))
        with temporary.open('x') as output:
            output.write('# PRIVATE: keep on your own devices.\n' + yaml.safe_dump(config, allow_unicode=True, sort_keys=False))
        temporary.chmod(0o600)
        os.replace(temporary, args.output)
        print('Private configuration generated; connection parameters were not logged.')
    except Exception:
        # Parser errors can contain excerpts with secrets; suppress raw exceptions.
        print('Generation failed: check input structure, real credentials and chain invariants locally.', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
