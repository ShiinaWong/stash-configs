#!/usr/bin/env python3
"""Build Loon chains locally. No account is sent to a converter or logged."""
import argparse,base64,collections,datetime,json,os,re,shutil,sys
from pathlib import Path
from urllib.parse import urlsplit,unquote
from urllib.request import Request,urlopen

ROOT=Path(__file__).resolve().parents[1]
SUPPORTED={'ss','shadowsocks','ssr','shadowsocksr','vmess','vless','trojan','hysteria2','hy2','anytls','http','https','socks5','wireguard'}
REGIONS=('香港','台湾','日本','韩国','新加坡','越南','菲律宾','印度','土耳其')
REGEX=re.compile(r'香港|台湾|台灣|日本|东京|東京|大阪|韩国|韓國|新加坡|越南|菲律宾|印度|土耳其|🇭🇰|🇹🇼|🇯🇵|🇰🇷|🇸🇬|🇻🇳|🇵🇭|🇮🇳|🇹🇷|\b(?:HK|HKG|JP|JPN|KR|SG|TW|VN|PH|IN|TR)\b|Hong Kong|Japan|Singapore|Taiwan|Korea|Vietnam|Philippines|India|Turkey|Türkiye',re.I)
NOTICE=re.compile(r'剩余流量|过期时间|到期时间|套餐到期|流量重置|官方网址|订阅更新|^📢')

def decode64(s):
    return base64.urlsafe_b64decode(s+'='*(-len(s)%4)).decode('utf-8-sig')

def name_ok(name):
    # Do not silently produce an ambiguous Loon reference.
    if not name.strip() or any(c in name for c in ',=\r\n"'):raise ValueError('unsafe node name')
    return name.strip()

def parse_subscription(text,provider):
    text=text.strip().lstrip('\ufeff')
    if re.fullmatch(r'[A-Za-z0-9+/=_\-\s]+',text):text=decode64(re.sub(r'\s+','',text))
    if text.startswith(('<','{')) or re.search(r'^proxies\s*:',text,re.M):
        raise ValueError('Provider must supply native Loon or node URI format')
    found=[]; section=None
    for raw in text.splitlines():
        line=raw.strip()
        if not line or line.startswith(('#',';','//')):continue
        if line.startswith('['):section=line.lower();continue
        if section is not None and section!='[proxy]':continue
        if re.match(r'^[a-z0-9]+://',line,re.I):
            u=urlsplit(line);proto=u.scheme.lower();name=unquote(u.fragment)
            if proto=='vmess':name=json.loads(decode64(line[8:])).get('ps','')
        elif '=' in line:
            name,value=line.split('=',1);proto=value.split(',',1)[0].strip().lower();name=name.strip()
        else:raise ValueError('Unknown subscription line')
        if NOTICE.search(name):continue
        found.append({'provider':provider,'name':name_ok(name),'protocol':proto,'asian':bool(REGEX.search(name))})
    if not found:raise ValueError('Empty subscription')
    return found

def save(path,text,private=True):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    if path.exists():
        stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
        backup=path.parent/'backups'/stamp/path.name
        backup.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,backup)
    path.write_text(text,encoding='utf-8');path.chmod(0o600 if private else 0o644)

def quote(value):
    value=str(value)
    if any(c in value for c in '\r\n"\\'):raise ValueError('Unsupported quoted field')
    return '"'+value+'"'

