# -*- coding: utf-8 -*-
import re, io, os

def check(path, word, theme_bad):
    h = io.open(path, encoding='utf-8').read()
    css = h[h.index('<style>'):h.index('</style>')]
    print('===== %s =====' % os.path.basename(path))
    ok = True
    for tag in ['html','head','body','style','script','article','section','div','svg','g',
                'defs','clipPath','table','tbody','tr','td','span','p','text','button','textarea']:
        o = len(re.findall(r'<'+tag+r'[\s>]', h)); c = len(re.findall(r'</'+tag+r'>', h))
        if o != c:
            ok = False; print('  MISMATCH %-9s open=%d close=%d' % (tag, o, c))
    print('  标签配平: %s' % ('OK' if ok else 'FAIL'))

    exp = {'fam-card': 6, 'collo': 5, 'real-ex': 4, 'pitfall-item': 3, 'fill-item': 5}
    for k, v in exp.items():
        n = len(re.findall(r'class="'+k+r'[\s"]', h))
        st = 'OK' if n == v else 'FAIL'
        if n != v: ok = False
        print('  %-13s = %d (期望 %d) %s' % (k, n, v, st))
    n = len(re.findall(r'<tr', h))
    if n != 6: ok = False
    print('  tr           = %d (期望 6) %s' % (n, 'OK' if n == 6 else 'FAIL'))

    want = ['词根 · 词族','意象卡 · 一句话记住','核心搭配 · 语块记忆','真题例句 · 语境记忆',
            '易错提醒 · 先防错','易混辨析 · 一句话区分','首字母填空 · 提取练习','造句练习 · 产出','复习打卡 · 点击标记']
    secs = re.findall(r'<span>(\S+? · \S+?)</span>', h)
    got = [s for s in secs if s in want]
    if got != want: ok = False
    print('  九大节区: %s' % ('OK 顺序命名一致' if got == want else 'FAIL ' + str(got)))

    hl = re.findall(r'class="hl">([^<]{1,16})</', h)
    fam_hl = len(re.findall(r'class="w"><span class="hl">', h))
    if fam_hl != 1: ok = False
    print('  fam 内 .hl 数量 = %d (期望 1) %s' % (fam_hl, 'OK' if fam_hl == 1 else 'FAIL'))

    rr = re.search(r'\.review-day\{[^}]*border-radius:\s*([^;]+);', css, re.S)
    isblob = '/' in (rr.group(1) if rr else '')
    if not isblob: ok = False
    print('  review 形状: %s %s' % ('blob(主流)' if isblob else 'radius(少数派)', 'OK' if isblob else 'FAIL'))

    for bad in theme_bad:
        n = len(re.findall(re.escape(bad), h))
        if n: ok = False; print('  残留 %s x%d' % (bad, n))

    used = set(re.findall(r'var\((--[a-z0-9\-]+)\)', h))
    defined = set(re.findall(r'(--[a-z0-9\-]+):', h))
    miss = used - defined
    if miss: ok = False; print('  未定义变量:', miss)
    else: print('  CSS 变量闭合: OK')

    print('  => %s' % ('ALL PASS' if ok else 'HAS ERRORS'))
    print()
    return ok

a = check('D:/apt/英语单词/uniform.html', 'uniform',
          ['chain','Chain','union','mustard','brick','plum','page-chains','hero-chain',
           'ring-chain','letterChain','chainDrift','chainShift','chainDraw'])
b = check('D:/apt/英语单词/formal.html', 'formal',
          ['chain','Chain','union','mustard','brick','plum','page-chains','hero-chain',
           'letterChain','chainDrift','chainShift','chainDraw'])
print('OVERALL:', 'ALL PASS' if (a and b) else 'HAS ERRORS')
