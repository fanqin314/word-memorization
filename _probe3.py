import re, glob, os
files = [f for f in glob.glob('D:/apt/英语单词/*.html') if os.path.basename(f) not in ('index.html',)]
for f in sorted(files):
    h = open(f, encoding='utf-8').read()
    rr = re.search(r'\.review-day\{[^}]*border-radius:\s*([^;]+);', h, re.S)
    fl = re.search(r'class="(page-[a-z]+|float[a-z-]*)"', h)
    hero = re.search(r'class="(hero-[a-z-]+)"', h)
    fs = re.search(r'\.word-anim\{[^}]*font-size:\s*([^;]+);', h, re.S)
    print('%-15s review-radius=%-34s float=%-16s hero=%-18s fontsize=%s' % (
        os.path.basename(f)[:-5],
        (rr.group(1).strip() if rr else '?')[:34],
        fl.group(1) if fl else '?', hero.group(1) if hero else '?',
        fs.group(1).strip() if fs else '?'))
