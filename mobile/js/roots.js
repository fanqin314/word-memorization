/* 词根 · 手机版：按词族排版，可切换「按词数 / 按字母」；
   只有一个单词的词根统一收进底部折叠区，不占版面。 */

let rootsBuilt = false;
let rootsGroups = [];
let rtSort = 'count';          /* 'count' | 'alpha' */
let rtOpen = new Set();        /* 展开的词族 key */
let rtSoloOpen = false;        /* 单字词根区是否展开 */
let rtMode = 'graph';          /* 'graph' 知识图谱 | 'list' 词族列表 */

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
        '<div class="rt-hero-top">' +
          '<div class="rt-eyebrow">Root Atlas</div>' +
          '<div class="rt-switch" id="rtSwitch">' +
            '<button type="button" data-mode="graph" class="on">图谱</button>' +
            '<button type="button" data-mode="list">列表</button>' +
          '</div>' +
        '</div>' +
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
        '<button class="rt-reset" id="rtGraphReset" type="button" aria-label="重置视图">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10a8 8 0 1 1 2.3 6"/><path d="M4 4.5V10h5.5"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="rt-graph" id="rtGraph">' +
        '<canvas id="rtCanvas"></canvas>' +
        '<div class="rt-graph-tip">拖动平移 · 双指缩放 · 点节点看详情</div>' +
        '<div class="rt-ginfo" id="rtGInfo" hidden></div>' +
      '</div>' +
      '<div class="rt-list" id="rtList"></div>';

    /* 默认展开词数最多的那一族，首屏就能看到内容 */
    const top = rtBigSorted()[0];
    if(top) rtOpen.add(top.key);

    document.getElementById('rtSearch').addEventListener('input', e => rtSearch(e.target.value));

    document.getElementById('rtSort').addEventListener('click', e => {
      const btn = e.target.closest('[data-sort]');
      if(!btn || btn.dataset.sort === rtSort) return;
      rtSort = btn.dataset.sort;
      document.querySelectorAll('#rtSort button').forEach(b => b.classList.toggle('on', b.dataset.sort === rtSort));
      rtRenderList(document.getElementById('rtSearch').value, true);
    });

    document.getElementById('rtSwitch').addEventListener('click', e => {
      const btn = e.target.closest('[data-mode]');
      if(!btn || btn.dataset.mode === rtMode) return;
      rtSetMode(btn.dataset.mode);
      sfxPlay('tap');
    });

    document.getElementById('rtGraphReset').addEventListener('click', () => {
      rtG.sel = null; rtG.hi = new Set(); rtG.dim = null;
      rtHideInfo();
      rtG.autoFrame = false;
      rtFitView();
      rtDraw();
      sfxPlay('tap');
    });

    document.getElementById('rtGInfo').addEventListener('click', e => {
      if(e.target.closest('[data-gi-close]')){
        rtG.sel = null; rtG.hi = new Set(); rtG.dim = null;
        rtHideInfo();
        rtDraw();
      }
    });

    rtInitCanvas();
  }

  rtSetMode(rtMode, true);
}

/* 搜索：图谱里做高亮过滤，列表里做筛选重排 */
function rtSearch(v){
  if(rtMode === 'graph') rtGraphApplyFilter(String(v || '').trim().toLowerCase());
  else rtRenderList(v, false);
}

function rtSetMode(mode, silent){
  rtMode = mode;
  const view = document.getElementById('view-roots');
  if(!view) return;
  view.classList.toggle('rt-graph-on', mode === 'graph');
  document.querySelectorAll('#rtSwitch button').forEach(b =>
    b.classList.toggle('on', b.dataset.mode === mode));
  const q = (document.getElementById('rtSearch') || {}).value || '';
  if(mode === 'graph'){
    rtGraphStart();
    rtGraphApplyFilter(String(q).trim().toLowerCase());
  } else {
    rtGraphStop();
    rtRenderList(q, !silent);
  }
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
    rtSetStat(matched.size, shownRoots, singles.length);
  } else {
    rtSetStat(WORDS.length, rootsGroups.filter(g => g.kind !== 'solo').length, singles.length);
  }
}

