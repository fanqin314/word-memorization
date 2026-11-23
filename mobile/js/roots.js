/* 词根 · 手机版：按词族排版，可切换「按词数 / 按字母」；
   只有一个单词的词根统一收进底部折叠区，不占版面。 */

let rootsBuilt = false;
let rootsGroups = [];
let rtSort = 'count';          /* 'count' | 'alpha' */
let rtOpen = new Set();        /* 展开的词族 key */
let rtSoloOpen = false;        /* 单字词根区是否展开 */

const RT_OFFICIAL = {
  vers:   { label: 'vers · vert',     meaning: '转' },
  un:     { label: 'un · uni',        meaning: '一' },
  ann:    { label: 'ann',             meaning: '年' },
  contra: { label: 'contra · contro', meaning: '相反·对抗' },
  cor:    { label: 'cor',             meaning: '心·一致' }
};
const RT_ORDER = ['vers', 'un', 'ann', 'contra', 'cor'];

const RT_SUFFIX = new Set([
  'ate','ary','ry','ion','ual','ation','ition','ite','ive','y','e','al','ic','ous',
  'ify','ize','ise','ment','ence','ance','ty','er','or','ist','ism','ing','ed','s',
  'at','um','a','en','ant','ent','able','ible'
]);

function rtStemOf(morph){
  let t = String(morph || '');
  t = t.split('→')[0];
  t = t.replace(/（[^）]*）/g, ' ').replace(/\([^)]*\)/g, ' ');
  t = t.replace(/^(拉丁语|拉丁|古英语|古法语|中古英语|古诺斯语|古高地德语|希腊语|现代英语)\s*/, '');
  t = t.split(/\s*\/\s*/)[0];
  const parts = t.split(/\s*\+\s*/)
    .map(s => s.trim().replace(/^-+|-+$/g, '').toLowerCase())
    .filter(s => /^[a-z]{2,}$/.test(s) && !RT_SUFFIX.has(s));
  return parts.length ? parts[parts.length - 1] : '';
}

function rtGlossOf(morph, stem){
  const m = String(morph || '');
  const pairs = [...m.matchAll(/([a-zA-Z]{2,})\s*[＝=:：]\s*([^，。；）)]+)/g)];
  for(const p of pairs){
    const latin = p[1].toLowerCase();
    const k = Math.min(3, latin.length, stem.length);
    if(k >= 3 && latin.slice(0, k) === stem.slice(0, k)) return p[2].trim();
  }
  return '';
}

function rtBuildGroups(){
  const official = RT_ORDER.map(k => ({ key: k, kind: 'official', label: RT_OFFICIAL[k].label, meaning: RT_OFFICIAL[k].meaning, words: [] }));
  const byKey = Object.fromEntries(official.map(g => [g.key, g]));
  const stems = new Map();

  WORDS.forEach(w => {
    const roots = Array.isArray(w.roots) ? w.roots : [];
    const hit = roots.filter(r => RT_OFFICIAL[r]);
    if(hit.length){
      hit.forEach(r => byKey[r].words.push(w));
      return;
    }
    const stem = rtStemOf(w.morph);
    if(!stem){
      if(!stems.has('__solo')) stems.set('__solo', { key: '__solo', kind: 'solo', label: '', meaning: '', words: [] });
      stems.get('__solo').words.push(w);
      return;
    }
    if(!stems.has(stem)) stems.set(stem, { key: stem, kind: 'stem', label: stem, meaning: '', words: [] });
    stems.get(stem).words.push(w);
  });

  stems.forEach(g => {
    if(g.kind !== 'stem') return;
    for(const w of g.words){
      const gl = rtGlossOf(w.morph, g.key);
      if(gl && !g.meaning){ g.meaning = gl; break; }
    }
  });

  rootsGroups = official.filter(g => g.words.length).concat([...stems.values()]);
  rootsGroups.forEach(g => g.words.sort((a, b) => a.word.localeCompare(b.word)));
}

/* 词数 ≥2 的词族 */
function rtBigSorted(){
  const arr = rootsGroups.filter(g => g.words.length >= 2).slice();
  if(rtSort === 'alpha') arr.sort((a, b) => a.label.localeCompare(b.label, 'en'));
  else arr.sort((a, b) => b.words.length - a.words.length || a.label.localeCompare(b.label, 'en'));
  return arr;
}

/* 只有一个单词的词根 + 整体借词，全部摊平 */
function rtSingleItems(){
  const out = [];
  rootsGroups.forEach(g => {
    if(g.kind === 'solo') g.words.forEach(w => out.push({ stem: '借词', word: w }));
    else if(g.words.length === 1) out.push({ stem: g.label, word: g.words[0], meaning: g.meaning });
  });
  out.sort((a, b) => a.stem.localeCompare(b.stem, 'en') || a.word.word.localeCompare(b.word.word));
  return out;
}

function rtHref(w){
  return '../' + (w.file || ('cards/' + w.word.charAt(0) + '/' + w.word + '.html'));
}

function rtGroupHit(g, q){
  return g.label.toLowerCase().includes(q) || String(g.meaning || '').toLowerCase().includes(q);
}
function rtWordHit(w, q){
  return w.word.toLowerCase().includes(q) || String(w.gloss || '').toLowerCase().includes(q);
}

