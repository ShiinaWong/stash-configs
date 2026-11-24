#!/usr/bin/env python3
"""Build local, fully defined airport -> Mars chains from private native subscriptions.

The phone's exported profile supplies personal settings and its existing certificate.
Remote subscription member names are never used as bare chain references.
"""
import argparse,base64,collections,csv,datetime,json,os,re,shutil,sys
from pathlib import Path
from urllib.parse import urlsplit,unquote
from urllib.request import Request,urlopen

ASIA=re.compile(r'香港|台湾|台灣|日本|东京|東京|大阪|韩国|韓國|新加坡|越南|菲律宾|印度|土耳其|🇭🇰|🇹🇼|🇯🇵|🇰🇷|🇸🇬|🇻🇳|🇵🇭|🇮🇳|🇹🇷|\b(?:HK|HKG|JP|JPN|KR|SG|TW|VN|PH|IN|TR)\b|Hong Kong|Japan|Singapore|Taiwan|Korea|Vietnam|Philippines|India|Turkey',re.I)
EXCLUDE=re.compile(r'免费|下載|下载|直连|普通|视频|試用|试用|体验|回国|Free|Download|Trial',re.I)
PREMIUM=re.compile(r'IEPL|IPLC|专线|專線',re.I)
NOTICE=re.compile(r'^📢|剩余流量|过期时间|到期时间|套餐到期|流量重置|官方网址|订阅更新')
PREFIX='前置 · '

def decode64(s):return base64.urlsafe_b64decode(s+'='*(-len(s)%4)).decode('utf-8-sig')
def active(lines):return [x.strip() for x in lines if x.strip() and not x.lstrip().startswith(('#',';','//'))]
def sections(text):
    result={};key=None
    for line in text.splitlines():
        if re.fullmatch(r'\[[^\]]+\]',line.strip()):
            key=line.strip()[1:-1].lower()
            if key in result:raise ValueError('Duplicate section')
            result[key]=[]
        elif key:result[key].append(line)
    return result
def quote(s):
    s=str(s)
    if any(c in s for c in '\r\n"\\'):raise ValueError('Unsupported quoted value')
    return '"'+s+'"'
def safe(s):
    s=str(s)
    if any(c in s for c in ',\r\n"'):raise ValueError('Unsafe scalar/name')
    return s
def address(s):
    s=safe(s)
    return '['+s+']' if ':' in s and not s.startswith('[') else s
def is_premium(name):return bool(ASIA.search(name) and PREMIUM.search(name) and not EXCLUDE.search(name))
def set_value(lines,key,value):
    result=[];found=False
    for l in lines:
        if re.match(r'^'+re.escape(key)+r'\s*=',l.strip(),re.I):result.append(key+' = '+value);found=True
        else:result.append(l)
    if not found:result.append(key+' = '+value)
    return result
def option(value,key,replacement):
    # Native node strings may contain quoted commas; do not split credentials.
    parts=[];start=0;quoted=False
    for i,c in enumerate(value):
        if c=='"':quoted=not quoted
        elif c==',' and not quoted:parts.append(value[start:i].strip());start=i+1
    parts.append(value[start:].strip())
    parts=[p for p in parts if not re.match(r'^'+re.escape(key)+r'\s*=',p,re.I)]
    return ','.join(parts+[key+'='+replacement])
def save(path,text,private=True):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    if path.exists():
        dest=path.parent/'backups'/datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')/path.name
        dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,dest)
    path.write_text(text);path.chmod(0o600 if private else 0o644)

