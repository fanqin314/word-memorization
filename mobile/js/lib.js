/* 词库：字母方块、飞入详情、搜索与筛选、刷这组 */

/* ============================================================
   词库：字母方块 + 分组详情
   字母方块按掌握度聚合上色；点开飞入详情，词卡两列；
   搜索按单词/释义过滤；「刷这组」把刷词队列临时换成该组。
   ============================================================ */
let libBuilt = false;
let libFilter = '';
let libMst = 'all';             /* 掌握度筛选：all / '0' 未学 / '1' 学习中 / '2' 已掌握 */
let libGroups = new Map();      /* 当前过滤结果：字母 → 词[] */
let libCurrent = null;          /* 已展开的字母 */
let libLetterMst = 'all';       /* 详情层里该字母自己的分类：all / '0' / '1' / '2' */
let libAnimating = false;
let libTimer = null;

function renderLib(){
  const view = document.getElementById('view-lib');
  if(!libBuilt){
    libBuilt = true;
    view.innerHTML =
      '<div class="lib-stat"><b id="libStatCount">' + WORDS.length + '</b> 个词 · ' +
        '<b id="libStatLetters">0</b> 个字母</div>' +
      '<div class="lib-top"><div class="search-box">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>' +
        '<input id="libSearch" type="search" placeholder="搜单词或释义…" autocomplete="off" autocapitalize="off" spellcheck="false">' +
        '<button class="clear" id="libClear" type="button" aria-label="清空" hidden>×</button>' +
      '</div></div>' +
      '<div class="lib-mst" id="libMst"></div>' +
      '<div class="lib-stage"><div class="lib-grid" id="libGrid"></div>' +
        '<div class="lib-detail" id="libDetail"></div></div>';

    const qEl = document.getElementById('libSearch');
    const clearBtn = document.getElementById('libClear');
    qEl.addEventListener('input', (e) => {
      clearBtn.hidden = !e.target.value;
      const v = e.target.value;
      clearTimeout(libTimer);
      libTimer = setTimeout(() => {
        if(libCurrent) hardCloseLib();
        renderLibGrid(v.trim().toLowerCase());
      }, 140);
    });
    clearBtn.addEventListener('click', () => {
      qEl.value = '';
      clearBtn.hidden = true;
      libFilter = '';
      if(libCurrent) hardCloseLib();
      renderLibGrid('');
      qEl.focus();
    });

    /* 掌握度分类：切换筛选，或直接按这一类开刷 */
    document.getElementById('libMst').addEventListener('click', (e) => {
      const chip = e.target.closest('.m-chip');
      if(chip){
        const v = chip.dataset.mst;
        if(v === libMst) return;
        libMst = v;
        if(libCurrent) hardCloseLib();
        renderLibGrid(libFilter);
        return;
      }
      if(e.target.closest('#libMstBrush')) queueLibMst();
    });

    /* 下滑关闭详情层；列表已滚动时不拦 */
    const detail = document.getElementById('libDetail');
    let touchY = 0, touchBlocked = false;
    detail.addEventListener('touchstart', (e) => {
      if(!libCurrent) return;
      const scroller = detail.querySelector('.detail-scroll');
      touchBlocked = !!(scroller && scroller.scrollTop > 0);
      touchY = e.touches[0].clientY;
    }, {passive: true});
    detail.addEventListener('touchmove', (e) => {
      if(!libCurrent || touchBlocked) return;
      if(e.touches[0].clientY - touchY > 80){ closeLibLetter(); touchBlocked = true; }
    }, {passive: true});

    document.getElementById('libGrid').addEventListener('click', (e) => {
      const spec = e.target.closest('.spec');
      if(!spec) return;
      openLibLetter(spec.dataset.letter);
    });
  }
  if(libCurrent) hardCloseLib();
  renderLibGrid(libFilter);
}

/* 关键词过滤（匹配单词或释义） */
function libSearchWords(q){
  const s = (q || '').toLowerCase();
  if(!s) return WORDS.slice();
  return WORDS.filter(w => w.word.toLowerCase().includes(s) || (w.gloss || '').toLowerCase().includes(s));
}

/* 关键词 + 掌握度过滤后的全部词 */
function libMstWords(q){
  const base = libSearchWords(q);
  return libMst === 'all' ? base : base.filter(w => String(masteryOf(w.word)) === libMst);
}