def render(inputs,nodes,public=False):
    eligible=[n for n in nodes if n['asian'] and n['protocol'] in SUPPORTED]
    if not eligible:raise ValueError('No supported Asian nodes')
    counts=collections.Counter(n['name'] for n in nodes)
    if any(counts[n['name']]!=1 for n in eligible):raise ValueError('Duplicate node names across subscriptions')
    # Current names resolve directly to subscription nodes; there are no 65 extra selector groups.
    eligible.sort(key=lambda n:(inputs['providers'].index(next(p for p in inputs['providers'] if p['name']==n['provider'])),n['name']))
    for n in eligible:n['chain']='Mars 经 '+n['provider']+' · '+n['name']
    chain_names=','.join(n['chain'] for n in eligible)
    chains='\n'.join(n['chain']+' = '+n['name']+',Mars-ISP,udp=false' for n in eligible)
    providers=[];remote=[]
    for item in inputs['providers']:
        provider=name_ok(item['name']);providers.append(provider)
        url='https://example.invalid/'+str(len(providers)) if public else item['url']
        if any(c in url for c in ',\r\n"'):raise ValueError('Subscription URL requires escaping')
        if urlsplit(url).scheme!='https':raise ValueError('HTTPS subscription required')
        remote.append(provider+' = '+url+',parser-enabled=false,udp=default,block-quic=true,fast-open=default,vmess-aead=true,skip-cert-verify=default,enabled=true')
    mars={'server':'mars.example.invalid','port':1080,'username':'LOCAL_USERNAME','password':'LOCAL_PASSWORD'} if public else inputs['mars']
    if not 0<int(mars['port'])<65536:raise ValueError('Invalid Mars port')
    server=str(mars['server'])
    if any(c in server for c in ',\r\n"'):raise ValueError('Invalid Mars server')
    if ':' in server and not server.startswith('['):server='['+server+']'
    node='Mars-ISP = SOCKS5,'+server+','+str(mars['port'])+','+quote(mars['username'])+','+quote(mars['password'])+',udp=false,block-quic=true,ip-mode=v4-only'
    baseline=json.loads((ROOT/'ai-baseline.json').read_text())
    guard=[];exclude={'google.com','*.google.com','new.vip.weibo.cn','new.vip.weibo.com'}
    for kind,values in baseline['rules'].items():
        for value in values:
            guard.append(kind+','+value+',AI-Mars')
            if kind=='DOMAIN':exclude.add(value)
            elif kind=='DOMAIN-SUFFIX':exclude.update((value,'*.'+value))
    # Bootstrap URLs are local-only in the actual profile; no private domain is published.
    bootstrap=[] if public else ['DOMAIN,'+urlsplit(p['url']).hostname+',DIRECT' for p in inputs['providers']]
    tokens={'@@PROFILE_NOTICE@@':'PUBLIC TEMPLATE: fill subscription URLs and Mars credentials locally before use.' if public else 'PRIVATE: contains subscription and Mars credentials; never publish this file.',
            '@@MARS@@':node,'@@SUBSCRIPTIONS@@':'\n'.join(remote),'@@PROVIDERS@@':','.join(providers),
            '@@CHAIN_NAMES@@':chain_names,'@@CHAINS@@':chains,'@@AI_GUARDS@@':'\n'.join(guard),
            '@@BOOTSTRAP_RULES@@':'\n'.join(bootstrap),'@@MITM_EXCLUSIONS@@':','.join('-'+v for v in sorted(exclude))}
    result=(ROOT/'base.conf').read_text()
    for k,v in tokens.items():result=result.replace(k,v)
    if '@@' in result:raise ValueError('Unfilled template marker')
    return result,eligible

def main():
    os.umask(0o077)
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--inputs',required=True);ap.add_argument('--cache-dir',required=True)
    ap.add_argument('--output',required=True);ap.add_argument('--public-output')
    ap.add_argument('--manifest');ap.add_argument('--refresh',action='store_true')
    args=ap.parse_args()
    inputs=json.loads(Path(args.inputs).read_text());cache=Path(args.cache_dir);cache.mkdir(parents=True,exist_ok=True)
    nodes=[]
    for provider in inputs['providers']:
        name=name_ok(provider['name']);file=cache/('subscription-'+name+'.txt')
        if args.refresh:
            req=Request(provider['url'],headers={'User-Agent':'Loon/1008 CFNetwork/3860.400.51 Darwin/25.0.0'})
            with urlopen(req,timeout=30) as resp:body=resp.read(3_000_001)
            if len(body)>3_000_000:raise ValueError('Subscription too large')
            text=body.decode('utf-8-sig');parse_subscription(text,name);save(file,text)
        nodes.extend(parse_subscription(file.read_text(),name))
    result,eligible=render(inputs,nodes);save(args.output,result)
    if args.public_output:save(args.public_output,render(inputs,nodes,True)[0],False)
    report={'date':'2026-11-24','minimum_version':'3.5.1','target_version':'3.5.3','chains':len(eligible),
            'providers':dict(collections.Counter(n['provider'] for n in eligible)),
            'protocols':dict(collections.Counter(n['protocol'] for n in eligible)),
            'algorithm':'pcc','probe_interval_seconds':600,'probe_max_timeout_ms':8000,
            'groups':5,'entries':eligible,
            'unsupported_asian_nodes':[n for n in nodes if n['asian'] and n['protocol'] not in SUPPORTED],
            'native_loon_test':'pending','credential_values_logged':False}
    if args.manifest:save(args.manifest,json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:report[k] for k in ('chains','providers','protocols','groups','native_loon_test')},ensure_ascii=False))

if __name__=='__main__':
    try:main()
    except Exception as exc:
        print('Build failed: '+type(exc).__name__+'; private values suppressed.',file=sys.stderr)
        sys.exit(1)