function rtSetStat(words, roots, singles){
  const countEl = document.getElementById('rtStatCount');
  const rootsEl = document.getElementById('rtStatRoots');
  const soloEl = document.getElementById('rtStatSolo');
  if(countEl) countEl.textContent = words;
  if(rootsEl) rootsEl.textContent = roots;
  if(soloEl) soloEl.textContent = singles;
}

/* ============================================================
   知识图谱：词根是主节点，单词挂在周围；
   力导向布局 + 拖动平移 + 双指缩放 + 点节点看详情
   ============================================================ */
const rtG = {
  nodes: [], links: [],
  alpha: 0, raf: 0, running: false, built: false,
  w: 0, h: 0, dpr: 1, autoFrame: true,
  view: { k: 1, tx: 0, ty: 0 },
  sel: null, hi: new Set(), dim: null
};

function rtBuildGraph(){
  const nodes = [];
  rtG.links = [];
  let seq = 0;
  const groups = rootsGroups.filter(g => g.kind !== 'solo');
  const solo = rootsGroups.find(g => g.kind === 'solo');
  const list = groups.slice();
  if(solo) list.push({ key: '__solo', kind: 'solo', label: '借词', meaning: '整体记忆', words: solo.words });

  const R = 170;
  list.forEach((g, i) => {
    const ang = Math.random() * Math.PI * 2;
    const rad = R * Math.sqrt(Math.random());
    const root = {
      id: 'n' + (seq++),
      kind: g.kind === 'official' ? 'official' : (g.kind === 'solo' ? 'solo' : 'stem'),
      label: g.label || '借词',
      meaning: g.meaning || '',
      wlist: g.words.slice(),
      x: Math.cos(ang) * rad, y: Math.sin(ang) * rad,
      vx: 0, vy: 0,
      r: 5 + Math.min(7, Math.sqrt(g.words.length) * 2.4)
    };
    nodes.push(root);
    const n = g.words.length;
    g.words.forEach((w, j) => {
      const a2 = ang + (j - (n - 1) / 2) * 0.5 + (Math.random() - .5) * .8;
      const d = 30 + Math.random() * 30;
      const wn = {
        id: 'n' + (seq++),
        kind: 'word',
        label: w.word,
        word: w,
        x: root.x + Math.cos(a2) * d,
        y: root.y + Math.sin(a2) * d,
        vx: 0, vy: 0, r: 3.6
      };
      nodes.push(wn);
      rtG.links.push({ a: root, b: wn, len: 42 });
    });
  });

  rtG.nodes = nodes;
  rtG.alpha = 1;
  rtG.autoFrame = true;
}

function rtGraphStart(){
  if(!rtG.built){ rtG.built = true; rtBuildGraph(); }
  rtResize();
  if(rtG.autoFrame) rtFitView();
  if(!rtG.raf && document.getElementById('rtGraph')){
    rtG.running = true;
    rtG.raf = requestAnimationFrame(rtLoop);
  }
  rtDraw();
}

function rtGraphStop(){
  if(rtG.raf) cancelAnimationFrame(rtG.raf);
  rtG.raf = 0;
  rtG.running = false;
}

function rtResize(){
  const wrap = document.getElementById('rtGraph');
  const cv = document.getElementById('rtCanvas');
  const main = document.querySelector('.main');
  if(!wrap || !cv || !main) return;

  /* 满屏：宽度靠 CSS 左右出血，高度填满工具行到屏幕底部之间的剩余空间 */
  const wrapTop = wrap.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop;
  const availH = main.clientHeight - wrapTop;
  if(availH > 0){
    wrap.style.width = '';
    wrap.style.height = Math.max(260, availH) + 'px';
  }

  const w = wrap.clientWidth, h = wrap.clientHeight;
  if(!w || !h) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  cv.style.width = w + 'px';
  cv.style.height = h + 'px';
  rtG.w = w; rtG.h = h; rtG.dpr = dpr;
}