/* 某个字母的全部词：只跟关键词走，不套外面那行的掌握度筛选——
   详情层有自己的分类条，打开一个字母就是翻开它自己那一页 */
function libLetterWords(L){
  return libSearchWords(libFilter).filter(w => ((w.word[0] || '#').toUpperCase()) === L);
}

/* 按首字母分组 */
function libGroupsOf(q){
  const map = new Map();
  libMstWords(q).forEach(w => {
    const L = (w.word[0] || '#').toUpperCase();
    if(!map.has(L)) map.set(L, []);
    map.get(L).push(w);
  });
  map.forEach(list => list.sort((a, b) => a.word.localeCompare(b)));
  return map;
}

/* 方块颜色 = 该组掌握状态的聚合：全灰 / 琥珀 / 苔绿 */
function libGroupColor(list){
  const n = list.length;
  const m1 = list.filter(w => masteryOf(w.word) === 1).length;
  const m2 = list.filter(w => masteryOf(w.word) === 2).length;
  if(n > 0 && m2 === n) return '#6F8B74';
  if(m1 + m2 === 0) return '#8F9296';
  return '#BB9A5A';
}

/* 字体样本册：每个字母一副面孔，名字印在字脚下 */
const LIB_FACE = {
  a:'Helvetica Black', b:'Georgia Regular', c:'Impact Condensed', d:'Outline 2pt',
  e:'Helvetica Extended', f:'Brush Script', h:'Drop Shadow', i:'Helvetica Narrow',
  l:'Italic Slant', n:'Halftone Dot', o:'Helvetica Round', p:'Rule Underline',
  r:'Mirror Reverse', s:'Inverse Block', t:'Georgia Boxed', u:'Double Rule',
  w:'Helvetica Wide'
};

/* 字母 → 字体样本键：字母墙与详情徽章共用同一副面孔 */
function libFaceKey(L){
  return /^[A-Z]$/.test(L) ? L.toLowerCase() : 'o';
}

/* 17 副面孔的矢量轮廓：从系统字体里抽出的字形，归一化到 cap-height = 100。
   手机上没装对应字体也不会变样，缩放/旋转都不会发糊 */
