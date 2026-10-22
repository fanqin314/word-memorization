# -*- coding: utf-8 -*-
import re, io, glob, os

def load(p):
    return io.open(p, encoding='utf-8').read()

def rules(c):
    return set(x.strip() for x in re.findall(r'([.#][A-Za-z0-9_\-\.\#:>~\[\]\"\'=\s\(\),]+)\{', c))
def css_of(p):
    h = load(p); return h[h.index('<style>')+7:h.index('</style>')]

files = sorted(f for f in glob.glob('D:/apt/英语单词/*.html')
               if os.path.basename(f) not in ('index.html',))
ref = css_of('D:/apt/英语单词/union.html')
u = css_of('D:/apt/英语单词/uniform.html')
ru, rr = rules(u), rules(ref)
print('=== uniform vs union 骨架对比 ===')
print('  union 共有选择器 %d' % len(rr))
print('  uniform 全部选择器 %d' % len(ru))
print('  复用 union 的: %d' % len(ru & rr))
print('  uniform 主题专属: %d' % len(ru - rr))
print('  union 有但 uniform 没有的: %d' % len(rr - ru))
missing = rr - ru
if missing:
    print('  缺失清单(应仅为 union 专属装饰):')
    for s in sorted(missing):
        print('     -', s)

print()
print('=== 全库横向一致性 ===')
print('%-15s %-4s %-4s %-3s %-4s %-3s %-4s %-8s' % ('card','fam','col','ex','pit','tr','fill','sec1'))
for f in files:
    h = load(f)
    fam = len(re.findall(r'class="fam-card"', h)); col = len(re.findall(r'class="collo"', h))
    ex  = len(re.findall(r'class="real-ex"', h)); pit = len(re.findall(r'class="pitfall-item"', h))
    tr  = len(re.findall(r'<tr', h)); fl = len(re.findall(r'class="fill-item', h))
    s1  = re.search(r'<span>(\S+? · 词族)</span>', h)
    mark = ''
    n = os.path.basename(f)[:-5]
    if n == 'uniform': mark = '  <== 本次'
    if n == 'formal':  mark = '  <== 上次(破格)'
    print('%-15s %-4d %-4d %-3d %-4d %-3d %-4d %-8s%s' % (
        n, fam, col, ex, pit, tr, fl, s1.group(1) if s1 else '?', mark))