function rtFitView(){
  const nodes = rtG.nodes;
  if(!rtG.w || !nodes.length) return;
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  nodes.forEach(n => {
    if(n.x < minX) minX = n.x;
    if(n.y < minY) minY = n.y;
    if(n.x > maxX) maxX = n.x;
    if(n.y > maxY) maxY = n.y;
  });
  const padX = 26, padY = 34;
  const bw = Math.max(1, maxX - minX), bh = Math.max(1, maxY - minY);
  const k = Math.max(.3, Math.min(1.4, Math.min((rtG.w - padX * 2) / bw, (rtG.h - padY * 2) / bh)));
  rtG.view.k = k;
  rtG.view.tx = rtG.w / 2 - (minX + maxX) / 2 * k;
  /* 标签挂在节点下方，底部多留一点 */
  rtG.view.ty = rtG.h / 2 - (minY + maxY) / 2 * k - 6;
}

function rtLoop(){
  rtG.raf = 0;
  if(!rtG.running) return;
  const view = document.getElementById('view-roots');
  if(!view || !view.classList.contains('active')){ rtG.running = false; return; }
  rtSimStep();
  if(rtG.autoFrame) rtFitView();
  if(rtG.alpha < .012){
    rtG.alpha = 0;
    rtG.running = false;
    rtG.autoFrame = false;
    rtFitView();
    rtDraw();
    return;
  }
  rtDraw();
  rtG.raf = requestAnimationFrame(rtLoop);
}

function rtReheat(a){
  rtG.alpha = Math.max(rtG.alpha, a || .6);
  if(!rtG.running){
    rtG.running = true;
    rtG.raf = requestAnimationFrame(rtLoop);
  }
}

function rtSimStep(){
  const nodes = rtG.nodes, links = rtG.links, n = nodes.length;
  const a = rtG.alpha;
  for(let i = 0; i < n; i++){
    const p = nodes[i];
    for(let j = i + 1; j < n; j++){
      const q = nodes[j];
      let dx = q.x - p.x, dy = q.y - p.y;
      let d2 = dx * dx + dy * dy;
      if(d2 < .01){ dx = Math.random() - .5; dy = Math.random() - .5; d2 = .01; }
      if(d2 > 40000) continue;
      const f = 300 / d2 * a;
      const fx = dx * f, fy = dy * f;
      p.vx -= fx; p.vy -= fy;
      q.vx += fx; q.vy += fy;
    }
  }
  links.forEach(l => {
    const p = l.a, q = l.b;
    const dx = q.x - p.x, dy = q.y - p.y;
    const d = Math.sqrt(dx * dx + dy * dy) || .001;
    const f = (d - l.len) / d * .09 * a;
    p.vx += dx * f; p.vy += dy * f;
    q.vx -= dx * f; q.vy -= dy * f;
  });
  for(let i = 0; i < n; i++){
    const p = nodes[i];
    p.vx -= p.x * .03 * a;
    p.vy -= p.y * .03 * a;
    /* 软边界：不让图散到画布外，保持团状轮廓 */
    const rr = Math.hypot(p.x, p.y);
    if(rr > 220){
      const f = (rr - 220) * .5 * a;
      p.vx -= p.x / rr * f;
      p.vy -= p.y / rr * f;
    }
    p.vx *= .84; p.vy *= .84;
    const sp = Math.hypot(p.vx, p.vy);
    if(sp > 9){ p.vx = p.vx / sp * 9; p.vy = p.vy / sp * 9; }
    if(!p.fixed){ p.x += p.vx; p.y += p.vy; }
  }
  rtG.alpha *= .985;
}