const LIB_GLYPH = {
  a:{w:108.9,d:'M71.6 83.5H36.4L31.6 100H0L37.6 0H71.3L108.9 100H76.5ZM65.1 61.9 54.1 25.9 43.1 61.9Z'},
  b:{w:81.3,d:'M71.1 53.4Q75.5 56.4 78.4 61.2Q81.3 66 81.3 72.8Q81.3 79.8 78.2 84.9Q75.2 90.1 70.3 93.4Q65.6 96.6 59.7 98.3Q53.7 100 47.4 100H0V95Q1.7 94.9 4.9 94.4Q8.2 93.9 9.6 93.3Q11.8 92.3 12.7 90.7Q13.6 89 13.6 86.4V14.5Q13.6 12.1 12.8 10.3Q12 8.5 9.6 7.3Q7.5 6.3 4.9 5.7Q2.3 5.1 0.5 5V0H46.7Q52 0 56.9 1.1Q61.8 2.1 66.2 4.8Q70.4 7.3 73.1 11.5Q75.8 15.7 75.8 21.8Q75.8 27.1 73.9 31.2Q72 35.3 68.5 38.3Q65.3 41.1 61.1 43Q56.9 45 52 46V46.7Q56.3 47.1 61.6 48.8Q66.9 50.5 71.1 53.4ZM54.1 38.3Q56.7 35.3 57.8 31.7Q58.8 28.1 58.8 23.2Q58.8 14.9 54.3 10.3Q49.8 5.6 40 5.6Q37.8 5.6 34.4 5.7Q30.9 5.8 28.6 5.8V44.3H37.6Q43.3 44.3 47.5 42.8Q51.6 41.3 54.1 38.3ZM63.8 70.3Q63.8 61.4 57.9 55.7Q51.9 50 40.9 50Q36.4 50 33.3 50.1Q30.2 50.2 28.6 50.2V85.5Q28.6 89.9 32.2 92.2Q35.8 94.4 42.2 94.4Q52.7 94.4 58.3 88.3Q63.8 82.2 63.8 70.3Z'},
  c:{w:59,d:'M59 43.9H34V27.1Q34 19.9 33.2 18Q32.4 16.2 29.7 16.2Q26.6 16.2 25.8 18.4Q25 20.6 25 27.9V72.5Q25 79.5 25.8 81.6Q26.6 83.8 29.5 83.8Q32.3 83.8 33.2 81.6Q34 79.5 34 71.6V59.6H59V63.3Q59 78.2 56.9 84.4Q54.8 90.6 47.6 95.3Q40.4 100 29.8 100Q18.9 100 11.7 96Q4.6 92.1 2.3 85Q0 78 0 63.9V35.9Q0 25.5 0.7 20.3Q1.4 15.1 4.9 10.3Q8.5 5.5 14.7 2.8Q21 0 29.1 0Q40.1 0 47.3 4.3Q54.5 8.5 56.7 14.9Q59 21.3 59 34.7Z'},
  d:{w:92,d:'M0 0H45.9Q59.5 0 67.8 3.7Q76.2 7.4 81.7 14.3Q87.1 21.1 89.6 30.3Q92 39.4 92 49.7Q92 65.7 88.4 74.5Q84.7 83.4 78.2 89.3Q71.8 95.3 64.3 97.3Q54.2 100 45.9 100H0ZM30.9 22.6V77.3H38.5Q48.2 77.3 52.3 75.1Q56.3 73 58.7 67.6Q61 62.3 61 50.3Q61 34.4 55.8 28.5Q50.6 22.6 38.6 22.6Z'},
  e:{w:84.3,d:'M0 0H82.8V21.4H31V37.2H79.1V57.6H31V77.4H84.3V100H0Z'},
  f:{w:79.9,d:'M41.6 49H51.1Q59.4 37.9 63.7 29.7Q68 21.4 68 18.8Q68 15.2 61.8 15.2Q58.2 15.6 49.1 16.8Q39.9 18 31.4 19.7Q23.7 21.2 19.1 22.7Q14.4 24.3 12.5 25.3Q10.6 26.3 10.2 26.7Q14.9 26.5 18.1 26.5Q23.1 26.5 23.1 27.6Q23.1 28.1 19.6 28.9Q16.1 29.7 12.9 30.6Q9.8 31.4 6.9 32.6Q4 33.8 3.3 33.8Q1.9 33.8 0.9 32.7Q0 31.6 0 30.1Q0 29 1.7 24.5Q3.5 20 6.6 15.4Q9.8 10.8 14.4 8.6Q16.1 7.8 25.3 5.7Q34.5 3.5 46 1.8Q57.5 0 67.1 0Q72.9 0 76.4 1.6Q79.9 3.2 79.9 8.5Q79.9 10.2 78.6 13.8Q77.4 17.3 74.6 22.9Q71.9 28.4 68 35Q64 41.7 59 49H68.7L60.3 61.1Q58.6 61.2 56 61.2Q53.5 61.3 50.5 61.4Q42.7 71.5 33.7 80.4Q24.6 89.3 17.3 94.6Q10 100 7 100Q5.8 100 4.9 99.2Q4 98.4 4 97.2Q4 96.1 6.8 91.7Q9.6 87.3 14.6 83.4Q19.6 79.6 26 79.1Q28.5 76.4 30.4 74.3Q32.3 72.2 35.7 68.2Q39.1 64.2 40.9 62.1L21.9 63Q18.8 63.1 17.7 62.7Q16.5 62.3 16.5 60.7Q16.5 60.7 17.1 59.1Q17.8 57.5 18.5 56.3Q19.5 54.4 20.1 54.1Q20.7 53.7 23.5 53.1L35.1 50.2Q39.8 49 41.6 49Z'},
  h:{w:95.7,d:'M0 0H30.9V35H64.7V0H95.7V100H64.7V59.5H30.9V100H0Z'},
  i:{w:31,d:'M0 0H31V100H0Z'},
  l:{w:79.1,d:'M0 0H30.9V75.4H79.1V100H0Z'},
  n:{w:95.6,d:'M0 0H28.9L66.5 55.3V0H95.6V100H66.5L29.1 45.1V100H0Z'},
  o:{w:93.8,d:'M0 50.6Q0 35.8 4.4 25.8Q7.7 18.4 13.4 12.5Q19.1 6.7 25.9 3.8Q35 0 46.8 0Q68.1 0 81 13.3Q93.8 26.5 93.8 50.1Q93.8 73.5 81.1 86.8Q68.3 100 47 100Q25.5 100 12.7 86.8Q0 73.7 0 50.6ZM20.1 49.9Q20.1 66.4 27.7 74.8Q35.3 83.3 47 83.3Q58.6 83.3 66.1 74.9Q73.6 66.5 73.6 49.7Q73.6 33 66.3 24.9Q59 16.7 47 16.7Q34.9 16.7 27.5 25Q20.1 33.2 20.1 49.9Z'},
  p:{w:84.9,d:'M0 0H51.4Q68.1 0 76.5 8Q84.9 16 84.9 30.7Q84.9 45.8 75.8 54.4Q66.6 62.9 48 62.9H31V100H0ZM31 42.6H38.6Q47.5 42.6 51.2 39.5Q54.8 36.4 54.8 31.6Q54.8 26.9 51.6 23.6Q48.5 20.3 39.8 20.3H31Z'},
  r:{w:98.4,d:'M0 100V0H51.5Q65.8 0 73.4 2.5Q81 4.9 85.6 11.6Q90.2 18.2 90.2 27.8Q90.2 36.1 86.7 42.1Q83.2 48.2 76.9 51.9Q73 54.3 66.1 55.9Q71.6 57.7 74.1 59.5Q75.9 60.8 79.1 64.8Q82.3 68.8 83.4 71L98.4 100H63.4L46.9 69.4Q43.8 63.5 41.3 61.7Q38 59.4 33.8 59.4H31V100ZM31 40.5H44.1Q46.2 40.5 52.3 39.2Q55.3 38.5 57.3 36Q59.2 33.5 59.2 30.2Q59.2 25.4 56.1 22.8Q53.1 20.2 44.6 20.2H31Z'},
  s:{w:87.7,d:'M0 66.4 28.4 64.6Q29.4 71.5 32.2 75.1Q36.8 81 45.4 81Q51.8 81 55.2 78Q58.7 75 58.7 71Q58.7 67.3 55.4 64.3Q52.1 61.3 40.1 58.7Q20.4 54.3 12.1 47Q3.6 39.6 3.6 28.3Q3.6 20.8 7.9 14.2Q12.3 7.6 20.9 3.8Q29.6 0 44.7 0Q63.3 0 73 6.9Q82.7 13.8 84.6 28.8L56.4 30.5Q55.3 23.9 51.7 21Q48.1 18 41.8 18Q36.5 18 33.9 20.2Q31.3 22.4 31.3 25.6Q31.3 27.9 33.4 29.7Q35.6 31.7 43.5 33.3Q63.1 37.5 71.5 41.9Q80 46.2 83.9 52.6Q87.7 59 87.7 66.9Q87.7 76.2 82.6 84Q77.4 91.9 68.2 95.9Q59 100 44.9 100Q20.3 100 10.8 90.5Q1.3 81 0 66.4Z'},
  t:{w:96.9,d:'M96.9 28.6H91.5Q89.3 22.2 84.5 14.9Q79.6 7.5 75.5 7Q73.3 6.7 70 6.5Q66.7 6.3 64.3 6.3H61V84.7Q61 87.2 61.9 89.2Q62.8 91.1 65.5 92.2Q67.1 92.9 70.5 93.6Q73.9 94.2 76.3 94.5V100H20.6V94.5Q22.6 94.3 26.3 93.9Q30 93.5 31.4 93Q34.1 91.8 35 89.9Q35.9 88 35.9 85.4V6.3H32.6Q30.2 6.3 26.9 6.5Q23.6 6.7 21.4 7Q17.3 7.5 12.4 14.9Q7.6 22.2 5.4 28.6H0V0H96.9Z'},
  u:{w:94.2,d:'M63.9 0H94.2V58.6Q94.2 67.3 91.5 75Q88.7 82.8 82.9 88.6Q77.1 94.4 70.8 96.7Q61.9 100 49.5 100Q42.4 100 33.9 99Q25.4 98 19.7 95Q14 92 9.3 86.5Q4.6 81 2.8 75.2Q0 65.8 0 58.6V0H30.3V60Q30.3 68 34.8 72.6Q39.2 77.1 47.1 77.1Q55 77.1 59.4 72.6Q63.9 68.2 63.9 60Z'},
  w:{w:139.8,d:'M0 0H29.3L39.9 55.9L55.3 0H84.6L100.1 55.9L110.6 0H139.8L117.8 100H87.5L70 37L52.5 100H22.2Z'}
};