def subscription_records(text,provider):
    text=text.strip().lstrip('\ufeff')
    if re.fullmatch(r'[A-Za-z0-9+/=_\-\s]+',text):text=decode64(re.sub(r'\s+','',text))
    result=[];section=None
    for line in text.splitlines():
        line=line.strip()
        if not line or line.startswith(('#',';','//')):continue
        if line.startswith('['):section=line.lower();continue
        if section is not None and section!='[proxy]':continue
        value=None
        if line.startswith('vmess://'):
            v=json.loads(decode64(line[8:]));name=v.get('ps','');proto='vmess'
            if is_premium(name):
                transport=v.get('net') or 'tcp'
                if transport not in ['tcp','ws','http'] or v.get('type','none') not in ['none','']:
                    raise ValueError('Unsupported VMess transport; no silent downgrade')
                fields=['VMess',address(v['add']),str(int(v['port'])),safe(v.get('scy') or 'auto'),quote(v['id']),
                        'transport='+transport,'alterId='+str(int(v.get('aid') or 0)),'over-tls='+str(v.get('tls')=='tls').lower()]
                if v.get('path'):fields.append('path='+safe(v['path']))
                if v.get('host'):fields.append('host='+safe(v['host']))
                if v.get('sni'):fields.append('sni='+safe(v['sni']))
                fields+=['skip-cert-verify='+str(str(v.get('verify_cert',True)).lower() in ['false','0']).lower(),'udp=false','block-quic=true']
                value=','.join(fields)
        elif line.startswith('ss://'):
            u=urlsplit(line);name=unquote(u.fragment);proto='ss'
            if is_premium(name):
                if u.query:raise ValueError('Unsupported SS URI query; inspect before conversion')
                if u.username is None:u=urlsplit('ss://'+decode64(u.netloc+u.path)+'#'+u.fragment)
                auth=unquote(u.username)
                if u.password is not None:auth+=':'+unquote(u.password)
                if ':' not in auth:auth=decode64(auth)
                method,password=auth.split(':',1)
                value=','.join(['Shadowsocks',address(u.hostname),str(u.port),safe(method),quote(password),'udp=false','block-quic=true'])
        elif '://' not in line.split('=',1)[0] and '=' in line:
            name,value=line.split('=',1);name=name.strip();value=value.strip();proto=value.split(',',1)[0].strip().lower()
            if is_premium(name) and proto not in ['shadowsocks','ss','vmess','vless','trojan','hysteria2','anytls','socks5','http','https']:
                raise ValueError('Unsupported native node protocol')
        else:raise ValueError('Unsupported subscription format; no online conversion')
        if NOTICE.search(name):continue
        name=safe(name)
        entry={'provider':safe(provider),'name':name,'protocol':proto,'premium':is_premium(name)}
        if entry['premium']:
            if not value:raise ValueError('Missing native node definition')
            entry.update(local_name=PREFIX+provider+' · '+name,chain='Mars 经 '+provider+' · '+name,native=value)
        result.append(entry)
    return result

def render(source,records,public=False):
    cfg=sections(source);eligible=[r for r in records if r['premium']]
    if not eligible:raise ValueError('No premium Asian nodes')
    eligible.sort(key=lambda r:(0 if r['provider']=='ikuuu' else 1,r['name']))
    local_names=[r['local_name'] for r in eligible]
    if len(local_names)!=len(set(local_names)):raise ValueError('Duplicate local node name')
    old_proxy=active(cfg.get('proxy',[]))
    mars=next((l for l in old_proxy if l.split('=',1)[0].strip()=='Mars-ISP'),None)
    if not mars:raise ValueError('Existing local Mars-ISP node required')
    # Preserve all non-generated local nodes from the source export.
    extra=[l for l in old_proxy if l!=mars and not l.startswith(PREFIX)]
    # Loon omits false/default flags when saving a profile; make our intent explicit again.
    mars='Mars-ISP = '+option(option(mars.split('=',1)[1].strip(),'udp','false'),'block-quic','true')
    local=[]
    for r in eligible:
        value='Shadowsocks,front.example.invalid,443,aes-128-gcm,"LOCAL_AIRPORT_PASSWORD",udp=false,block-quic=true' if public else r['native']
        local.append(r['local_name']+' = '+value)
    cfg['proxy']=['# PRIVATE local snapshots; update with build_premium.py when provider parameters change.',mars]+extra+local
    cfg['remote filter']=[
        '优质亚洲前置 = NameRegex,FilterKey="^前置 · (ikuuu|云梯) · "',
        'ikuuu优质 = NameRegex,FilterKey="^前置 · ikuuu · "',
        '云梯优质 = NameRegex,FilterKey="^前置 · 云梯 · "',
        '新加坡优质 = NameRegex,FilterKey="^前置 · (ikuuu|云梯) · .*新加坡"',
    ]
    chains=','.join(r['chain'] for r in eligible)
    cfg['proxy group']=[
        'AI-Mars = select,Mars-亚洲自动,'+chains,
        'Mars-亚洲自动 = load-balance,'+chains+',url=https://www.gstatic.com/generate_204,interval=600,max-timeout=10000,algorithm=pcc',
        '普通代理 = select,机场自动,ikuuu优质,云梯优质',
        '机场自动 = url-test,优质亚洲前置,url=https://www.gstatic.com/generate_204,interval=600,tolerance=100',
        '兜底策略 = select,AI-Mars,普通代理',
        '新加坡流媒体 = url-test,新加坡优质,url=https://www.gstatic.com/generate_204,interval=600,tolerance=100',
    ]
    cfg['proxy chain']=['# Every hop below resolves to a node explicitly defined in [Proxy].']+[
        r['chain']+' = '+r['local_name']+',Mars-ISP,udp=false' for r in eligible]
    cfg['general']=set_value(cfg['general'],'test-timeout','10')
    # AI/Mars UDP settings are retained. Never replace a missing hop with DIRECT.
    if not re.search(r'\budp\s*=\s*false',mars,re.I):raise ValueError('Mars must retain udp=false')
    if any(re.search(r'(?:,|=)\s*Mars-链式(?:,|$)',l) for l in cfg.get('rule',[])+cfg.get('remote rule',[])):
        raise ValueError('Legacy chain referenced by rules; explicit migration required')
    has_ca=any(re.match(r'^ca-p12\s*=\s*\S+',l.strip(),re.I) for l in cfg.get('mitm',[]))
    certificate_notice='和原P12证书。' if has_ca else '；请在手机配置自己的证书。'
    header=(f'# 20261124-R2：修复机场前置丢失，保留{len(eligible)}条亚洲IEPL／专线前置'+certificate_notice+'\n' if not public else '# 20261124-R2：使用本地前置定义的亚洲IEPL／专线完整链路公开占位模板。\n')
    header+='# Loon 3.5.3 | Premium Asian full chains | v2 2026-11-24\n'
    header+='# PUBLIC TEMPLATE: all airport and Mars connection fields must be supplied locally.\n' if public else '# PRIVATE: contains your airport credentials, Mars credentials and existing CA private key.\n'
    header+='# Original subscriptions are retained, but active pools use only the explicit premium local snapshots.\n'
    out=header+'\n'+'\n\n'.join('['+k.title()+']\n'+'\n'.join(v).strip() for k,v in cfg.items())+'\n'
    report={'version':2,'chains':len(eligible),'providers':dict(collections.Counter(r['provider'] for r in eligible)),
            'groups':6,'node_binding':'local Proxy definitions; no bare subscription member references',
            'entries':[{k:v for k,v in r.items() if k!='native'} for r in eligible],
            'excluded':[{'provider':r['provider'],'name':r['name'],'reason':'Missing premium Asian label or explicitly free/download/ordinary/direct/video'} for r in records if not r['premium'] and ASIA.search(r['name'])],
            'iphone_import_roundtrip':'pending'}
    return out,report