/* ---------------- 绘制 ---------------- */
function rtDraw(){
  const cv = document.getElementById('rtCanvas');
  if(!cv || !rtG.w) return;
  const ctx = cv.getContext('2d');
  const k = rtG.view.k, tx = rtG.view.tx, ty = rtG.view.ty;
  ctx.setTransform(rtG.dpr, 0, 0, rtG.dpr, 0, 0);
  ctx.clearRect(0, 0, rtG.w, rtG.h);
  if(!rtG.nodes.length) return;

  const sel = rtG.sel, hi = rtG.hi, dim = rtG.dim;
  const isDim = id => !!(dim && dim.has(id));

  /* 连线 */
  rtG.links.forEach(l => {
    const active = sel && (l.a.id === sel || l.b.id === sel);
    if(active) ctx.strokeStyle = 'rgba(70,102,110,.78)';
    else if(dim) ctx.strokeStyle = isDim(l.a.id) && isDim(l.b.id) ? 'rgba(46,54,62,.05)' : 'rgba(46,54,62,.16)';
    else ctx.strokeStyle = 'rgba(46,54,62,.13)';
    ctx.lineWidth = active ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(l.a.x * k + tx, l.a.y * k + ty);
    ctx.lineTo(l.b.x * k + tx, l.b.y * k + ty);
    ctx.stroke();
  });

  /* 节点：先画单词小点，再画词根，避免被压住 */
  const fs = Math.max(.9, Math.min(1.35, k));
  const drawNode = nd => {
    const x = nd.x * k + tx, y = nd.y * k + ty;
    if(x < -50 || y < -50 || x > rtG.w + 50 || y > rtG.h + 50) return;
    const root = nd.kind !== 'word';
    const r = (root ? nd.r : 3.6) * fs;
    const dimmed = dim ? !dim.has(nd.id) : false;
    const lit = sel && (nd.id === sel || hi.has(nd.id));
    ctx.globalAlpha = dimmed ? .18 : 1;

    if(lit){
      ctx.beginPath();
      ctx.arc(x, y, r + 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(198,164,96,.16)';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if(root){
      ctx.fillStyle = nd.id === sel ? '#C08A3E'
        : (nd.kind === 'official' ? '#46666E' : (nd.kind === 'solo' ? '#A9B3B6' : '#4B565D'));
    } else {
      ctx.fillStyle = nd.id === sel ? '#C08A3E' : 'rgba(58,66,74,.40)';
    }
    ctx.fill();
    /* 白描边让节点在浅底上有纸片感 */
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255,255,255,.92)';
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const words = [], roots = [];
  rtG.nodes.forEach(nd => (nd.kind === 'word' ? words : roots).push(nd));
  words.forEach(drawNode);
  roots.forEach(drawNode);

  /* 标签：词根按词数优先排，放不下就跳过，避免糊成一团 */
  const placed = [];
  const canPlace = (x, y, w, h) => {
    for(let i = 0; i < placed.length; i++){
      const r = placed[i];
      if(x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y) return false;
    }
    placed.push({ x: x, y: y, w: w, h: h });
    return true;
  };

  const label = (nd, color, font, size) => {
    const x = nd.x * k + tx, y = nd.y * k + ty;
    const r = (nd.kind === 'word' ? 3.6 : nd.r) * fs;
    ctx.font = font;
    const w = ctx.measureText(nd.label).width;
    const lx = x - w / 2, ly = y + r + 3;
    if(lx < 2 || lx + w > rtG.w - 2 || ly + size > rtG.h - 2) return;
    if(!canPlace(lx, ly, w, size)) return;
    const dimmed = dim ? !dim.has(nd.id) : false;
    ctx.globalAlpha = dimmed ? .12 : 1;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(nd.label, lx, ly);
    ctx.globalAlpha = 1;
  };

  const ROOT_FONT = '600 10.5px Georgia, "Songti SC", "Times New Roman", serif';
  const WORD_FONT = '500 8.5px "Helvetica Neue", Arial, "PingFang SC", sans-serif';

  roots.slice()
    .sort((a, b) => b.wlist.length - a.wlist.length)
    .forEach(nd => {
      const major = nd.wlist.length >= 3 || nd.kind === 'official';
      if(!major && k < .9 && nd.id !== sel) return;
      label(nd, nd.id === sel ? '#8A6420' : 'rgba(34,41,48,.9)', ROOT_FONT, 11);
    });

  /* 放大到一定程度才显示单词小标签，避免默认视图糊成一团 */
  if(k > 1.45){
    words.forEach(nd => label(nd, 'rgba(58,66,74,.62)', WORD_FONT, 9));
  }
  ctx.globalAlpha = 1;
}

function rtHit(mx, my){
  const k = rtG.view.k, tx = rtG.view.tx, ty = rtG.view.ty;
  let best = null, bestD = 1e9;
  rtG.nodes.forEach(nd => {
    const x = nd.x * k + tx, y = nd.y * k + ty;
    const d = Math.hypot(mx - x, my - y);
    const lim = nd.kind === 'word' ? 14 : 20;
    if(d < lim && d < bestD){ bestD = d; best = nd; }
  });
  return best;
}

/* ---------------- 交互 ---------------- */
function rtInitCanvas(){
  const cv = document.getElementById('rtCanvas');
  if(!cv || cv.dataset.ready) return;
  cv.dataset.ready = '1';
  const pts = new Map();
  let start = null, pinch = null;

  /* 桌面端：滚轮 / Ctrl+滚轮 以指针为中心缩放 */
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    const step = e.ctrlKey ? .0026 : .0014;
    const k2 = Math.max(.3, Math.min(3.5, rtG.view.k * Math.exp(-e.deltaY * step)));
    const ratio = k2 / rtG.view.k;
    rtG.view.tx = e.offsetX - (e.offsetX - rtG.view.tx) * ratio;
    rtG.view.ty = e.offsetY - (e.offsetY - rtG.view.ty) * ratio;
    rtG.view.k = k2;
    rtG.autoFrame = false;
    rtDraw();
  }, { passive:false });

  cv.addEventListener('pointerdown', e => {
    try{ cv.setPointerCapture(e.pointerId); }catch(err){}
    pts.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    if(pts.size === 1){
      const nd = rtHit(e.offsetX, e.offsetY);
      start = { x: e.offsetX, y: e.offsetY, t: Date.now(), node: nd, moved: false, last: { x: e.offsetX, y: e.offsetY } };
      if(nd) nd.fixed = true;
    } else if(pts.size === 2){
      const arr = [...pts.values()];
      pinch = {
        d: Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y) || 1,
        k: rtG.view.k,
        cx: (arr[0].x + arr[1].x) / 2,
        cy: (arr[0].y + arr[1].y) / 2
      };
      start = null;
    }
  });

  cv.addEventListener('pointermove', e => {
    if(!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    if(pts.size >= 2 && pinch){
      const arr = [...pts.values()];
      const d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y) || 1;
      const k2 = Math.max(.3, Math.min(3, pinch.k * d / pinch.d));
      const ratio = k2 / rtG.view.k;
      rtG.view.tx = pinch.cx - (pinch.cx - rtG.view.tx) * ratio;
      rtG.view.ty = pinch.cy - (pinch.cy - rtG.view.ty) * ratio;
      rtG.view.k = k2;
      rtG.autoFrame = false;
      rtDraw();
      return;
    }
    if(!start) return;
    const dx = e.offsetX - start.x, dy = e.offsetY - start.y;
    if(Math.abs(dx) + Math.abs(dy) > 6) start.moved = true;
    if(start.node){
      const nd = start.node;
      nd.x += (e.offsetX - start.last.x) / rtG.view.k;
      nd.y += (e.offsetY - start.last.y) / rtG.view.k;
      nd.vx = nd.vy = 0;
      rtReheat(.3);
    } else {
      rtG.view.tx += e.offsetX - start.last.x;
      rtG.view.ty += e.offsetY - start.last.y;
      rtG.autoFrame = false;
    }
    start.last = { x: e.offsetX, y: e.offsetY };
    rtDraw();
  });

  const finish = e => {
    if(!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if(pts.size < 2) pinch = null;
    if(!start) return;
    const st = start;
    start = null;
    if(st.node) st.node.fixed = false;
    if(!st.moved && Date.now() - st.t < 420){
      if(st.node) rtSelectNode(st.node);
      else {
        rtG.sel = null; rtG.hi = new Set(); rtG.dim = null;
        rtHideInfo();
        rtDraw();
      }
    }
  };
  cv.addEventListener('pointerup', finish);
  cv.addEventListener('pointercancel', e => {
    pts.delete(e.pointerId);
    if(start && start.node) start.node.fixed = false;
    start = null;
    pinch = null;
  });

  /* 窗口尺寸变化（转屏、桌面缩放）时重新按可用高度取正方形 */
  window.addEventListener('resize', () => {
    const view = document.getElementById('view-roots');
    if(!view || !view.classList.contains('active') || rtMode !== 'graph') return;
    rtResize();
    rtFitView();
    rtDraw();
  });
}

