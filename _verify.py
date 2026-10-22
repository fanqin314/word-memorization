# -*- coding: utf-8 -*-
import re, io

OUT = 'D:/apt/英语单词/uniform.html'
h = io.open(OUT, encoding='utf-8').read()
ok = True

# 1) 标签配平
print('--- 1. 标签配平 ---')
for tag in ['html','head','body','style','script','article','section','div','svg','g',
            'table','tbody','tr','td','span','p','ul','li','button','textarea','text']:
    o = len(re.findall(r'<'+tag+r'[\s>]', h)); c = len(re.findall(r'</'+tag+r'>', h))
    if o != c:
        ok = False; print('  MISMATCH %-8s open=%d close=%d' % (tag, o, c))
print('  全部配平' if ok else '  有错')

# 2) 数量必须与全库约定一致
print('--- 2. 数量约定 (fam6 col5 ex4 pit3 tr6 fill5) ---')
exp = {'fam-card': 6, 'collo': 5, 'real-ex': 4, 'pitfall-item': 3, 'fill-item': 5}
for k, v in exp.items():
    n = len(re.findall(r'class="'+k+r'[\s"]', h))
    flag = 'OK' if n == v else 'FAIL'
    if n != v: ok = False
    print('  %-14s = %d (期望 %d) %s' % (k, n, v, flag))
n = len(re.findall(r'<tr', h))
print('  tr             = %d (期望 6) %s' % (n, 'OK' if n == 6 else 'FAIL'))
if n != 6: ok = False

# 3) 9 大节区 + 标题
print('--- 3. 九大节区 ---')
secs = re.findall(r'<span>(\S+?[^<]*?)</span>\s*\n', h)
want = ['词根 · 词族','意象卡 · 一句话记住','核心搭配 · 语块记忆','真题例句 · 语境记忆',
        '易错提醒 · 先防错','易混辨析 · 一句话区分','首字母填空 · 提取练习','造句练习 · 产出','复习打卡 · 点击标记']
got = [s for s in secs if s in want]
print('  命中 %d/9' % len(got))
if got != want:
    ok = False; print('  FAIL', got)
else:
    print('  OK 顺序与命名完全一致')

# 4) 不得残留 union 主题词
print('--- 4. 无模板残留 ---')
for bad in ['chain', 'Chain', 'union', 'mustard', 'brick', 'plum', 'page-chains',
            'hero-chain', 'ring-chain', 'letterChain', 'chainDrift', 'chainShift', 'chainDraw']:
    n = len(re.findall(re.escape(bad), h))
    if n:
        ok = False; print('  残留 %-14s x%d' % (bad, n))
print('  无残留' if ok else '')

# 5) 关键 class 是否被使用
print('--- 5. 关键类名就位 ---')
for c in ['page-stripes','hero-stripe-svg','stripe-line','ufig','align-line','seal',
          'letter l7','letterStripe','figDrop','alignSlide','sealBreath','stripeDrift','plaidShift']:
    n = len(re.findall(re.escape(c), h))
    st = 'OK' if n else 'MISSING'
    if not n: ok = False
    print('  %-16s x%-3d %s' % (c, n, st))

# 6) 变体词名合法
print('--- 6. 变量闭合 ---')
used = set(re.findall(r'var\((--[a-z0-9\-]+)\)', h))
defined = set(re.findall(r'(--[a-z0-9\-]+):', h))
miss = used - defined
print('  未定义的变量:', miss if miss else '无')
if miss: ok = False

# 7) 单词本身
print('--- 7. 词条信息 ---')
for pat, lbl in [(r'<title>([^<]+)</title>','title'),
                 (r'aria-label="([^"]+)"','aria'),
                 (r'class="ipa-anim"[^>]*>([^<]+)<','ipa'),
                 (r'class="pos-anim">([^<]+)<','pos'),
                 (r'class="spell-hint">([^<]+)<','hint')]:
    m = re.search(pat, h)
    print('  %-6s %s' % (lbl, m.group(1) if m else '?'))

print()
print('RESULT:', 'ALL PASS' if ok else 'HAS ERRORS')