let libGlyphSeq = 0;
/* 内联 SVG 字形：颜色全部走 currentColor，尺寸交给 .gl 的 CSS，
   halftone 那副面孔用点阵 pattern，id 每次自增避免重复 */
function libGlyph(sty){
  const g = LIB_GLYPH[sty] || LIB_GLYPH.a;
  let defs = '', fill = 'currentColor';
  if(sty === 'n'){
    const id = 'ht' + (++libGlyphSeq);
    defs = '<defs><pattern id="' + id + '" width="7" height="7" patternUnits="userSpaceOnUse">' +
      '<circle cx="1.8" cy="1.8" r="1.55" fill="currentColor"/></pattern></defs>';
    fill = 'url(#' + id + ')';
  }
  return '<svg class="gl" viewBox="0 0 ' + g.w + ' 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    defs + '<path d="' + g.d + '" fill="' + fill + '"/></svg>';
}

/* 字号与卡面尺寸随词量长大：1 词 56px 宽，9 词 128px 宽 */
function libSpecSize(n){
  const w = 56 + (Math.min(Math.max(n, 1), 9) - 1) * 9;
  const fs = Math.round(w * .86);
  return {w, fs, h: Math.round(fs * 1.08) + 48};
}

function libSorted(list){
  return list.slice().sort((a, b) =>
    masteryOf(a.word) - masteryOf(b.word) || a.word.localeCompare(b.word));
}