function rtSelectNode(nd){
  rtG.sel = nd.id;
  rtG.hi = new Set([nd.id]);
  rtG.links.forEach(l => {
    if(l.a.id === nd.id) rtG.hi.add(l.b.id);
    if(l.b.id === nd.id) rtG.hi.add(l.a.id);
  });
  rtDraw();
  rtShowInfo(nd);
  sfxPlay('tap');
}

function rtHideInfo(){
  const box = document.getElementById('rtGInfo');
  if(box){ box.hidden = true; box.innerHTML = ''; }
}

function rtShowInfo(nd){
  const box = document.getElementById('rtGInfo');
  if(!box) return;
  let html = '<button class="rt-gi-x" type="button" data-gi-close aria-label="关闭">×</button>';
  if(nd.kind === 'word'){
    const w = nd.word;
    html +=
      '<div class="rt-gi-k">单词</div>' +
      '<div class="rt-gi-t">' + esc(w.word) + '</div>' +
      '<div class="rt-gi-s">' + esc(w.gloss || '') + '</div>' +
      '<a class="rt-gi-link" href="' + esc(rtHref(w)) + '">打开词卡 ›</a>';
  } else {
    html +=
      '<div class="rt-gi-k">' + (nd.kind === 'official' ? '核心词根' : (nd.kind === 'solo' ? '借词' : '词根')) +
        ' · ' + nd.wlist.length + ' 个词</div>' +
      '<div class="rt-gi-t">' + esc(nd.label) +
        (nd.meaning ? '<i>' + esc(nd.meaning) + '</i>' : '') + '</div>' +
      '<div class="rt-gi-chips">' +
        nd.wlist.map(w => '<a href="' + esc(rtHref(w)) + '"><b>' + esc(w.word) + '</b><span>' + esc(w.gloss || '') + '</span></a>').join('') +
      '</div>';
  }
  box.innerHTML = html;
  box.hidden = false;
}