def main():
    os.umask(0o077)
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--source',required=True,type=Path,help='Private exported Loon profile to preserve')
    ap.add_argument('--inputs',required=True,type=Path)
    ap.add_argument('--cache-dir',required=True,type=Path)
    ap.add_argument('--output',required=True,type=Path)
    ap.add_argument('--manifest',type=Path)
    ap.add_argument('--refresh',action='store_true')
    ap.add_argument('--public-output',type=Path)
    ap.add_argument('--public-base',type=Path,help='Already-sanitized public base; NEVER the private export')
    args=ap.parse_args();inputs=json.loads(args.inputs.read_text());records=[]
    for p in inputs['providers']:
        filename=args.cache_dir/('subscription-'+safe(p['name'])+'.txt')
        if args.refresh:
            req=Request(p['url'],headers={'User-Agent':'Loon/1008 CFNetwork/3860.400.51 Darwin/25.0.0'})
            with urlopen(req,timeout=30) as resp:data=resp.read(3_000_001)
            if len(data)>3_000_000:raise ValueError('Subscription too large')
            text=data.decode('utf-8-sig');subscription_records(text,p['name']);save(filename,text)
        records+=subscription_records(filename.read_text(),p['name'])
    source=args.source.read_text()
    # A new installation may start from the sanitized template. Existing private
    # exports retain their actual Mars and subscription settings verbatim.
    template_cfg=sections(source);filled=False
    if any('mars.example.invalid' in l for l in template_cfg.get('proxy',[])):
        mars=inputs['mars']
        actual='Mars-ISP = socks5,'+address(mars['server'])+','+str(int(mars['port']))+','+quote(mars['username'])+','+quote(mars['password'])+',udp=false,block-quic=true,ip-mode=v4-only'
        template_cfg['proxy']=[actual if l.split('=',1)[0].strip()=='Mars-ISP' else l for l in template_cfg['proxy']];filled=True
    if any('https://example.invalid/' in l for l in template_cfg.get('remote proxy',[])):
        template_cfg['remote proxy']=[safe(p['name'])+' = '+safe(p['url'])+',parser-enabled=false,udp=default,block-quic=true,vmess-aead=true,enabled=true' for p in inputs['providers']];filled=True
    if filled:source='\n\n'.join('['+k+']\n'+'\n'.join(v) for k,v in template_cfg.items())
    output,manifest=render(source,records)
    public_output=None
    if args.public_output:
        if not args.public_base:raise ValueError('Sanitized public base required')
        public_source=args.public_base.read_text()
        if re.search(r'^ca-(?:p12|passphrase)\s*=',public_source,re.M|re.I):raise ValueError('Public base contains CA material')
        if any(p['url'] in public_source for p in inputs['providers']):raise ValueError('Public base contains subscription URL')
        if any(str(v) in public_source for v in inputs['mars'].values() if len(str(v))>=6):raise ValueError('Public base contains Mars parameters')
        public_output,_=render(public_source,records,True)
    save(args.output,output)
    if public_output is not None:save(args.public_output,public_output,False)
    if args.manifest:save(args.manifest,json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:manifest[k] for k in ['version','chains','providers','groups','node_binding','iphone_import_roundtrip']},ensure_ascii=False))

if __name__=='__main__':
    try:main()
    except Exception as exc:
        print('Build failed: '+type(exc).__name__+'; private values suppressed.',file=sys.stderr);sys.exit(1)