function renderLibGrid(q){
  libFilter = q || '';
  libGroups = libGroupsOf(libFilter);
  const used = Array.from(libGroups.keys()).sort();
  const total = used.reduce((n, L) => n + libGroups.get(L).length, 0);
  const cEl = document.getElementById('libStatCount');
  const lEl = document.getElementById('libStatLetters');
  if(cEl) cEl.textContent = total;
  if(lEl) lEl.textContent = used.length;

  /* 掌握度分类栏：数字按当前关键词过滤后的口径统计 */
  const base = libSearchWords(libFilter);
  const mrow = document.getElementById('libMst');
  if(mrow){
    const chips = [
      ['all', '全部', base.length],
      ['0', '未学', base.filter(w => masteryOf(w.word) === 0).length],
      ['1', '学习中', base.filter(w => masteryOf(w.word) === 1).length],
      ['2', '已掌握', base.filter(w => masteryOf(w.word) === 2).length]
    ];
    mrow.innerHTML = chips.map(c =>
      '<button class="m-chip' + (libMst === c[0] ? ' on' : '') + '" type="button" data-mst="' + c[0] + '">' +
        c[1] + '<b>' + c[2] + '</b></button>').join('') +
      '<button class="m-brush" type="button" id="libMstBrush"' + (total ? '' : ' hidden') + '>刷这些</button>';
  }

  const grid = document.getElementById('libGrid');
  if(!grid) return;
  if(!used.length){
    grid.innerHTML = '<div class="wempty">' +
      (libMst === 'all'
        ? '没有匹配的词，换个关键词试试'
        : (libFilter
          ? '「' + esc(libFilter) + '」里没有' + MST_LABEL[Number(libMst)] + '的词'
          : '这一类还没有词，换个掌握度试试')) + '</div>';
    return;
  }
  grid.classList.toggle('no-anim', !!libFilter);
  grid.innerHTML = used.map((L, i) => {
    const list = libGroups.get(L);
    const n = list.length;
    const done = list.filter(w => masteryOf(w.word) === 2).length;
    const sz = libSpecSize(n);
    const sty = libFaceKey(L);
    const state = done === 0 ? 0 : (done >= n ? 2 : 1);
    const stateLabel = MST_LABEL[state];
    const pct = Math.round(done / n * 100);
    return '<button class="spec" type="button" data-letter="' + esc(L) + '" data-style="' + sty + '"' +
      ' data-state="' + state + '"' +
      ' style="--w:' + sz.w + 'px;--h:' + sz.h + 'px;--fs:' + sz.fs + 'px;--i:' + i + '"' +
      ' aria-label="' + esc(L + ' 组，' + n + ' 个词，' + stateLabel + ' ' + done + '/' + n) + '">' +
      '<span class="glyph">' + libGlyph(sty) + '</span>' +
      '<span class="meta">' +
        '<span class="spec-letter">' + esc(L) + ' · ' + sz.fs + ' PT</span>' +
        '<span class="spec-font">' + (LIB_FACE[sty] || LIB_FACE.o) + '</span>' +
        '<span class="spec-state">' +
          '<span class="st"><i></i>' + stateLabel + '</span>' +
          '<span class="sn">' + done + '/' + n + '</span>' +
        '</span>' +
        '<span class="spec-bar"><i style="width:' + pct + '%"></i></span>' +
      '</span>' +
    '</button>';
  }).join('');
}

