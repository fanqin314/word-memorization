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
  a:'Arial Black',
  b:'Garamond Bold',
  c:'Impact',
  d:'Bodoni Black Italic',
  e:'Calibri Bold',
  f:'Brush Script',
  h:'Bookman Bold',
  i:'Rockwell Bold',
  l:'Palatino Italic',
  m:'Bodoni Bold',
  n:'Cambria Bold',
  o:'Copperplate Gothic',
  p:'Constantia Bold',
  r:'Georgia Bold',
  s:'Bookman Bold Italic',
  t:'Times Bold',
  u:'Palatino Bold',
  v:'Script MT Bold',
  w:'Verdana Bold'
};

/* 字母 → 字体样本键：字母墙与详情徽章共用同一副面孔 */
function libFaceKey(L){
  return /^[A-Z]$/.test(L) ? L.toLowerCase() : 'o';
}

/* 19 副面孔的矢量轮廓：每个字母一款不同的真实字体，归一化到 cap-height = 100。
   手机上没装对应字体也不会变样，缩放/旋转都不会发糊 */
const LIB_GLYPH = {
  a:{w:108.9,d:'M76.5 100L71.6 83.5L36.4 83.5L31.6 100L0 100L37.6 0L71.3 0L108.9 100L76.5 100M43.1 61.9L65.1 61.9L54.1 25.9L43.1 61.9'},
  b:{w:92.5,d:'M0 100L0 100L0.2 93.9Q2 93.4 4.6 93.1L4.6 93.1Q9.5 92.4 12.7 91.1L12.7 91.1Q13.7 89.3 14 87.7L14 87.7Q14.6 83.5 14.6 75.2L14.6 75.2L14.5 42.8Q14.5 37.7 13.9 16.5L13.9 16.5Q13.8 10.7 13.2 9.4L13.2 9.4Q13 8.9 12.4 8.6L12.4 8.6Q11.2 7.8 7.9 7.6L7.9 7.6Q6.4 7.5 0.4 6.8L0.4 6.8L0.2 1.4L17.2 1L42.1 0.2L45.1 0.1Q46 0 47 0L47 0Q47.7 0 51 0.1L51 0.1L55.9 0.1Q61.7 0 68.4 1.8L68.4 1.8Q70.8 2.4 74.7 4.4Q78.6 6.3 81.4 9.3Q84.3 12.3 85.7 16.1Q87 19.8 87 24L87 24Q87 28.7 85 32.4Q82.9 36.1 78.7 39.2L78.7 39.2Q76.6 40.7 68.9 44.2L68.9 44.2Q80.4 46.8 86.4 53.7Q92.5 60.6 92.5 69.1L92.5 69.1Q92.5 74.1 90.5 79.6L90.5 79.6Q89.2 83.7 85.9 87.2L85.9 87.2Q81.6 91.8 76.7 94.2Q71.9 96.6 63.3 98.1L63.3 98.1Q59.1 98.9 50.4 98.9L50.4 98.9L37.4 98.6Q29.2 98.6 17.8 99.3L17.8 99.3Q14.6 99.5 0 100M35.5 42.1L35.5 42.1Q38.6 42.6 42.7 42.6L42.7 42.6Q54.1 42.6 60 38.4Q65.9 34.1 65.9 23.8L65.9 23.8Q65.9 16.5 60.3 11.6Q54.7 6.7 43.5 6.7L43.5 6.7Q40.3 6.7 35 7.5L35 7.5Q35 9.3 35.1 12.6L35.1 12.6Q35.5 19.1 35.5 30.7L35.5 30.7L35.4 37.1Q35.4 38.8 35.5 42.1M36.4 90.7L36.4 90.7Q41.4 92.8 45.7 92.8L45.7 92.8Q54.3 92.8 59.8 90.1Q65.3 87.5 67.8 82.8Q70.4 78 70.4 71L70.4 71Q70.4 63.6 67.6 59.2L67.6 59.2Q63.8 53.1 58.4 51Q53 48.9 42.1 48.9L42.1 48.9Q37.3 48.9 35.5 49.6L35.5 49.6L35.5 59L35.4 70.3L35.7 87.8Q35.7 89 36.4 90.7'},
  c:{w:59,d:'M59 34.7L59 43.9L34 43.9L34 27.1Q34 19.9 33.2 18Q32.4 16.2 29.7 16.2L29.7 16.2Q26.6 16.2 25.8 18.4Q25 20.6 25 27.9L25 27.9L25 72.5Q25 79.5 25.8 81.6Q26.6 83.8 29.5 83.8L29.5 83.8Q32.3 83.8 33.2 81.6Q34 79.5 34 71.6L34 71.6L34 59.6L59 59.6L59 63.3Q59 78.2 56.9 84.4Q54.8 90.6 47.6 95.3Q40.4 100 29.8 100L29.8 100Q18.9 100 11.7 96Q4.6 92.1 2.3 85Q0 78 0 63.9L0 63.9L0 35.9Q0 25.5 0.7 20.3Q1.4 15.1 4.9 10.3Q8.5 5.5 14.7 2.8Q21 0 29.1 0L29.1 0Q40.1 0 47.3 4.3Q54.5 8.5 56.7 14.9Q59 21.3 59 34.7L59 34.7'},
  d:{w:142.2,d:'M31.3 3.5L32.6 0L92.2 0Q106.5 0 114.2 1.6Q121.8 3.2 128.4 7.8Q135 12.4 138.6 19.8Q142.2 27.3 142.2 37.1L142.2 37.1Q142.2 50.4 136.1 63.6Q130.1 76.7 120.5 85.2Q111 93.7 101.1 96.8Q91.2 100 76.4 100L76.4 100L0 100L1.1 96.5L13.3 96.5L43.5 3.5L31.3 3.5M89.4 3.5L59.1 96.5L65.1 96.5Q72.2 96.5 76 93Q79.9 89.4 82.8 80.3L82.8 80.3L102.7 19.4Q104.3 13.9 104.3 10.8L104.3 10.8Q104.3 3.5 93.7 3.5L93.7 3.5L89.4 3.5'},
  e:{w:59.3,d:'M59.3 92L59.3 92Q59.3 94.3 59.1 95.8Q58.9 97.3 58.5 98.2Q58.1 99.1 57.5 99.6Q57 100 56.3 100L56.3 100L6 100Q3.5 100 1.7 98.5Q0 97 0 93.6L0 93.6L0 6.4Q0 3 1.7 1.5Q3.5 0 6 0L6 0L56 0Q56.6 0 57.2 0.4Q57.7 0.8 58.1 1.7Q58.5 2.7 58.7 4.2Q58.9 5.7 58.9 8L58.9 8Q58.9 10.2 58.7 11.7Q58.5 13.2 58.1 14.1Q57.7 15.1 57.2 15.5Q56.6 15.9 56 15.9L56 15.9L20.2 15.9L20.2 40.3L50.5 40.3Q51.2 40.3 51.7 40.8Q52.3 41.2 52.7 42.1Q53.1 43 53.3 44.5Q53.5 46 53.5 48.1L53.5 48.1Q53.5 50.4 53.3 51.9Q53.1 53.3 52.7 54.2Q52.3 55.1 51.7 55.5Q51.2 55.9 50.5 55.9L50.5 55.9L20.2 55.9L20.2 84.1L56.3 84.1Q57 84.1 57.5 84.5Q58.1 84.9 58.5 85.9Q58.9 86.8 59.1 88.3Q59.3 89.8 59.3 92'},
  f:{w:79.9,d:'M41.6 49L41.6 49L51.1 49Q59.4 37.9 63.7 29.7Q68 21.4 68 18.8L68 18.8Q68 15.2 61.8 15.2L61.8 15.2Q58.2 15.6 49.1 16.8Q39.9 18 31.4 19.7L31.4 19.7Q23.7 21.2 19.1 22.7Q14.4 24.3 12.5 25.3Q10.6 26.3 10.2 26.7L10.2 26.7Q14.9 26.5 18.1 26.5L18.1 26.5Q23.1 26.5 23.1 27.6L23.1 27.6Q23.1 28.1 19.6 28.9Q16.1 29.7 12.9 30.6L12.9 30.6Q9.8 31.4 6.9 32.6Q4 33.8 3.3 33.8L3.3 33.8Q1.9 33.8 0.9 32.7Q0 31.6 0 30.1L0 30.1Q0 29 1.7 24.5Q3.5 20 6.6 15.4Q9.8 10.8 14.4 8.6L14.4 8.6Q16.1 7.8 25.3 5.7Q34.5 3.5 46 1.8Q57.5 0 67.1 0L67.1 0Q72.9 0 76.4 1.6Q79.9 3.2 79.9 8.5L79.9 8.5Q79.9 10.2 78.6 13.8Q77.4 17.3 74.6 22.9Q71.9 28.4 68 35Q64 41.7 59 49L59 49L68.7 49L60.3 61.1Q58.6 61.2 56 61.2Q53.5 61.3 50.5 61.4L50.5 61.4Q42.7 71.5 33.7 80.4Q24.6 89.3 17.3 94.6Q10 100 7 100L7 100Q5.8 100 4.9 99.2Q4 98.4 4 97.2L4 97.2Q4 96.1 6.8 91.7Q9.6 87.3 14.6 83.4Q19.6 79.6 26 79.1L26 79.1Q28.5 76.4 30.4 74.3Q32.3 72.2 35.7 68.2Q39.1 64.2 40.9 62.1L40.9 62.1L21.9 63Q18.8 63.1 17.7 62.7Q16.5 62.3 16.5 60.7L16.5 60.7Q16.5 60.7 17.1 59.1Q17.8 57.5 18.5 56.3L18.5 56.3Q19.5 54.4 20.1 54.1Q20.7 53.7 23.5 53.1L23.5 53.1L35.1 50.2Q39.8 49 41.6 49'},
  h:{w:109.9,d:'M0 13.8L0 0L48.8 0L48.8 13.8L44.3 13.8Q40.6 13.8 39.2 14.6Q37.8 15.3 37.3 16.7Q36.7 18.1 36.7 22.8L36.7 22.8L36.7 40.2L73.1 40.2L73.1 21.5Q73.1 18.1 72.7 16.8L72.7 16.8Q72.1 15.1 70.8 14.5Q69.4 13.8 64.7 13.8L64.7 13.8L60.9 13.8L60.9 0L109.9 0L109.9 13.8L105.8 13.8Q101.6 13.8 100.3 14.5Q98.9 15.2 98.4 16.5Q97.8 17.8 97.8 22.8L97.8 22.8L97.8 77Q97.8 82 98.5 83.5Q99.2 84.9 100.6 85.6Q102 86.2 107 86.2L107 86.2L109.9 86.2L109.9 100L60.9 100L60.9 86.2L64.2 86.2Q68.7 86.2 70.3 85.4Q71.9 84.7 72.5 83.4Q73.1 82 73.1 77L73.1 77L73.1 55.8L36.7 55.8L36.7 77Q36.7 82 37.1 83.2L37.1 83.2Q37.8 85 39.4 85.6Q40.9 86.2 45.4 86.2L45.4 86.2L48.8 86.2L48.8 100L0 100L0 86.2L3.3 86.2Q7.5 86.2 9.1 85.4Q10.8 84.7 11.4 83.4Q12 82.2 12 77.8L12 77.8L12 23.4Q12 18.4 11.4 16.8Q10.8 15.3 9.5 14.6Q8.2 13.8 4.4 13.8L4.4 13.8L0 13.8'},
  i:{w:56.5,d:'M56.5 100L0 100L0 83.1L15.2 83.1L15.2 16.9L0 16.9L0 0L56.5 0L56.5 16.9L41.2 16.9L41.2 83.1L56.5 83.1L56.5 100'},
  l:{w:71.5,d:'M0.6 100L0.6 100L0 99.5L0.4 96.5L0.9 95.9Q4.9 95.2 5.5 94.9Q6.1 94.5 6.9 93.5Q7.6 92.5 8.5 89Q9.4 85.5 13.2 65.4L13.2 65.4L17.5 41.3L20 25.9Q22.3 10.2 22.3 8L22.3 8Q22.3 6.2 21.6 5.5Q20.8 4.9 18.7 4.6Q16.5 4.4 11 4.2L11 4.2L10.5 3.5L10.8 0.6L11.5 0Q20.1 0.6 32.5 0.6L32.5 0.6Q41.8 0.6 47.1 0L47.1 0L47.7 0.6L47.3 3.6L46.8 4.2Q38.2 4.9 37.3 5.2Q36.4 5.5 35.9 6Q35.4 6.5 35 7.7L35 7.7Q33.9 10.6 30.8 27.5L30.8 27.5L22.4 77.2Q20.7 87.9 20.5 93.2L20.5 93.2Q28.4 94.1 35.1 94.1L35.1 94.1Q44.1 94.1 49.4 93.8Q54.6 93.6 57.7 93Q60.8 92.5 61.6 91.9Q62.3 91.4 62.9 90.5Q63.5 89.6 64.6 85.6L64.6 85.6L67.3 76.5L67.9 75.9L70.9 75.9L71.5 76.5Q68.8 93.1 68.2 99.4L68.2 99.4L67.5 100L42.7 99.7L10.2 99.5Q5.4 99.5 0.6 100'},
  m:{w:118.6,d:'M0 0L41.8 0L60.5 57.9L79.3 0L118.6 0L118.6 4.8L105.8 4.8L105.8 95.1L118.6 95.1L118.6 100L68.2 100L68.2 95.1L81.4 95.1L81.4 10.2L52.5 100L49 100L19.7 9.1L19.7 84.9Q19.7 91.1 21.3 93.1Q22.8 95.1 29.9 95.1L29.9 95.1L33.4 95.1L33.4 100L0 100L0 95.1L6.1 95.1Q11.9 95.1 13.2 93.1Q14.5 91.2 14.5 85.3L14.5 85.3L14.5 4.8L0 4.8L0 0'},
  n:{w:89,d:'M61.3 0L89 0L89 4.8Q86.1 5.8 84.9 6.4Q83.7 7.1 82.8 8.2Q82 9.3 81.5 11.5Q81.1 13.8 81.1 18.4L81.1 18.4L81.1 100L62.5 100L29.5 43Q22.9 31.4 19.7 24.8L19.7 24.8L19 24.8Q19.8 40.6 19.8 58.1L19.8 58.1L19.8 81.7Q19.8 87.2 20.3 89.4Q20.9 91.6 22.3 92.9Q23.7 94.1 27.7 95.2L27.7 95.2L27.7 100L0 100L0 95.2Q2.7 94.4 4.3 93.6Q5.9 92.7 6.6 91.2Q7.4 89.7 7.6 87.4Q7.8 85.1 7.8 81.7L7.8 81.7L7.8 18.3Q7.8 12.8 7.4 10.7Q6.9 8.6 5.4 7.3Q3.9 5.9 0 4.8L0 4.8L0 0L29.7 0L55.6 45.1Q58 49.3 61.9 56.6Q65.8 63.8 68.8 70.3L68.8 70.3L70 70.3Q69.2 52.7 69.2 32L69.2 32L69.2 18.4Q69.2 13.6 68.8 11.5Q68.4 9.4 67.7 8.3Q66.9 7.2 65.6 6.4Q64.3 5.7 61.3 4.8L61.3 4.8L61.3 0'},
  o:{w:111,d:'M55.3 0L55.3 0Q80.6 0 95.4 13.7L95.4 13.7Q111 28 111 50.6L111 50.6Q111 64.5 103.5 76.5L103.5 76.5Q88.9 100 55.5 100L55.5 100Q30.4 100 15.6 86.3L15.6 86.3Q7.7 79.1 3.6 68.9L3.6 68.9Q0 59.9 0 50L0 50Q0 35.5 7.4 23.4L7.4 23.4Q21.7 0.4 55.3 0M55.4 16.3L55.4 16.3Q41.6 16.3 32.4 24.6L32.4 24.6Q21.5 34.3 21.5 50L21.5 50Q21.5 65.7 32.4 75.4L32.4 75.4Q41.6 83.6 55.6 83.6L55.6 83.6Q69.5 83.6 78.6 75.4L78.6 75.4Q84.1 70.5 87 63.4L87 63.4Q89.5 57.1 89.5 50.4L89.5 50.4Q89.5 34 78.6 24.6L78.6 24.6Q69.4 16.5 55.4 16.3'},
  p:{w:83.1,d:'M32.9 7.4L32.9 51.3Q37 52.1 40.9 52.1L40.9 52.1Q50.2 52.1 55.1 46.4Q60 40.7 60 29.1L60 29.1Q60 17.8 55.4 12.3Q50.7 6.8 40.8 6.8L40.8 6.8Q36.9 6.8 32.9 7.4L32.9 7.4M32.9 58.1L32.9 77.5Q32.9 81.7 32.9 85.1Q33 88.5 33 91.2L33 91.2Q33.1 92.8 34.9 93.5L34.9 93.5L45.3 96.4L45.6 100Q34.5 99.8 22.5 99.8L22.5 99.8Q10.1 99.8 0.4 100L0.4 100L0 96.4L9.5 93.8Q11.4 93.2 11.4 91.6L11.4 91.6Q11.5 88.8 11.5 85.3Q11.6 81.7 11.6 77.5L11.6 77.5L11.6 20.8Q11.6 17.3 11.5 14.4Q11.5 11.4 11.4 9L11.4 9Q11.4 7.2 9.7 6.7L9.7 6.7L0.2 3.9L0 0.3Q10 0.6 19.7 0.6L19.7 0.6Q26.4 0.6 32.7 0.3Q38.9 0 44.1 0L44.1 0Q63.3 0 73.2 6.6Q83.1 13.3 83.1 26.4L83.1 26.4Q83.1 41.8 72.8 50.4Q62.5 58.9 43.9 58.9L43.9 58.9Q38.8 58.9 32.9 58.1L32.9 58.1'},
  r:{w:114.8,d:'M114.8 94.5L114.8 100L76.5 100Q66.5 84.8 59.9 75.8Q53.3 66.7 43.6 54.9L43.6 54.9L39.7 54.9L39.7 85.3Q39.7 87.8 40.6 89.6Q41.6 91.3 44.3 92.5L44.3 92.5Q45.6 93.1 48.4 93.7Q51.3 94.3 53.3 94.5L53.3 94.5L53.3 100L0 100L0 94.5Q2 94.3 5.4 93.9Q8.7 93.5 10.1 93L10.1 93Q12.8 91.8 13.7 90.1Q14.7 88.4 14.7 85.7L14.7 85.7L14.7 15.2Q14.7 12.6 13.9 10.9Q13.1 9.2 10.1 8L10.1 8Q7.9 7 4.8 6.4Q1.8 5.8 0 5.5L0 5.5L0 0L56.1 0Q74.9 0 84.7 5.9Q94.4 11.8 94.4 23.7L94.4 23.7Q94.4 34.2 88.4 40.6Q82.4 46.9 70 50.5L70 50.5Q74.8 56.7 81.2 64.9Q87.6 73.1 94.5 81.6L94.5 81.6Q96.7 84.4 100.5 88.3Q104.2 92.3 107.1 93.2L107.1 93.2Q108.7 93.7 111.2 94.1Q113.7 94.4 114.8 94.5L114.8 94.5M66.8 25.7L66.8 25.7Q66.8 15.6 61.2 11Q55.6 6.4 45.2 6.4L45.2 6.4L39.7 6.4L39.7 48.3L45 48.3Q55.4 48.3 61.1 42.8Q66.8 37.4 66.8 25.7'},
  s:{w:91.6,d:'M78.8 1.7L88.9 1.7L91.6 35.1L77.5 37.3Q73.9 27.2 65.6 21.1Q57.3 15 47.2 15L47.2 15Q42 15 38.4 16.5Q34.8 17.9 33 20.3Q31.2 22.8 31.2 25.2L31.2 25.2Q31.2 28.6 34.4 31.4L34.4 31.4Q37.6 34.2 47.5 36.9L47.5 36.9Q64.2 41.6 72 45.5Q79.8 49.4 83.8 55Q87.9 60.6 87.9 68.5L87.9 68.5Q87.9 81.9 75.9 91.3L75.9 91.3Q64.9 100 48.2 100L48.2 100Q38.3 100 30.5 97.3Q22.7 94.6 16 88.8L16 88.8L10 98.3L0 98.3L0 59.5L14.1 58.5Q16.4 65.8 22 72.1Q27.5 78.4 34.4 81.7Q41.4 84.9 48.7 84.9L48.7 84.9Q56.8 84.9 61.3 81.6Q65.7 78.3 65.7 73.5L65.7 73.5Q65.7 70 62.9 67.2L62.9 67.2Q60.2 64.5 51.8 62.1L51.8 62.1Q34.7 57 27.7 54Q20.8 51 17.1 47.5Q13.4 44.1 11.4 39.3Q9.3 34.5 9.3 29.5L9.3 29.5Q9.3 21.9 13.8 15.1Q18.3 8.3 27.3 4.2Q36.3 0 47.6 0L47.6 0Q56.1 0 63.6 2.6L63.6 2.6Q69 4.5 74.4 8.6L74.4 8.6L78.8 1.7'},
  t:{w:89.8,d:'M0 0L89.8 0L89.8 27.1L87.2 27.1Q84.8 17.7 81.9 13.6Q79.1 9.5 74 7.1L74 7.1Q71.2 5.8 64.2 5.8L64.2 5.8L56.8 5.8L56.8 82.9Q56.8 90.6 57.6 92.5Q58.5 94.4 61 95.8Q63.4 97.3 67.7 97.3L67.7 97.3L71 97.3L71 100L18.7 100L18.7 97.3L22 97.3Q26.3 97.3 29 95.7L29 95.7Q30.9 94.7 32 92.2L32 92.2Q32.8 90.4 32.8 82.9L32.8 82.9L32.8 5.8L25.6 5.8Q15.5 5.8 10.9 10L10.9 10Q4.5 16 2.8 27.1L2.8 27.1L0 27.1L0 0'},
  u:{w:96.1,d:'M96.1 4.3L96.1 8.7L95.5 9.3Q87.8 9.3 86.9 13.4L86.9 13.4Q86.4 15.7 86.1 23.2L86.1 23.2Q85.9 28.8 85.9 39.5L85.9 39.5L85.9 59.4Q85.9 78.6 78.3 86.8L78.3 86.8Q68.3 97.7 49.7 97.7L49.7 97.7Q32.8 97.7 23.3 92L23.3 92Q15.3 87.3 12.8 78.5L12.8 78.5Q11.3 72.8 11.3 49.1L11.3 49.1L11.3 32.4Q11.3 17 10.4 12.4L10.4 12.4Q10.1 10.5 8.2 10L8.2 10Q7.2 9.7 0.6 9.3L0.6 9.3L0 8.7L0 4.3L0.6 3.7Q6.9 4.1 20.6 4.1L20.6 4.1Q34.5 4.1 40.4 3.7L40.4 3.7L41.1 4.3L41.1 8.7L40.4 9.3Q33.8 9.7 32.9 10L32.9 10Q31 10.5 30.7 12.4L30.7 12.4Q29.8 17 29.8 32.4L29.8 32.4L29.8 45.7Q29.8 70.2 32 75.7L32 75.7Q36.4 86.5 53.7 86.5L53.7 86.5Q65 86.5 71.3 81L71.3 81Q74.3 78.3 75.5 75.6Q76.6 72.9 77.3 67.2L77.3 67.2Q77.9 61.9 77.9 56.5L77.9 56.5L77.9 43Q77.9 26.1 77.7 19.9L77.7 19.9Q77.6 14 77 12.3L77 12.3Q76.5 11 74.7 10.3L74.7 10.3Q73.2 9.7 66.8 9.3L66.8 9.3L66.1 8.7L66.1 4.3L66.8 3.7Q72.4 4.1 78.3 4.1L78.3 4.1Q82.8 4.1 95.5 3.7L95.5 3.7L96.1 4.3M49.7 0L49.7 0M49.7 100L49.7 100'},
  v:{w:89.7,d:'M82.9 0.1L82.9 0.1Q85.1 0.1 87.4 6.9Q89.7 13.7 89.7 20.9L89.7 20.9Q89.7 37 82.5 56.5Q75.4 76.1 64.2 88Q53.1 100 41.1 100L41.1 100Q31.4 100 25.3 93.1Q19.2 86.2 19.2 75.1L19.2 75.1Q19.2 64.7 26.7 44.8L26.7 44.8Q33.6 25.8 33.6 17.7L33.6 17.7Q33.6 12.3 31.5 9.3Q29.4 6.3 25.8 6.3L25.8 6.3Q20.1 6.3 15.1 12.7Q10.1 19 10.1 26.2L10.1 26.2Q10.1 32.1 13.2 34.9Q16.2 37.8 16.2 39.2L16.2 39.2Q16.2 41.7 13.2 45Q10.2 48.3 7.9 48.3L7.9 48.3Q5 48.3 2.5 44.3Q0 40.3 0 35.4L0 35.4Q0 22.9 9 11.4Q18 0 30.1 0L30.1 0Q39.3 0 44.9 6.9Q50.4 13.9 50.4 25.5L50.4 25.5Q50.4 30.9 49 37.7Q47.7 44.4 42.3 58.9Q37 73.3 37 80.8L37 80.8Q37 85.7 39.8 88.9Q42.7 92.1 47 92.1L47 92.1Q53.7 92.1 60.9 84.2Q68.1 76.3 72.9 63.7Q77.7 51.1 77.7 39.4L77.7 39.4Q77.7 28.3 70.9 15.4L70.9 15.4Q68.8 11.5 68.8 10L68.8 10Q68.8 7.4 74.8 3.8Q80.8 0.1 82.9 0.1'},
  w:{w:146.3,d:'M120.1 0L146.3 0L119.4 100L90.9 100L72.9 34.9L55.5 100L26.9 100L0 0L26.9 0L42.3 68.8L60.7 0L86.4 0L104 68.8L120.1 0'}
};

let libGlyphSeq = 0;
/* 内联 SVG 字形：颜色全部走 currentColor，尺寸交给 .gl 的 CSS；
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
