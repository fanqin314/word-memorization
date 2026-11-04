/* ============================================================
   数据层：全部读写与 index.html 相同的那几个 localStorage 键
   ============================================================ */
const D = window.WORDS_DATA || {};
const WORDS = (D.words || []).filter(w => w && w.word);
const ART = D.art || {};
const ARTCSS = D.artCss || {};

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
function isDue(word){
  const n = reviewDone(word);
  return n > 0 && n < REVIEW_DAYS.length && masteryOf(word) !== 2;
}

/* ------------------------------------------------------------
   日期与统计
   ------------------------------------------------------------ */
function keyOf(d){
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function todayKey(){ return keyOf(new Date()); }
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

/* ------------------------------------------------------------
   刷词队列：待复习优先，然后未学 → 学习中 → 已掌握
   ------------------------------------------------------------ */
function shuffle(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function buildQueue(){
  const due = [], rest = [];
  WORDS.forEach(w => (isDue(w.word) ? due : rest).push(w));
  shuffle(due); shuffle(rest);
  rest.sort((a, b) => masteryOf(a.word) - masteryOf(b.word) || rec(a.word).opens - rec(b.word).opens);
  return due.concat(rest);
}
let queue = [];
let pos = 0;
let animating = false;

/* ------------------------------------------------------------
   朗读
   ------------------------------------------------------------ */
let speakVO = null;
function speakWord(word, btn){
  if(!('speechSynthesis' in window)){ toast('当前浏览器不支持朗读'); return; }
  window.speechSynthesis.cancel();
  const u = speakVO = new SpeechSynthesisUtterance(word);
  u.lang = 'en-US';
  u.rate = 0.85;
  if(btn){
    btn.classList.add('speaking');
    const off = () => { if(speakVO === u){ btn.classList.remove('speaking'); } };
    u.onend = off;
    u.onerror = off;
  }
  window.speechSynthesis.speak(u);
}

/* ------------------------------------------------------------
   意象卡 CSS 按需注入（每个词一份，避免一次性塞 100KB）
   ------------------------------------------------------------ */
const artCssLoaded = new Set();
function ensureArtCss(word){
  if(artCssLoaded.has(word) || !ARTCSS[word]) return;
  artCssLoaded.add(word);
  const st = document.createElement('style');
  st.textContent = ARTCSS[word];
  document.head.appendChild(st);
}

/* ------------------------------------------------------------
   刷词卡渲染
   ------------------------------------------------------------ */
const SPEAK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/></svg>';

function rootOf(w){
  const roots = (w.roots && w.roots.length) ? w.roots : ['other'];
  const meta = ROOT_META[roots[0]] || ROOT_META.other;
  return {label: roots.map(r => (ROOT_META[r] || ROOT_META.other).label).join(' / '), color: meta.color};
}

function renderDeckShell(){
  const view = document.getElementById('view-deck');
  view.innerHTML = '<div class="deck-wrap">' +
      '<div class="deck-meta"><span>第 <b id="deckPos">1</b> / <b id="deckTotal">' + queue.length + '</b> 张</span><span>遗忘优先</span></div>' +
      '<div class="deck-stage" id="deckStage"><div class="stack" id="cardStack"></div></div>' +
      '<p class="deck-hint">上滑跳过 · 点按钮记掌握度</p>' +
    '</div>';
  renderCard(false);
}

function cardHtml(w){
  const m = masteryOf(w.word);
  const rt = rootOf(w);
  const rep = reviewDone(w.word);
  const art = ART[w.word] || '';
  return '<div class="swipe-card in" data-word="' + w.word + '" style="--rc:' + rt.color + '">' +
      '<div class="card-head">' +
        '<span class="root-tag"><i class="dot"></i>' + rt.label + '</span>' +
        '<span class="mst-tag" style="color:' + (m === 2 ? '#4C6B52' : m === 1 ? '#9A7B34' : '#8A8378') + '">' + MST_LABEL[m] + '</span>' +
        '<a class="mini-card" href="../' + w.file + '">词卡 ›</a>' +
      '</div>' +
      '<div class="card-main">' +
        '<div class="word-row"><div><h2 class="word">' + w.word + '</h2>' +
          '<p class="ipa">' + (w.ipa || '') + '</p></div>' +
          '<button class="speak" type="button" data-speak aria-label="朗读 ' + w.word + '">' + SPEAK_ICON + '</button></div>' +
        '<p class="pos">' + (w.pos || '') + '</p>' +
        '<p class="gloss">' + (w.gloss || '') + '</p>' +
        '<div class="art-frame"><div class="di-art" data-art="' + w.word + '">' + art + '</div>' +
          '<span class="art-tag">' + (w.scene ? '意象' : '词卡') + (rep ? ' · 打卡 ' + rep + '/4' : '') + '</span></div>' +
        '<p class="scene">' + (w.scene || '') + '</p>' +
        '<p class="morph"><b>词根</b>' + (w.morph || '') + '</p>' +
      '</div>' +
      '<div class="actions">' +
        '<button class="rate r0" type="button" data-rate="0">不认识</button>' +
        '<button class="rate r1" type="button" data-rate="1">有点印象</button>' +
        '<button class="rate r2" type="button" data-rate="2">认识</button>' +
      '</div>' +
    '</div>';
}

function renderCard(){
  const host = document.getElementById('cardStack');
  const posEl = document.getElementById('deckPos');
  if(!host) return;
  if(posEl) posEl.textContent = Math.min(pos + 1, queue.length);
  const w = queue[pos];
  if(!w){
    host.innerHTML = '<div class="deck-empty"><span class="big">这轮刷完了</span>' +
      '<small>今天 ' + todayCount() + ' 个 · 去词库或自测继续，也可以重刷一轮。</small>' +
      '<button class="rate r2" type="button" data-restart style="padding:.55rem 1.1rem;">再来一轮</button></div>';
    return;
  }
  ensureArtCss(w.word);
  host.innerHTML = cardHtml(w);
}

/* 记录掌握度：写回 index.html 同一份 store */
function rateWord(word, level){
  const r = rec(word);
  r.opens = (r.opens || 0) + 1;
  r.lastOpened = Date.now();
  if(level === 2) r.pin = 2;
  else if(level === 1) r.pin = 1;
  else { r.pin = null; r.opens = 0; }
  r.mastery = masteryOf(word);
  persist(STORE_KEY, store);
  bumpToday(1);
}

function advance(level){
  if(animating) return;
  const w = queue[pos];
  if(!w) return;
  animating = true;
  if(level === null) toast('已跳过');
  else {
    rateWord(w.word, level);
    toast(level === 2 ? '标记为已掌握' : level === 1 ? '标记为学习中' : '已回到未学，明天再来');
    refreshHeader();
    if(todayCount() === GOAL) setTimeout(() => toast('今日 10 个达成，收工！'), 700);
  }
  const card = document.querySelector('.swipe-card');
  if(card) card.classList.add(level === null ? 'out-up' : 'out-side');
  setTimeout(() => {
    pos += 1;
    animating = false;
    renderCard();
  }, level === null ? 400 : 360);
}
/* ============================================================
   词库：搜索 + 46 词，点开原卡片页
   ============================================================ */
let libBuilt = false;
let libQuery = '';

function renderLib(){
  const view = document.getElementById('view-lib');
  if(!libBuilt){
    libBuilt = true;
    view.innerHTML = '<div class="lib-top"><div class="search-box">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>' +
        '<input id="libSearch" type="search" placeholder="搜单词或释义…" autocomplete="off" autocapitalize="off" spellcheck="false">' +
      '</div><span class="lib-count" id="libCount">' + WORDS.length + '</span></div>' +
      '<div class="wlist" id="libList"></div>';
    document.getElementById('libSearch').addEventListener('input', (e) => {
      libQuery = e.target.value.trim().toLowerCase();
      renderLibList();
    });
  }
  renderLibList();
}

function renderLibList(){
  const host = document.getElementById('libList');
  if(!host) return;
  const list = WORDS.filter(w =>
    !libQuery || w.word.toLowerCase().includes(libQuery) || (w.gloss || '').toLowerCase().includes(libQuery)
  );
  const count = document.getElementById('libCount');
  if(count) count.textContent = list.length;
  if(!list.length){
    host.innerHTML = '<div class="wempty">没有匹配的词，换个关键词试试</div>';
    return;
  }
  host.innerHTML = list.map(w => {
    const m = masteryOf(w.word);
    const rt = rootOf(w);
    const n = reviewDone(w.word);
    return '<a class="wrow" href="../' + w.file + '" style="--rc:' + rt.color + '">' +
        '<i class="wbar"></i>' +
        '<div class="wbody"><div class="wword"><b>' + w.word + '</b><i>' + (w.ipa || '') + '</i></div>' +
          '<div class="wgloss">' + (w.gloss || '') + '</div></div>' +
        '<div class="wmeta"><span class="wmst m' + m + '">' + MST_LABEL[m] + '</span>' +
          '<span class="wnum">' + (n ? '打卡 ' + n + '/4' : '&nbsp;') + '</span></div>' +
      '</a>';
  }).join('');
}

/* ============================================================
   自测：从 q 字段抽 10 题，判题规则与 index.html 完全一致
   ============================================================ */
let quizBuilt = false;
const quiz = {list:[], idx:0, right:0, wrong:0, answered:false};

function quizStat(){
  return Object.assign({rounds:0, total:0, right:0}, loadJSON(QUIZ_KEY, {}));
}
function quizNorm(s){
  return String(s == null ? '' : s).toLowerCase()
    .replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function quizPool(){
  const out = [];
  WORDS.forEach(w => {
    (w.q || []).forEach(item => {
      if(item && item.q && item.a) out.push({word:w.word, q:item.q, a:item.a, h:item.h || ''});
    });
  });
  return out;
}
function startQuiz(){
  quiz.list = shuffle(quizPool()).slice(0, 10);
  quiz.idx = 0; quiz.right = 0; quiz.wrong = 0; quiz.answered = false;
  renderQuizQuestion();
}

function renderQuiz(){
  const view = document.getElementById('view-quiz');
  if(!quizBuilt){
    quizBuilt = true;
    view.innerHTML = '<div class="quiz-wrap">' +
        '<div class="quiz-head"><span id="quizProg">首字母填空</span><span>✓ <b id="quizRight">0</b>　✗ <b id="quizWrong">0</b></span></div>' +
        '<div id="quizBody"></div></div>';
  }
  if(!quiz.list.length) startQuiz();
}

function renderQuizQuestion(){
  const body = document.getElementById('quizBody');
  if(!body) return;
  if(quiz.idx >= quiz.list.length){ renderQuizResult(); return; }
  const item = quiz.list[quiz.idx];
  quiz.answered = false;
  const prog = document.getElementById('quizProg');
  const rightEl = document.getElementById('quizRight');
  const wrongEl = document.getElementById('quizWrong');
  if(prog) prog.textContent = '第 ' + (quiz.idx + 1) + ' / ' + quiz.list.length + ' 题';
  if(rightEl) rightEl.textContent = quiz.right;
  if(wrongEl) wrongEl.textContent = quiz.wrong;
  body.innerHTML = '<div class="quiz-card">' +
      '<span class="q-kicker">首字母填空 · ' + item.word + '</span>' +
      '<p class="q-sentence">' + item.q + '</p>' +
      '<input class="q-input" id="qInput" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="补全空格处的字母…" aria-label="补全空格">' +
      (item.h ? '<button class="q-btn ghost" type="button" data-hint style="margin-top:.5rem;font-size:.68rem;padding:.3rem .7rem;">看提示</button>' +
                '<p class="q-hint" id="qHint" hidden>' + item.h + '</p>' : '') +
      '<div class="q-foot"><span class="q-feed" id="qFeed"></span>' +
        '<button class="q-btn" type="button" id="qSubmit">检查</button></div>' +
    '</div>';
  const input = document.getElementById('qInput');
  if(input){
    input.focus();
    input.addEventListener('keydown', (e) => {
      if(e.key === 'Enter'){ e.preventDefault(); quizCheck(); }
    });
  }
}

function quizCheck(){
  if(quiz.answered) return;
  const input = document.getElementById('qInput');
  const item = quiz.list[quiz.idx];
  if(!input || !item) return;
  const val = quizNorm(input.value);
  if(!val){ input.focus(); return; }
  quiz.answered = true;

  const first = (item.q.match(/class="first-letter">([^<]*)</) || ['', ''])[1];
  const ok = val === quizNorm(item.a)
          || val === quizNorm(item.word)
          || val === quizNorm(first + item.a);
  if(ok) quiz.right++; else quiz.wrong++;

  const blank = document.querySelector('#quizBody .qz-blank');
  if(blank){ blank.textContent = item.a; blank.classList.add('on'); }
  input.disabled = true;

  const hint = document.getElementById('qHint');
  if(hint) hint.hidden = false;

  const fb = document.getElementById('qFeed');
  if(fb){
    fb.className = 'q-feed ' + (ok ? 'right' : 'wrong');
    fb.textContent = ok ? '✓ 正确' : '✗ 正确答案：' + item.a;
  }
  const rightEl = document.getElementById('quizRight');
  const wrongEl = document.getElementById('quizWrong');
  if(rightEl) rightEl.textContent = quiz.right;
  if(wrongEl) wrongEl.textContent = quiz.wrong;

  const btn = document.getElementById('qSubmit');
  btn.textContent = quiz.idx + 1 >= quiz.list.length ? '看结果' : '下一题';
  btn.classList.add('ghost');
  btn.focus();
}

function quizNext(){
  quiz.idx++;
  if(quiz.idx >= quiz.list.length) renderQuizResult();
  else renderQuizQuestion();
}

function renderQuizResult(){
  const body = document.getElementById('quizBody');
  if(!body) return;
  const total = quiz.right + quiz.wrong;
  const rate = total ? Math.round(quiz.right / total * 100) : 0;
  const stat = quizStat();
  stat.rounds += 1; stat.total += total; stat.right += quiz.right;
  persist(QUIZ_KEY, stat);
  const hist = stat.total ? Math.round(stat.right / stat.total * 100) : 0;
  const prog = document.getElementById('quizProg');
  if(prog) prog.textContent = '本轮完成';
  body.innerHTML = '<div class="quiz-card">' +
      '<span class="q-kicker">本轮完成</span>' +
      '<p class="q-result-num">' + quiz.right + ' / ' + total + '</p>' +
      '<p class="q-result-sub">正确率 ' + rate + '% · 累计 ' + stat.right + ' / ' + stat.total +
        '（' + hist + '%，共 ' + stat.rounds + ' 轮）</p>' +
      '<div class="q-actions"><button class="q-btn ghost" type="button" data-quiz-back>回刷词</button>' +
        '<button class="q-btn" type="button" data-quiz-again>再来一轮</button></div>' +
    '</div>';
}

/* ============================================================
   数据页
   ============================================================ */
function renderStat(){
  const view = document.getElementById('view-stat');
  const today = todayCount();
  const streak = streakDays();
  const due = WORDS.filter(w => isDue(w.word)).length;
  const m = [0,0,0];
  WORDS.forEach(w => m[masteryOf(w.word)]++);
  const stat = quizStat();
  const rate = stat.total ? Math.round(stat.right / stat.total * 100) : 0;
  const pct = n => Math.round(n / Math.max(1, WORDS.length) * 100);
  const checked = WORDS.filter(w => reviewDone(w.word) > 0).length;

  view.innerHTML = '<div class="stat-grid">' +
      '<div class="tile wide">' +
        '<span class="tk">今日已刷</span>' +
        '<span class="tv">' + today + '<small>/ ' + GOAL + ' 个</small></span>' +
        '<div class="mst-bar" style="margin-top:.4rem;"><span class="track">' +
          '<i class="fill" style="width:' + Math.min(100, today / GOAL * 100) + '%;--bc:var(--amber);"></i></span></div>' +
        '<p class="ts">' + (today >= GOAL ? '今天已经达标，明天记得回来。' : '轻量目标：每天 10 个，刷完就收工。') + '</p>' +
      '</div>' +
      '<div class="tile"><span class="tk">连续学习</span><span class="tv">' + streak + '<small>天</small></span>' +
        '<p class="ts">' + (streak > 1 ? '保持住，别断。' : '今天开个头。') + '</p></div>' +
      '<div class="tile"><span class="tk">待复习</span><span class="tv">' + due + '<small>个</small></span>' +
        '<p class="ts">' + (due ? '刷词时会优先出现。' : '暂时没有到期的。') + '</p></div>' +
      '<div class="tile wide"><span class="tk">掌握度分布</span>' +
        '<div class="mst-bars">' +
          '<div class="mst-bar"><span class="lab">未学</span><span class="track"><i class="fill" style="width:' + pct(m[0]) + '%;--bc:#8A8378;"></i></span><span class="num">' + m[0] + '</span></div>' +
          '<div class="mst-bar"><span class="lab">学习中</span><span class="track"><i class="fill" style="width:' + pct(m[1]) + '%;--bc:var(--amber);"></i></span><span class="num">' + m[1] + '</span></div>' +
          '<div class="mst-bar"><span class="lab">已掌握</span><span class="track"><i class="fill" style="width:' + pct(m[2]) + '%;--bc:var(--moss);"></i></span><span class="num">' + m[2] + '</span></div>' +
        '</div>' +
        '<p class="ts">共 ' + WORDS.length + ' 个词 · 已打卡 ' + checked + ' 个</p>' +
      '</div>' +
      '<div class="tile"><span class="tk">累计刷词</span><span class="tv">' + (mb.total || 0) + '<small>次</small></span>' +
        '<p class="ts">每点一次掌握度记一次</p></div>' +
      '<div class="tile"><span class="tk">自测</span><span class="tv">' + rate + '<small>%</small></span>' +
        '<p class="ts">' + stat.right + ' / ' + stat.total + ' 题 · ' + stat.rounds + ' 轮</p></div>' +
    '</div>' +
    '<p class="stat-note">数据与电脑版工作站共用同一份本机记录</p>' +
    '<div class="link-row"><a class="big-link" href="../index.html">打开电脑版工作站' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>' +
    '</a></div>';
}

/* ============================================================
   顶栏 / 近七天 / 轻提示
   ============================================================ */
let toastTimer = null;
function toast(msg){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

function renderStrip(){
  const host = document.getElementById('weekStrip');
  if(!host) return;
  const week = '日一二三四五六';
  let html = '';
  for(let i = 6; i >= 0; i--){
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = keyOf(d);
    const n = mb.days[k] || 0;
    html += '<div class="day-cell' + (i === 0 ? ' is-today' : '') + (n ? ' has' : '') + '">' +
        '<span class="dc-day">' + week[d.getDay()] + '</span>' +
        '<span class="dc-num">' + (n || '·') + '</span></div>';
  }
  host.innerHTML = html;
}

function refreshHeader(){
  const today = todayCount();
  const num = document.getElementById('todayNum');
  const fill = document.getElementById('goalFill');
  const tip = document.getElementById('goalTip');
  const streak = document.getElementById('streakNum');
  if(num) num.textContent = today;
  if(fill) fill.style.width = Math.min(100, today / GOAL * 100) + '%';
  if(tip){
    tip.textContent = today === 0 ? '刷一张就热身'
      : today >= GOAL ? '今日达成 · 继续也不亏'
      : '再刷 ' + (GOAL - today) + ' 个就收工';
  }
  if(streak) streak.textContent = streakDays();
  const d = new Date();
  const label = document.getElementById('todayLabel');
  if(label) label.textContent = (d.getMonth() + 1) + '月' + d.getDate() + '日 · 周' + '日一二三四五六'[d.getDay()];
  renderStrip();
}

/* ============================================================
   导航与交互（每个容器只绑定一次）
   ============================================================ */
function switchTab(name){
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById('view-' + name);
  if(view) view.classList.add('active');
  if(name === 'lib') renderLib();
  if(name === 'quiz') renderQuiz();
  if(name === 'stat') renderStat();
  const main = document.querySelector('.main');
  if(main) main.scrollTop = 0;
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* 刷词：朗读 / 三档反馈 / 重开一轮 */
document.getElementById('view-deck').addEventListener('click', (e) => {
  const rateBtn = e.target.closest('[data-rate]');
  if(rateBtn){ e.preventDefault(); e.stopPropagation(); advance(Number(rateBtn.dataset.rate)); return; }
  const restart = e.target.closest('[data-restart]');
  if(restart){ e.preventDefault(); queue = buildQueue(); pos = 0; renderDeckShell(); return; }
  const sp = e.target.closest('[data-speak]');
  if(sp){
    e.preventDefault(); e.stopPropagation();
    const card = sp.closest('.swipe-card');
    speakWord(card ? card.dataset.word : '', sp);
  }
});

/* 上滑跳过：只认竖向拖动，松手超过 80px 才算 */
let dragState = null;
document.getElementById('view-deck').addEventListener('pointerdown', (e) => {
  const card = e.target.closest('.swipe-card');
  if(!card) return;
  if(e.target.closest('.rate') || e.target.closest('.mini-card') || e.target.closest('.speak')) return;
  dragState = {id:e.pointerId, card, y:e.clientY, dy:0, moved:false};
  card.style.transition = 'none';
});
document.getElementById('view-deck').addEventListener('pointermove', (e) => {
  if(!dragState || e.pointerId !== dragState.id) return;
  dragState.dy = e.clientY - dragState.y;
  if(Math.abs(dragState.dy) > 6) dragState.moved = true;
  if(dragState.dy < -4){
    dragState.card.style.transform = 'translateY(' + dragState.dy + 'px) rotate(' + (dragState.dy / 70) + 'deg)';
  }
});
function endDrag(){
  if(!dragState) return;
  const {card, dy, moved} = dragState;
  dragState = null;
  card.style.transition = '';
  card.style.transform = '';
  if(moved && dy < -80) advance(null);
}
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);

/* 自测 */
document.getElementById('view-quiz').addEventListener('click', (e) => {
  if(e.target.closest('[data-hint]')){
    const hint = document.getElementById('qHint');
    if(hint) hint.hidden = false;
    const btn = e.target.closest('[data-hint]');
    if(btn) btn.style.display = 'none';
    return;
  }
  if(e.target.closest('[data-quiz-again]')){ startQuiz(); return; }
  if(e.target.closest('[data-quiz-back]')){ switchTab('deck'); return; }
  const submit = e.target.closest('#qSubmit');
  if(submit){ if(quiz.answered) quizNext(); else quizCheck(); }
});

/* 连续天数：点一下看累计 */
document.getElementById('streakBtn').addEventListener('click', () => {
  toast('连续 ' + streakDays() + ' 天 · 累计刷词 ' + (mb.total || 0) + ' 次');
});

/* ============================================================
   启动
   ============================================================ */
queue = buildQueue();
renderDeckShell();
refreshHeader();