function renderLibDetail(L, list, hex, keepBadge){
  const detail = document.getElementById('libDetail');
  const sty = libFaceKey(L);
  const n = list.length;
  const done = list.filter(w => masteryOf(w.word) === 2).length;
  const pct = n ? Math.round(done / n * 100) : 0;

  /* 这个字母自己的分类：计数只看这一组，切换后只重排这一组的词卡 */
  const mCounts = [0, 1, 2].map(m => list.filter(w => masteryOf(w.word) === m).length);
  const chips = [
    ['all', '全部', n],
    ['0', '未学', mCounts[0]],
    ['1', '学习中', mCounts[1]],
    ['2', '已掌握', mCounts[2]]
  ];
  const shown = libLetterMst === 'all'
    ? libSorted(list)
    : libSorted(list.filter(w => String(masteryOf(w.word)) === libLetterMst));
  const withLead = shown.length >= 3;

  const cards = shown.map((w, i) => {
    const m = masteryOf(w.word);
    const chk = reviewDone(w.word);
    const isLead = withLead && i === 0;
    const idx = i + 1 < 10 ? '0' + (i + 1) : String(i + 1);
    const cap = (w.word.charAt(0) || '').toUpperCase();
    const wordHtml = isLead
      ? '<span class="w-cap">' + esc(cap) + '</span><span class="w-word-txt">' + esc(w.word) + '</span>'
      : esc(w.word);
    return '<div class="w-card' + (isLead ? ' lead' : '') + '" data-word="' + esc(w.word) + '"' +
      ' style="--i:' + i + '">' +
      '<div class="w-top"><span>No.' + idx + '</span><span>' + esc(L) + '</span></div>' +
      '<div class="w-word">' + wordHtml + '</div>' +
      '<div class="w-ipa">' + esc(w.ipa || '') + '</div>' +
      '<div class="w-gloss">' + esc(w.gloss) + '</div>' +
      '<div class="w-foot">' +
        '<span class="w-mst m' + m + '"><i></i>' + MST_LABEL[m] + '</span>' +
        '<span class="w-chk">' + (chk ? '打卡 ' + chk + '/4' : '') + '</span>' +
      '</div></div>';
  }).join('');

  detail.dataset.style = sty;
  detail.innerHTML =
    '<div class="detail-top">' +
      '<div class="detail-mst" id="libDetailMst">' +
        chips.map(c =>
          '<button class="m-chip' + (libLetterMst === c[0] ? ' on' : '') + '" type="button" data-lmst="' + c[0] + '">' +
            c[1] + '<b>' + c[2] + '</b></button>').join('') +
      '</div>' +
      '<button class="bulk-btn" id="libBulk" type="button"' + (shown.length ? '' : ' disabled') + '>刷这组</button>' +
    '</div>' +
    '<div class="badge-wrap">' +
      '<div class="badge" id="libBadge" role="button" tabindex="0" aria-label="返回字母">' + libGlyph(sty) + '</div>' +
      '<div class="badge-meta">' +
        '<div class="bm-row"><span class="bm-k">Letter</span><span class="bm-v">' + esc(L + ' · ' + n + ' W') + '</span></div>' +
        '<div class="bm-row"><span class="bm-k">Face</span><span class="bm-v">' + esc(LIB_FACE[sty] || LIB_FACE.o) + '</span></div>' +
        '<div class="bm-row"><span class="bm-k">Studied</span><span class="bm-v">' + done + ' / ' + n + '</span></div>' +
        '<div class="bm-bar"><i style="width:' + pct + '%;background:var(--ink)"></i></div>' +
      '</div>' +
    '</div>' +
    '<div class="detail-scroll">' +
      (cards
        ? '<div class="w-grid">' + cards + '</div>'
        : '<div class="wempty">' + (libLetterMst === 'all'
          ? '这个词母下还没有词'
          : '这个字母里没有' + MST_LABEL[Number(libLetterMst)] + '的词') + '</div>') +
    '</div>';

  /* 从字母墙飞进来时徽章要等落地才现身；在详情层里换分类时它已经在台上，保持可见 */
  if(keepBadge){
    const badge = document.getElementById('libBadge');
    if(badge) badge.style.visibility = 'visible';
  }
  /* 整页不再淡入，词卡各自错开一拍直接入场 */
  detail.querySelectorAll('.w-card').forEach((el, i) => {
    el.style.animationDelay = (i * 24) + 'ms';
    el.classList.add('in');
  });

  /* 点标本牌也能翻回字母墙 */
  document.getElementById('libBadge').addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    closeLibLetter();
  });
  document.getElementById('libBadge').addEventListener('keydown', (e) => {
    if(e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault(); e.stopPropagation();
    closeLibLetter();
  });
  document.getElementById('libBulk').addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    queueLibLetter(L, shown);
  });
  /* 本字母内的分类：只重排这一组的词卡，不离开详情层 */
  document.getElementById('libDetailMst').addEventListener('click', (e) => {
    const chip = e.target.closest('.m-chip');
    if(!chip) return;
    e.preventDefault(); e.stopPropagation();
    if(chip.dataset.lmst === libLetterMst) return;
    libLetterMst = chip.dataset.lmst;
    renderLibDetail(L, list, hex, true);
  });
  detail.querySelectorAll('.w-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const w = shown.find(x => x.word === card.dataset.word);
      if(w) location.href = '../' + w.file;
    });
  });
}

