import re
for name in ['advance', 'satellite', 'union', 'diverse', 'enable', 'space']:
    h = open('D:/apt/英语单词/%s.html' % name, encoding='utf-8').read()
    blk = h[h.index('class="fam-grid"'):h.index('</div>\n      </div>\n    </section>')] if False else h[h.index('class="fam-grid"'):]
    cards = re.findall(r'<div class="fam-card">(.*?)</div></div>', blk, re.S)
    print('---', name)
    for c in cards[:8]:
        w = re.search(r'class="w">(.*?)</div>', c, re.S)
        p = re.search(r'class="pos">(.*?)</div>', c, re.S)
        m = re.search(r'class="m">(.*?)</div>', c, re.S)
        print('   ', (p.group(1) if p else '').strip(), '|', re.sub(r'<[^>]+>', '*', w.group(1) if w else ''), '|', (m.group(1) if m else '').strip())
