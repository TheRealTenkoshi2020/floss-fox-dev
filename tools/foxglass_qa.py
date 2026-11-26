#!/usr/bin/env python3
"""Run development QA and retain real command results; never deploy or mutate app data."""
import argparse,json,os,pathlib,subprocess,sys,time,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
def legacy(a):
 root=(a.app_root or ROOT).resolve();a.out.mkdir(parents=True,exist_ok=True)
 names=['regression.py']+[p.name for p in sorted((root/'tests').glob('*_e2e.py')) if not p.name.startswith('foxglass_')]
 selected=names[a.shard::a.shards];rows=[];server=subprocess.Popen([sys.executable,'-m','http.server','8765','--bind','127.0.0.1','--directory',str(root)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  for _ in range(40):
   try:urllib.request.urlopen('http://127.0.0.1:8765/',timeout=1).close();break
   except OSError:time.sleep(.1)
  for name in selected:
   if name=='backup_forward_e2e.py' and not os.environ.get('PROD_URL'):
    rows.append({'suite':name,'status':'blocked','reason':'Requires separately served production reference; production was not modified.'});continue
   env={**os.environ,'FF_KEY':'flossfox-dev.v1','FF_CHROME':os.environ.get('FF_CHROME','/usr/bin/google-chrome'),'PYTHONPATH':str(ROOT/'tests/compat'),'FF_V6_COMPAT':'1','SHOTS':str(a.out/'screenshots'),'FF_SHOTS':str(a.out/'screenshots')}
   (a.out/'screenshots').mkdir(exist_ok=True)
   if name!='compact_e2e.py':env['FF_COMPAT_ALL']='1'
   start=time.monotonic();log=a.out/(name+'.log')
   with log.open('w') as stream:
    try:code=subprocess.run([sys.executable,'-u',str(root/'tests'/name),'http://127.0.0.1:8765/'],cwd=root,env=env,stdout=stream,stderr=subprocess.STDOUT,timeout=900 if name=='regression.py' else 360).returncode
    except subprocess.TimeoutExpired:code=124
   text=log.read_text(errors='replace');row={'suite':name,'status':'passed' if code==0 and not any(x.startswith('FAIL ') for x in text.splitlines()) else 'failed','exit':code,'seconds':round(time.monotonic()-start,1),'passed_assertions':sum(x.startswith('PASS ') for x in text.splitlines()),'failed_assertions':sum(x.startswith('FAIL ') for x in text.splitlines()),'log':log.name};rows.append(row);print(json.dumps(row),flush=True)
   (a.out/'results.json').write_text(json.dumps({'source_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'navigation_adapter':'actual V6 UI paths only when present; no assertion or calculation overrides','shard':a.shard,'shards':a.shards,'suites':rows},indent=2)+'\n')
 finally:server.terminate();server.wait(timeout=10)
 return int(any(r['status']=='failed' for r in rows))

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('mode',choices=['unit','legacy']);ap.add_argument('--out',type=pathlib.Path,required=True);ap.add_argument('--app-root',type=pathlib.Path);ap.add_argument('--shard',type=int,default=0);ap.add_argument('--shards',type=int,default=1);a=ap.parse_args();
 if a.mode=='legacy':return legacy(a)
 a.out.mkdir(parents=True,exist_ok=True)
 commands=[(str(p.relative_to(ROOT)),['node',str(p.relative_to(ROOT))]) for p in sorted((ROOT/'tests').glob('*unit*')) if p.suffix in ['.js','.cjs']]
 commands += [('seo-tests',[sys.executable,'-m','pytest','-q','tools/sitewide-seo/tests/test_sitewide_seo.py']),('seo-audit',[sys.executable,'tools/sitewide-seo/seo_audit.py','.','--site','dev'])]
 rows=[]
 for name,cmd in commands:
  start=time.monotonic();r=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=180);log=pathlib.Path(name).name+'.log';(a.out/log).write_text(r.stdout);row={'suite':name,'exit':r.returncode,'seconds':round(time.monotonic()-start,2),'log':log};rows.append(row);print(json.dumps(row),flush=True)
 (a.out/'results.json').write_text(json.dumps({'source_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'commands':rows},indent=2)+'\n')
 failures=[r for r in rows if r['exit']];print(json.dumps({'commands':len(rows),'failed':failures}),flush=True);return int(bool(failures))
if __name__=='__main__':sys.exit(main())