/* 不受 transform 影响的布局矩形：方块按下时的 scale(.92) 不会污染起点 */
function libRect(el){
  const r = el.getBoundingClientRect();
  const w = el.offsetWidth || r.width, h = el.offsetHeight || r.height;
  return {left:r.left + r.width / 2 - w / 2, top:r.top + r.height / 2 - h / 2, width:w, height:h};
}

/* 飞行动画：搬的是字形本体（内联 SVG），起落两端都取字形的真实盒子，
   缩放由外层统一做，克隆体自己保留原字形的倾斜/拉伸，落地不会变形 */
function libFly(fromRect, toRect, L, hex, fromEl, toEl){
  const srcG = fromEl.querySelector ? fromEl.querySelector('.gl') : null;
  const dstG = toEl.querySelector ? toEl.querySelector('.gl') : null;
  if(!srcG || !dstG) return null;

  const sR = srcG.getBoundingClientRect(), dR = dstG.getBoundingClientRect();
  const sCS = getComputedStyle(srcG), dCS = getComputedStyle(dstG);
  /* 未变形的布局盒：CSS 变体（拉伸/镜像）留在克隆体上，外层只做位移动画 */
  const lw = srcG.offsetWidth || Math.round(sR.width);
  const lh = srcG.offsetHeight || Math.round(sR.height);

  /* 反白字(S)无论在哪一侧都是墨块白字，飞行途中不跟着换色 */
  const inverse = libFaceKey(L) === 's';
  const f = document.createElement('div');
  f.className = 'flyer';
  f.dataset.style = libFaceKey(L);
  f.style.color = inverse ? '#20242A' : sCS.color;
  f.style.left = (sR.left + sR.width / 2 - lw / 2) + 'px';
  f.style.top = (sR.top + sR.height / 2 - lh / 2) + 'px';
  f.style.width = lw + 'px';
  f.style.height = lh + 'px';

  const c = srcG.cloneNode(true);
  c.style.width = lw + 'px';
  c.style.height = lh + 'px';
  c.style.boxSizing = 'border-box';
  f.appendChild(c);
  document.body.appendChild(f);

  const dx = (dR.left + dR.width / 2) - (sR.left + sR.width / 2);
  const dy = (dR.top + dR.height / 2) - (sR.top + sR.height / 2);
  const sx = dR.width / sR.width, sy = dR.height / sR.height;
  const ease = 'cubic-bezier(.22,.61,.36,1)';

  requestAnimationFrame(() => {
    f.style.transition = 'transform .38s ' + ease + ',color .3s ease';
    f.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';
    /* 颜色只写 color：字形填充、描边、点阵都跟着 currentColor 一起过渡 */
    if(!inverse) f.style.color = dCS.color;
  });
  return f;
}

/* 等 transform 真正到终点再交接，避免提前一帧造成落点错位 */
function libFlyEnd(f, done){
  if(!f){ done(); return; }
  let fired = false;
  const fire = () => { if(fired) return; fired = true; done(); };
  f.addEventListener('transitionend', (e) => { if(e.propertyName === 'transform') fire(); });
  setTimeout(fire, 480);
}

