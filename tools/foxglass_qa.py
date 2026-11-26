#!/usr/bin/env python3
"""Run development QA and retain real command results; never deploy or mutate app data."""
import argparse,json,os,pathlib,subprocess,sys,time
ROOT=pathlib.Path(__file__).resolve().parents[1]
def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('mode',choices=['unit']);ap.add_argument('--out',type=pathlib.Path,required=True);a=ap.parse_args();a.out.mkdir(parents=True,exist_ok=True)
 commands=[(str(p.relative_to(ROOT)),['node',str(p.relative_to(ROOT))]) for p in sorted((ROOT/'tests').glob('*unit*')) if p.suffix in ['.js','.cjs']]
 commands += [('seo-tests',[sys.executable,'-m','pytest','-q','tools/sitewide-seo/tests/test_sitewide_seo.py']),('seo-audit',[sys.executable,'tools/sitewide-seo/seo_audit.py','.','--site','dev'])]
 rows=[]
 for name,cmd in commands:
  start=time.monotonic();r=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=180);log=pathlib.Path(name).name+'.log';(a.out/log).write_text(r.stdout);row={'suite':name,'exit':r.returncode,'seconds':round(time.monotonic()-start,2),'log':log};rows.append(row);print(json.dumps(row),flush=True)
 (a.out/'results.json').write_text(json.dumps({'source_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'commands':rows},indent=2)+'\n')
 failures=[r for r in rows if r['exit']];print(json.dumps({'commands':len(rows),'failed':failures}),flush=True);return int(bool(failures))
if __name__=='__main__':sys.exit(main())
