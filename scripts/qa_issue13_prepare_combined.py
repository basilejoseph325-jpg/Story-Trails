"""Disposable integration fixture: current LIVE + only PR12 chapter changes + restore candidate.
Never modifies a branch, real player data, main, publishing or deployment.
"""
from pathlib import Path
import os, shutil, subprocess
BASE='67a9020455f98318c518e5e989a285ac80e167b6'
OLD='169294536e6bdf3047cd556e8ee0d84a50d9f1ff'
CHAPTERS='1e2f3636fb054497a4fae65a283401c2ad96e026'
target=Path(os.environ.get('COMBINED_DIR','work/combined-current'))
baseline=Path(os.environ.get('BASELINE_DIR','work/baseline-current'))
def archive(ref,dest):
    dest.mkdir(parents=True,exist_ok=True)
    p=subprocess.Popen(['git','archive',ref],stdout=subprocess.PIPE)
    subprocess.run(['tar','-x','-C',str(dest)],stdin=p.stdout,check=True)
    p.stdout.close()
    if p.wait():raise RuntimeError('Archive failed')
def source(ref,name):return subprocess.check_output(['git','show',ref+':'+name])
archive(BASE,target);archive(BASE,baseline)
files=subprocess.check_output(['git','diff','--name-only',OLD,CHAPTERS],text=True).splitlines()
for name in files:
    if name in ['index.html','journey-progress-caption.js'] or name.startswith(('.github/','docs/')):continue
    p=target/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(source(CHAPTERS,name))
old=source(OLD,'journey-progress-caption.js');chapters=source(CHAPTERS,'journey-progress-caption.js')
assert chapters.startswith(old)
(target/'journey-progress-caption.js').write_bytes(source(BASE,'journey-progress-caption.js')+chapters[len(old):])
for name in ['index.html','bu-platform-saves-v2.js']:shutil.copyfile(name,target/name)
(target/'work').mkdir(exist_ok=True)
print('Prepared disposable current-main + PR12 chapters + restore fixture:',target)
