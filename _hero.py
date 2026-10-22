# -*- coding: utf-8 -*-
import re, io, glob, os
files = sorted(f for f in glob.glob('D:/apt/英语单词/*.html')
               if os.path.basename(f) not in ('index.html',))
print('%-15s %-28s %-10s %-8s %s' % ('card','hero 背景首色','hero深/浅','字体','review形状'))
for f in files:
    h = io.open(f, encoding='utf-8').read()
    css = h[h.index('<style>'):h.index('</style>')]
    m = re.search(r'\.hero\{[^}]*background:\s*([^;]+);', css, re.S)
    bg = ' '.join(m.group(1).split())[:28] if m else '?'
    dark = '深底' if re.search(r'#0[0-9A-Fa-f]{5}|#1[0-9A-Fa-f]{5}', m.group(1)[:20]) else '浅底'
    fs = re.search(r'\.word-anim\{[^}]*font-size:\s*([0-9]+)px', css, re.S)
    rr = re.search(r'\.review-day\{[^}]*border-radius:\s*([^;]+);', css, re.S)
    rrv = 'blob' if rr and '/' in rr.group(1) else 'radius'
    mark = ''
    n = os.path.basename(f)[:-5]
    if n in ('uniform','formal'): mark = ' <=='
    print('%-15s %-28s %-10s %-8s %s%s' % (n, bg, dark, fs.group(1)+'px' if fs else '?', rrv, mark))
