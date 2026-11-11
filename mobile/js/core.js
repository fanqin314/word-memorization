/* 数据层：词库数据、存储键读写、复习节奏、日期与统计、队列存档 */

/* ============================================================
   数据层：全部读写与 index.html 相同的那几个 localStorage 键
   ============================================================ */
const D = window.WORDS_DATA || {};
const WORDS = (D.words || []).filter(w => w && w.word);
const ART = D.art || {};
const ARTCSS = D.artCss || {};
const MSTCSS = D.mst || {};

/* 背面用该词卡自己的配色：从卡片页 :root 收敛出的 --mst-* 里取纸色/墨色/强调色 */
const palCache = {};
function paletteOf(word){
  if(palCache[word]) return palCache[word];
  const css = MSTCSS[word] || '';
  const pick = k => {
    const m = css.match('--mst-' + k + ':\\s*([^;]+)');
    return m ? m[1].trim() : '';
  };
  const paper = pick('paper');
  const ink = pick('ink');
  const accent = pick('accent');
  const tint = tintOf(accent);
  const style = [
    paper ? '--mp:' + paper : '',
    ink ? '--mi:' + ink : '',
    accent ? '--ma:' + accent : '',
    '--ctint:' + tint
  ].filter(Boolean).join(';');
  return (palCache[word] = {paper, ink, accent, tint, style});
}

/* 纸色兑入强调色的比例：色相越鲜明兑得越多；
   近中性或很深的强调色少兑一点，避免整张卡变成一片灰 */
function tintOf(hex){
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if(!m) return '16%';
  const n = parseInt(m[1], 16);
  const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2, d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let t;
  if(s < .12) t = 4;
  else if(l < .3) t = 8;
  else t = 16 + 14 * s;
  return Math.round(t) + '%';
}

function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* 把词卡页 .root-line 的文本还原成「词素胶囊 + 括号释义 + → 释义」的排版 */
function rootAtomHtml(seg, allowBare){
  const raw = String(seg).trim();
  const m = raw.match(/^([^（(]*)[（(]([^）)]*)[）)]/);
  if(!m){
    /* 只有构成部分里不带括号的单个词素（如 reverse 的 -e）做成胶囊，释义段不加 */
    return (allowBare && /^\S+$/.test(raw)) ? '<span class="' + (/-/.test(raw) ? 'affix' : 'stem') + '">' + esc(raw) + '</span>' : null;
  }
  const toks = m[1].trim().split(/\s+/).filter(Boolean);
  if(!toks.length) return null;
  const morpheme = toks.pop();          /* 括号前最后一个词是词素，前面的「古英语 / 拉丁语」等作普通文字 */
  const prefix = toks.join(' ');
  /* 括号之后的剩余文字（可能还含别的括号）原样保留，不能丢 */
  const tail = raw.slice(m[0].length).trim();
  return (prefix ? esc(prefix) + ' ' : '') +
    '<span class="' + (/-/.test(morpheme) ? 'affix' : 'stem') + '">' + esc(morpheme) + '</span>（' + esc(m[2]) + '）' +
    (tail ? ' ' + esc(tail) : '');
}
function rootLineHtml(text){
  const raw = String(text || '').trim();
  if(!raw) return '';
  const parts = raw.split(/→/);
  const head = (parts[0] || '').trim();
  const rest = parts.slice(1).map(s => s.trim()).filter(Boolean);
  const segs = head.split(/[+＋]/).map(s => s.trim());
  const atoms = segs.map(s => rootAtomHtml(s, true));
  /* 只要有一段能做成胶囊就走胶囊排版，解析失败的段原样输出（不整段退回 plain） */
  if(!atoms.some(a => a)) return '<div class="back-root plain">' + esc(raw) + '</div>';
  let html = '<div class="back-root">' + atoms.map((a, i) => a || esc(segs[i])).join('<em>+</em>');
  if(rest.length){
    html += '<span class="sep">→</span>' +
      rest.map((s, i) => {
        const a = rootAtomHtml(s);
        if(a) return a;
        return i === rest.length - 1 ? '<b>' + esc(s) + '</b>' : esc(s);
      }).join('<span class="sep">→</span>');
  }
  return html + '</div>';
}

const STORE_KEY = 'vocab_workbench_v1';
const MB_KEY = 'wc_mobile_v1';
const QUIZ_KEY = 'wc_quiz_v1';
const MST_KEY = 'vocab_mst_v1';
const REVIEW_DAYS = ['d1','d3','d7','d15'];
const GOAL = 10;

const ROOT_META = {
  vers:  {label:'vers · vert', color:'var(--indigo)'},
  un:    {label:'un · uni',    color:'var(--teal)'},
  ann:   {label:'ann',         color:'var(--amber)'},
  contra:{label:'contra',      color:'var(--clay)'},
  cor:   {label:'cor',         color:'var(--plum)'},
  other: {label:'其他词源',     color:'var(--rose)'}
};
const MST_LABEL = ['未学','学习中','已掌握'];