/* 搜索过滤：命中的节点保持高亮，其余压暗 */
function rtGraphApplyFilter(q){
  if(!rtG.built) return;
  if(!q){
    rtG.dim = null;
    rtSetStat(WORDS.length, rootsGroups.filter(g => g.kind !== 'solo').length, rtSingleItems().length);
    rtDraw();
    return;
  }
  const on = new Set();
  rtG.nodes.forEach(nd => {
    if(nd.kind === 'word'){
      if(rtWordHit(nd.word, q)) on.add(nd.id);
    } else if((nd.label || '').toLowerCase().includes(q) || String(nd.meaning || '').toLowerCase().includes(q)){
      on.add(nd.id);
    }
  });
  /* 命中词根时，连带它的词；命中词时，连带它所属词根 */
  rtG.links.forEach(l => {
    if(on.has(l.a.id)) on.add(l.b.id);
    else if(on.has(l.b.id)) on.add(l.a.id);
  });
  let words = 0, roots = 0, singles = 0;
  rtG.nodes.forEach(nd => {
    if(!on.has(nd.id)) return;
    if(nd.kind === 'word') words++;
    else {
      roots++;
      if(nd.wlist.length === 1) singles++;
    }
  });
  rtG.dim = new Set(rtG.nodes.filter(nd => !on.has(nd.id)).map(nd => nd.id));
  rtSetStat(words, roots, singles);
  rtDraw();
}