/* ---------------- 渲染 ---------------- */
function renderRoots(){
  const view = document.getElementById('view-roots');
  if(!view) return;

  if(!rootsBuilt){
    rootsBuilt = true;
    rtBuildGroups();

    view.innerHTML =
      '<div class="rt-hero">' +
        '<div class="rt-eyebrow">Root Atlas</div>' +
        '<h1>词根图谱</h1>' +
        '<div class="rt-sub"><b id="rtStatCount">' + WORDS.length + '</b> 个词 · ' +
          '<b id="rtStatRoots">' + rootsGroups.filter(g => g.kind !== 'solo').length + '</b> 个词根 · ' +
          '<b id="rtStatSolo">' + rtSingleItems().length + '</b> 个单字词根</div>' +
      '</div>' +
      '<div class="rt-tools">' +
        '<div class="search-box">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>' +
          '<input id="rtSearch" type="search" placeholder="搜词根、单词或释义…" autocomplete="off" autocapitalize="off" spellcheck="false">' +
        '</div>' +
        '<div class="rt-sort" id="rtSort">' +
          '<button type="button" data-sort="count" class="on">按词数</button>' +
          '<button type="button" data-sort="alpha">按字母</button>' +
        '</div>' +
      '</div>' +
      '<div class="rt-list" id="rtList"></div>';

    /* 默认展开词数最多的那一族，首屏就能看到内容 */
    const top = rtBigSorted()[0];
    if(top) rtOpen.add(top.key);

    document.getElementById('rtSearch').addEventListener('input', e => rtRenderList(e.target.value, false));

    document.getElementById('rtSort').addEventListener('click', e => {
      const btn = e.target.closest('[data-sort]');
      if(!btn || btn.dataset.sort === rtSort) return;
      rtSort = btn.dataset.sort;
      document.querySelectorAll('#rtSort button').forEach(b => b.classList.toggle('on', b.dataset.sort === rtSort));
      rtRenderList(document.getElementById('rtSearch').value, true);
    });

    document.getElementById('rtList').addEventListener('click', e => {
      const soloHead = e.target.closest('.rt-solo-head');
      if(soloHead){
        rtSoloOpen = !rtSoloOpen;
        soloHead.parentElement.classList.toggle('open', rtSoloOpen);
        return;
      }
      const head = e.target.closest('[data-toggle]');
      if(head){
        const key = head.dataset.toggle;
        if(rtOpen.has(key)) rtOpen.delete(key); else rtOpen.add(key);
        head.parentElement.classList.toggle('open', rtOpen.has(key));
      }
    });
  }

  rtRenderList(document.getElementById('rtSearch').value, true);
}

function rtRenderList(raw, animate){
  const list = document.getElementById('rtList');
  if(!list) return;
  const q = String(raw || '').trim().toLowerCase();
  list.classList.toggle('no-anim', !animate);

  const matched = new Set();
  let shownRoots = 0;
  let first = true;
  const cards = [];

  rtBigSorted().forEach(g => {
    const whole = !q || rtGroupHit(g, q);
    const words = whole ? g.words : g.words.filter(w => rtWordHit(w, q));
    if(!words.length) return;

    shownRoots++;
    words.forEach(w => matched.add(w.word));

    const open = q ? true : rtOpen.has(g.key);
    const lead = !q && rtSort === 'count' && first;
    first = false;

    cards.push(
      '<div class="rt-card' + (lead ? ' lead' : '') + (open ? ' open' : '') + '" data-key="' + esc(g.key) + '"' +
        ' style="animation-delay:' + (cards.length * 24) + 'ms">' +
        '<button class="rt-head" type="button" data-toggle="' + esc(g.key) + '">' +
          '<span class="rt-no">' + String(shownRoots).padStart(2, '0') + '</span>' +
          '<span class="rt-stem">' + esc(g.label) + '</span>' +
          (g.meaning ? '<span class="rt-mean">' + esc(g.meaning) + '</span>' : '') +
          (g.kind === 'official' ? '<span class="rt-badge">核心</span>' : '') +
          '<span class="rt-n">' + words.length + '</span>' +
          '<svg class="rt-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' +
        '</button>' +
        '<div class="rt-words">' +
          words.map(w => '<a class="rt-w" href="' + esc(rtHref(w)) + '"><b>' + esc(w.word) + '</b><span>' + esc(w.gloss) + '</span></a>').join('') +
        '</div>' +
      '</div>'
    );
  });

  /* 单字词根：合并在一个折叠区里 */
  const singles = rtSingleItems().filter(it =>
    !q || it.stem.toLowerCase().includes(q) || rtWordHit(it.word, q));
  singles.forEach(it => matched.add(it.word.word));

  let soloHtml = '';
  if(singles.length){
    const soloOpen = q ? true : rtSoloOpen;
    soloHtml =
      '<div class="rt-solo' + (soloOpen ? ' open' : '') + '">' +
        '<button class="rt-solo-head" type="button">' +
          '<b>单字词根</b><span>一个词根带一个词</span>' +
          '<span class="rt-n">' + singles.length + '</span>' +
          '<svg class="rt-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' +
        '</button>' +
        '<div class="rt-solo-chips">' +
          singles.map(it => '<a class="rt-chip" href="' + esc(rtHref(it.word)) + '">' +
            '<b>' + esc(it.stem) + '</b><i>' + esc(it.word.word) + '</i></a>').join('') +
        '</div>' +
      '</div>';
  }

  list.innerHTML = cards.join('') + soloHtml;

  if(!cards.length && !singles.length){
    list.innerHTML = '<div class="rt-empty"><b>没有匹配的词根或单词</b>换个关键词试试，或清空搜索框。</div>';
  }

  const countEl = document.getElementById('rtStatCount');
  const rootsEl = document.getElementById('rtStatRoots');
  const soloEl = document.getElementById('rtStatSolo');
  if(q){
    countEl.textContent = matched.size;
    rootsEl.textContent = shownRoots;
    soloEl.textContent = singles.length;
  } else {
    countEl.textContent = WORDS.length;
    rootsEl.textContent = rootsGroups.filter(g => g.kind !== 'solo').length;
    soloEl.textContent = singles.length;
  }
}