let store = loadJSON(STORE_KEY, {});
let mb = loadJSON(MB_KEY, {days:{}, total:0});
let mstRule = Object.assign({learnOpens:2, masterOpens:5, decayDays:14}, loadJSON(MST_KEY, {}));

function loadJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) || fallback) : fallback;
  }catch(e){ return fallback; }
}
function persist(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); }
  catch(e){ toast('本机存储不可用，记录不会保存'); }
}
function rec(word){
  let r = store[word];
  if(!r) r = store[word] = {};
  if(r.fav === undefined) r.fav = false;
  if(r.mastery === undefined) r.mastery = 0;
  if(r.pin === undefined) r.pin = null;
  if(r.note === undefined) r.note = '';
  if(r.opens === undefined) r.opens = 0;
  if(r.lastOpened === undefined) r.lastOpened = 0;
  if(r.dueAt === undefined) r.dueAt = 0;   /* 0 = 从未排期，视为已到期 */
  return r;
}
function daysSince(ts){ return ts ? (Date.now() - ts) / 86400000 : Infinity; }
function masteryOf(word){
  const r = rec(word);
  const auto = r.opens >= mstRule.masterOpens ? 2 : r.opens >= mstRule.learnOpens ? 1 : 0;
  const val = (r.pin === 1 || r.pin === 2) ? r.pin : auto;
  return (val === 2 && daysSince(r.lastOpened) > mstRule.decayDays) ? 1 : val;
}

/* 复习打卡只读，汇总来自卡片页写的 <单词>_review */
let reviewCache = null;
function reviewMap(){
  if(reviewCache) return reviewCache;
  const map = {};
  try{
    for(let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i);
      if(!k || k.slice(-7) !== '_review') continue;
      const v = loadJSON(k, {});
      map[k.slice(0, -7)] = (v && typeof v === 'object') ? v : {};
    }
  }catch(e){}
  reviewCache = map;
  return map;
}
function reviewDone(word){
  const v = reviewMap()[word];
  return v ? REVIEW_DAYS.filter(k => v[k]).length : 0;
}
/* ------------------------------------------------------------
   日期与统计
   ------------------------------------------------------------ */
function keyOf(d){
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function todayKey(){ return keyOf(new Date()); }
function startOfDay(ts){
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function todayCount(){ return mb.days[todayKey()] || 0; }
function streakDays(){
  const days = mb.days || {};
  const d = new Date();
  if(!days[keyOf(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while(days[keyOf(d)]){ n++; d.setDate(d.getDate() - 1); }
  return n;
}
function bumpToday(n){
  const k = todayKey();
  mb.days = mb.days || {};
  mb.days[k] = (mb.days[k] || 0) + n;
  mb.total = (mb.total || 0) + n;
  persist(MB_KEY, mb);
}
/* 今天已经评分过的词（刷新后排在队尾，不重复出现在最前面） */
function ratedToday(){
  const set = new Set(((mb.rated || {})[todayKey()]) || []);
  return set;
}
function markRated(word){
  const k = todayKey();
  mb.rated = mb.rated || {};
  const list = mb.rated[k] || (mb.rated[k] = []);
  if(list.indexOf(word) < 0) list.push(word);
  /* 只保留最近 7 天（日期键按 YYYY-MM-DD 排序即时间序），避免记录无限增长 */
  const keys = Object.keys(mb.rated).sort();
  while(keys.length > 7) delete mb.rated[keys.shift()];
  persist(MB_KEY, mb);
}
/* 进度存档：日期 + 当前下标 + 当时的队列词序 */
function savePos(){
  if(!queue.length || deckScoped) return;
  mb.pos = {date: todayKey(), index: pos, queueWords: queue.map(w => w.word), label: deckScopeLabel};
  persist(MB_KEY, mb);
}
/* 恢复队列：优先按存档的词序重建（顺序一致，刷新后停在同一张）；没有存档再新建。
   buildQueue() 每次都 shuffle，只认下标会让刷新后的位置跳到另一个词上。 */
function restoreQueue(){
  const p = mb.pos;
  if(p && p.date === todayKey() && Array.isArray(p.queueWords) && p.queueWords.length){
    const byWord = new Map(WORDS.map(w => [w.word, w]));
    const q = p.queueWords.map(n => byWord.get(n)).filter(Boolean);
    if(q.length){
      let idx = Math.min(Math.max(0, p.index || 0), q.length);
      const curWord = p.queueWords[p.index || 0];
      if(curWord){
        const i = q.findIndex(w => w.word === curWord);
        if(i >= 0) idx = i;
      }
      return {queue: q, pos: idx, label: p.label || ''};
    }
  }
  return {queue: buildQueue(), pos: 0, label: ''};
}
