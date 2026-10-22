import re, glob, os
files = [f for f in glob.glob('D:/apt/英语单词/*.html') if os.path.basename(f) not in ('index.html',)]
for f in sorted(files):
    h = open(f, encoding='utf-8').read()
    hl = re.findall(r'class="hl">([^<]{1,14})</', h)[:3]
    d = re.search(r'\.review-day\.done::after\{[^}]*?content:\s*"([^"]*)"', h, re.S)
    sh = re.search(r'class="spell-hint"[^>]*>([^<]*)<', h)
    sec = re.search(r'<span>(词根|词源) · 词族</span>', h)
    print('%-15s hl=%-22s done=%-4s sec=%-4s hint=%s' % (
        os.path.basename(f)[:-5], str(hl), d.group(1) if d else '?',
        sec.group(1) if sec else '?', sh.group(1).strip() if sh else '?'))