/* 详情层顶到外面那行分类条的位置：上沿和那一行齐平，
   打开后那一行就被同一张白纸盖住，位置正好交还给顶部条里的索引条；
   再往上就压到搜索框的下边缘了，所以只到这一行为止 */
function libDetailTopAtMst(detail){
  const row = document.getElementById('libMst');
  const stage = detail.parentElement;
  if(!row || !stage) return;
  detail.style.top = (row.getBoundingClientRect().top - stage.getBoundingClientRect().top) + 'px';
}

/* 外面那行分类条在详情层展开时让位：同一块地方只留一层芯片，不做两层叠加 */
function libMstAway(away){
  const row = document.getElementById('libMst');
  if(row) row.classList.toggle('away', !!away);
}

function openLibLetter(L){
  if(libAnimating) return;
  const grid = document.getElementById('libGrid');
  const detail = document.getElementById('libDetail');
  const src = grid.querySelector('[data-letter="' + L + '"]');
  if(!src) return;
  /* 翻开的是这个字母自己的一页：只跟当前关键词走，不套外面那行的分类 */
  const list = libLetterWords(L);
  if(!list.length) return;
  libAnimating = true;
  libCurrent = L;
  libLetterMst = 'all';     /* 每次翻开都从「全部」看起 */
  const hex = libGroupColor(libGroups.get(L) || list);

  const fromRect = libRect(src);
  src.classList.add('hide');
  grid.classList.add('fade-out');
  /* 外面那行直接收起，不淡出 */
  libMstAway(true);

  /* 这一页不做淡入：翻开就是翻开，只留下字形自己飞过去、词卡错开入场 */
  renderLibDetail(L, list, hex);
  detail.classList.add('show');
  libDetailTopAtMst(detail);
  const badge = document.getElementById('libBadge');
  const toRect = libRect(badge);

  const f = libFly(fromRect, toRect, L, hex, src, badge);

  libFlyEnd(f, () => {
    if(!libCurrent || libCurrent !== L) return;
    if(f) f.remove();
    badge.style.visibility = 'visible';
    libAnimating = false;
  });
}

function closeLibLetter(){
  if(libAnimating || !libCurrent) return;
  const L = libCurrent;
  const list = libGroups.get(L);
  if(!list){ hardCloseLib(); return; }
  const grid = document.getElementById('libGrid');
  const detail = document.getElementById('libDetail');
  const badge = document.getElementById('libBadge');
  const src = grid.querySelector('[data-letter="' + L + '"]');
  if(!badge || !src){ hardCloseLib(); return; }

  libAnimating = true;
  const hex = libGroupColor(list);
  const fromRect = libRect(badge);
  /* 目标和网格一起回场：飞行途中就能看到落点，落地时不会出现空位或整屏跳变 */
  src.classList.remove('hide');
  grid.classList.remove('fade-out');
  const toRect = libRect(src);

  /* 先把飞回字母墙的字形造出来（要量徽章里的字形），再把这一页立刻收走——不淡出 */
  const f = libFly(fromRect, toRect, L, hex, badge, src);
  detail.classList.remove('show');
  detail.innerHTML = '';
  detail.dataset.style = '';
  detail.style.top = '';
  libMstAway(false);

  libFlyEnd(f, () => {
    if(f) f.remove();
    libCurrent = null;
    libAnimating = false;
  });
}

function hardCloseLib(){
  document.querySelectorAll('.flyer').forEach(el => el.remove());
  const detail = document.getElementById('libDetail');
  if(detail){
    detail.classList.remove('show');
    detail.innerHTML = '';
    detail.dataset.style = '';
    detail.style.top = '';
  }
  const grid = document.getElementById('libGrid');
  if(grid){
    grid.classList.remove('fade-out');
    grid.querySelectorAll('.spec.hide').forEach(el => el.classList.remove('hide'));
  }
  libMstAway(false);
  libCurrent = null;
  libAnimating = false;
}

/* 刷这一组：临时替换刷词队列，不写全局进度存档 */
function queueWords(label, list){
  if(!list || !list.length || animating) return;
  if(!deckScoped) deckBackup = {queue: queue.slice(), pos: pos, undoSnap: undoSnap, label: deckScopeLabel};
  deckScoped = true;
  deckScopeLabel = label;
  queue = libSorted(list);
  pos = 0;
  undoSnap = null;
  hardCloseLib();
  renderDeckShell();
  switchTab('deck');
  toast('已切到 ' + label + ' · ' + queue.length + ' 个词');
}
