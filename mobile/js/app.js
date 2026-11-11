/* 底部导航切换、全局手势（滑卡 / 拼写拖拽）、键盘适配与启动 */

/* ============================================================
   导航与交互（每个容器只绑定一次）
   ============================================================ */
function switchTab(name){
  /* 答题到一半切走：底部导航恢复，顺手退掉那条历史记录 */
  if(name !== 'exam' && examInRun){
    examInRun = false;
    examChrome(false);
    if(history.state && history.state.examRun) history.back();
  }
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById('view-' + name);
  if(view) view.classList.add('active');
  if(name === 'lib'){
    renderLib();
    /* 从别的页回到字母墙，从第一张样本看起 */
    const lg = document.getElementById('libGrid');
    if(lg) lg.scrollTop = 0;
  }
  if(name === 'quiz') renderQuiz();
  if(name === 'exam') renderExam();
  if(name === 'stat') renderStat();
  if(name !== 'lib') hardCloseLib();
  const main = document.querySelector('.main');
  if(main){
    main.scrollTop = 0;
    main.classList.toggle('lib-on', name === 'lib');
  }
  syncKeyboardBar();
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* 贡献墙：点一格看当天的刷词记录 */
document.getElementById('view-stat').addEventListener('click', (e) => {
  const cell = e.target.closest('.cw-cell[data-day]');
  if(!cell) return;
  const n = Number(cell.dataset.n || 0);
  const p = cell.dataset.day.split('-');
  toast(Number(p[1]) + '月' + Number(p[2]) + '日 · ' + (n ? '刷了 ' + n + ' 个词' : '没有记录'));
});

/* 刷词：朗读 / 三档反馈 / 重开一轮 / 点按翻面 */
document.getElementById('view-deck').addEventListener('click', (e) => {
  if(suppressTap){ suppressTap = false; return; }
  if(spellSuppressTap){ spellSuppressTap = false; return; }
  if(e.target.closest('#deckScope')){
    e.preventDefault(); e.stopPropagation();
    toggleDeckPick();
    return;
  }
  if(e.target.closest('#deckMini') || e.target.closest('#deckMask')){
    e.preventDefault(); e.stopPropagation();
    if(deckPickOpen){ closeDeckPick(); sfxPlay('panelClose'); }
    return;
  }
  const dChip = e.target.closest('[data-deck]');
  if(dChip){
    e.preventDefault(); e.stopPropagation();
    pickDeck(dChip.dataset.deck);
    return;
  }
  if(e.target.closest('#deckPick')) return; /* 面板留白处不翻面 */
  const undoBtn = e.target.closest('#undoBtn');
  if(undoBtn){
    e.preventDefault(); e.stopPropagation();
    undoLast();
    return;
  }
  if(e.target.closest('#scopeExitBtn') || e.target.closest('[data-scope-exit]')){
    e.preventDefault(); e.stopPropagation();
    exitDeckScope();
    return;
  }
  if(e.target.closest('[data-scope-again]')){
    e.preventDefault(); e.stopPropagation();
    replayDeckScope();
    return;
  }
  const rateBtn = e.target.closest('[data-rate]');
  if(rateBtn){
    e.preventDefault(); e.stopPropagation();
    rateBtn.classList.add('stamp');
    rateBtn.addEventListener('animationend', () => rateBtn.classList.remove('stamp'), {once:true});
    advance(Number(rateBtn.dataset.rate));
    return;
  }
  if(e.target.closest('#sfxBtn')) return; /* 音效开关交给 document 级委托，不参与翻面 */
  if(e.target.closest('#hideGlossBtn')) return; /* 遮住答案开关同样走 document 级委托 */
  if(e.target.closest('[data-review]')){
    e.preventDefault(); e.stopPropagation();
    startReviewToday();
    return;
  }
  const tabGo = e.target.closest('[data-tabgo]');
  if(tabGo){
    e.preventDefault(); e.stopPropagation();
    switchTab(tabGo.dataset.tabgo);
    return;
  }
  const restart = e.target.closest('[data-restart]');
  if(restart){ e.preventDefault(); deckScoped = false; deckBackup = null; deckScopeLabel = ''; queue = buildQueue(true); pos = 0; savePos(); undoSnap = null; renderDeckShell(); return; }
  const sp = e.target.closest('[data-speak]');
  if(sp){
    e.preventDefault(); e.stopPropagation();
    const card = sp.closest('.swipe-card');
    speakWord(card ? card.dataset.word : '', sp);
    return;
  }
  if(e.target.closest('.mini-card')) return; /* 词卡链接照常跳转 */
  const sTile = e.target.closest('.spell-tile');
  if(sTile){
    e.preventDefault(); e.stopPropagation();
    const box = sTile.closest('.spell-block');
    if(box && box.dataset.solved !== '1'){
      if(sTile.closest('.spell-slot')) moveTileToTray(sTile);
      else {
        const slot = box.querySelector('.spell-slot:not(.filled)');
        if(slot) moveTileToSlot(sTile, slot);
      }
    }
    return;
  }
  if(e.target.closest('.spell-slot')){ e.preventDefault(); e.stopPropagation(); return; }
  if(e.target.closest('[data-flip]')){ e.preventDefault(); e.stopPropagation(); }
  const card = e.target.closest('.swipe-card');
  if(card){ card.classList.toggle('flipped'); sfxPlay('flip'); }
});

/* 点面板与卡组名以外的地方，收起牌组选择 */
document.addEventListener('click', (e) => {
  if(!deckPickOpen) return;
  if(e.target.closest('#deckPick') || e.target.closest('#deckScope')) return;
  closeDeckPick();
});

/* ============================================================
   背面拼写：单词有几个字母就几个格子，下方字母块拖动/点按排布
   ============================================================ */
let spellSuppressTap = false;
let spellDrag = null;

function shuffleWord(word){
  const a = word.split('');
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  if(a.join('') === word && a.length > 1){
    const t = a[0]; a[0] = a[1]; a[1] = t;
  }
  return a;
}

function spellBlockHtml(word){
  const w = word.toLowerCase();
  const n = w.length;
  /* 一行最多 7 个格子，超过就折行且各行尽量均分（11 个 → 6+5） */
  const rows = Math.ceil(n / 7);
  const cols = Math.ceil(n / rows);
  const slotArr = Array.from({length: n}, () => '<span class="spell-slot"></span>');
  let slotHtml = '';
  for(let i = 0; i < n; i += cols){
    slotHtml += '<div class="spell-row">' + slotArr.slice(i, i + cols).join('') + '</div>';
  }
  const tiles = shuffleWord(w).map((ch) =>
    '<button class="spell-tile" type="button" data-ch="' + esc(ch) + '">' + esc(ch) + '</button>'
  ).join('');
  return '<div class="spell-slots">' + slotHtml + '</div>' +
    '<div class="spell-tiles">' + tiles + '</div>' +
    '<p class="fill-msg" role="status"></p>';
}

function syncSpellSlots(box){
  box.querySelectorAll('.spell-slot').forEach((s) => {
    s.classList.toggle('filled', !!s.querySelector('.spell-tile'));
  });
}

/* 把字母块放进格子：目标格已有字母则交换（来源是托盘时，原字母退回托盘） */
function moveTileToSlot(tile, slot){
  const box = slot && slot.closest('.spell-block');
  if(!box || !tile || box.dataset.solved === '1') return;
  if(slot.querySelector('.spell-tile') === tile) return;
  const fromSlot = tile.closest('.spell-slot');
  const prev = slot.querySelector('.spell-tile');
  if(prev){
    if(fromSlot) fromSlot.appendChild(prev);
    else box.querySelector('.spell-tiles').appendChild(prev);
  }
  slot.appendChild(tile);
  syncSpellSlots(box);
  sfxPlay('drop');
  autoCheckSpell(box);
}

function moveTileToTray(tile){
  const box = tile && tile.closest('.spell-block');
  if(!box || box.dataset.solved === '1') return;
  box.querySelector('.spell-tiles').appendChild(tile);
  syncSpellSlots(box);
  autoCheckSpell(box);
}

function autoCheckSpell(box){
  if(!box || box.dataset.solved === '1') return;
  const word = (box.dataset.spellWord || '').toLowerCase();
  const msg = box.querySelector('.fill-msg');
  const slots = Array.from(box.querySelectorAll('.spell-slot'));
  box.classList.remove('ok', 'bad');
  if(!slots.length || slots.some((s) => !s.querySelector('.spell-tile'))){
    if(msg) msg.textContent = '';
    return;
  }
  const ans = slots.map((s) => s.querySelector('.spell-tile').dataset.ch).join('');
  void box.offsetWidth; /* 重排一次，错误抖动动画可重复触发 */
  if(ans === word){
    box.classList.add('ok');
    box.dataset.solved = '1';
    if(msg) msg.textContent = '✓ 拼写正确 · ' + word;
    sfxPlay('ok');
  } else {
    box.classList.add('bad');
    if(msg) msg.textContent = '✗ 顺序不对 · 再调整一下';
    sfxPlay('bad');
  }
}

function slotAtPoint(x, y, box){
  const el = document.elementFromPoint(x, y);
  if(!el) return null;
  const slot = el.closest('.spell-slot');
  return (slot && box.contains(slot)) ? slot : null;
}

/* 拖动：按下字母块生成跟随手指的幽灵块，松手落到格子或退回托盘 */
document.addEventListener('pointerdown', (e) => {
  const tile = e.target.closest('.spell-tile');
  if(!tile) return;
  const box = tile.closest('.spell-block');
  if(!box || box.dataset.solved === '1') return;
  if(e.pointerType === 'mouse' && e.button !== 0) return;
  const r = tile.getBoundingClientRect();
  const cs = getComputedStyle(tile);
  const ghost = tile.cloneNode(true);
  ghost.classList.add('spell-ghost');
  ghost.classList.remove('dragging');
  ghost.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;display:grid;place-items:center;pointer-events:none;z-index:9999;' +
    'font-family:' + cs.fontFamily + ';font-size:' + cs.fontSize + ';font-weight:' + cs.fontWeight + ';line-height:1;' +
    'color:' + cs.color + ';background:' + cs.backgroundColor + ';border:2px solid ' + cs.borderColor + ';border-radius:' + cs.borderRadius + ';' +
    'box-shadow:0 8px 18px -8px rgba(32,36,42,.45);transform:rotate(-3deg);';
  document.body.appendChild(ghost);
  spellDrag = {id:e.pointerId, tile, box, ghost, dx:e.clientX - r.left, dy:e.clientY - r.top, sx:e.clientX, sy:e.clientY, moved:false};
  tile.classList.add('dragging');
});

document.addEventListener('pointermove', (e) => {
  if(!spellDrag || e.pointerId !== spellDrag.id) return;
  const d = spellDrag;
  if(!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 9) d.moved = true;
  if(!d.moved) return;
  e.preventDefault();
  d.ghost.style.left = (e.clientX - d.dx) + 'px';
  d.ghost.style.top = (e.clientY - d.dy) + 'px';
  const slot = slotAtPoint(e.clientX, e.clientY, d.box);
  d.box.querySelectorAll('.spell-slot').forEach((s) => {
    s.classList.toggle('hot', s === slot);
  });
}, {passive:false});

function endSpellDrag(e){
  if(!spellDrag) return;
  if(e && e.pointerId !== undefined && e.pointerId !== spellDrag.id) return;
  const d = spellDrag;
  spellDrag = null;
  d.ghost.remove();
  d.tile.classList.remove('dragging');
  d.box.querySelectorAll('.spell-slot.hot').forEach((s) => s.classList.remove('hot'));
  if(!d.moved) return; /* 没有位移 → 交给 click 处理（点按填格 / 点回收回） */
  spellSuppressTap = true;
  setTimeout(() => { spellSuppressTap = false; }, 90);
  const slot = e ? slotAtPoint(e.clientX, e.clientY, d.box) : null;
  if(slot) moveTileToSlot(d.tile, slot);
  else if(d.tile.closest('.spell-slot')) moveTileToTray(d.tile);
}
document.addEventListener('pointerup', endSpellDrag);
document.addEventListener('pointercancel', endSpellDrag);

/* 手势：上滑跳过 / 右滑认识 / 左滑不认识 / 下滑有点印象 / 点按翻面 */
let dragState = null, suppressTap = false;
const HINT_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15"/><path d="m13 6 6 6-6 6"/></svg>';
const DIR_LABEL = {up:'跳过', right:'认识', left:'不认识', down:'有点印象'};

function hintDir(card, dx, dy){
  const h = card.querySelector('.dir-hint');
  if(!h) return;
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if(Math.max(ax, ay) < 16){ h.classList.remove('show'); return; }
  const dir = ax > ay ? (dx > 0 ? 'right' : 'left') : (dy < 0 ? 'up' : 'down');
  if(h.dataset.dir !== dir){
    h.dataset.dir = dir;
    h.innerHTML = '<span class="dh-ico">' + HINT_ARROW + '</span>' + DIR_LABEL[dir];
  }
  h.classList.add('show');
}
function hideHint(card){
  const h = card.querySelector('.dir-hint');
  if(h) h.classList.remove('show');
}

const deckView = document.getElementById('view-deck');
deckView.addEventListener('pointerdown', (e) => {
  const card = e.target.closest('.swipe-card');
  if(!card) return;
  if(e.target.closest('.rate') || e.target.closest('.mini-card') || e.target.closest('.speak') || e.target.closest('[data-flip]')) return;
  /* 背面拼写块的拖动/点按交给 spellDrag 处理，不参与切卡手势 */
  if(e.target.closest('.spell-tile') || e.target.closest('.spell-slot')) return;
  /* 背面：仍记录起点，但只接管水平滑动；垂直方向留给 back-body 原生滚动 */
  const back = card.classList.contains('flipped') && !!e.target.closest('.face.back');
  dragState = {id:e.pointerId, card, x:e.clientX, y:e.clientY, dx:0, dy:0, moved:false, back, fired:false};
  if(!back) card.style.transition = 'none';
});
deckView.addEventListener('pointermove', (e) => {
  if(!dragState || e.pointerId !== dragState.id) return;
  const st = dragState;
  st.dx = e.clientX - st.x;
  st.dy = e.clientY - st.y;
  if(!st.moved && Math.hypot(st.dx, st.dy) > 8) st.moved = true;
  if(!st.moved) return;
  if(st.back){
    /* 背面不做位移反馈，只在横向明显滑动时切卡；纵向交给浏览器滚动 */
    if(!st.fired && Math.abs(st.dx) > Math.abs(st.dy) && Math.abs(st.dx) > 55){
      st.fired = true;
      advance(st.dx > 0 ? 2 : 0, st.dx > 0 ? 'right' : 'left');
    }
    return;
  }
  st.card.style.transform = 'translate(' + st.dx + 'px,' + st.dy + 'px) rotate(' + (st.dx / 45) + 'deg)';
  hintDir(st.card, st.dx, st.dy);
});
function endDrag(){
  if(!dragState) return;
  const {card, dx, dy, moved, back} = dragState;
  dragState = null;
  if(!back){
    card.style.transition = '';
    card.style.transform = '';
    hideHint(card);
  }
  if(!moved) return; /* 没有位移 → 交给 click 判定为点按翻面 */
  if(back){
    /* 背面有位移就不当点按：横向已切卡，纵向是滚动，都不该翻回正面 */
    suppressTap = true;
    setTimeout(() => { suppressTap = false; }, 80);
    return;
  }
  suppressTap = true;
  setTimeout(() => { suppressTap = false; }, 80);
  const TH = 70;
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if(ax > ay){
    if(ax > TH) advance(dx > 0 ? 2 : 0, dx > 0 ? 'right' : 'left');
  } else if(ay > TH){
    advance(dy < 0 ? null : 1, dy < 0 ? 'up' : 'down');
  }
}
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);

/* 手机返回键 / 浏览器后退：面板开着就先收面板，不直接退出页面。
   这条历史记录是我们压的，返回键已经把它吃掉，所以这里只关面板、不再 back() */
window.addEventListener('popstate', () => {
  /* 期末答题中按手机返回键：回到题库首页，不退出页面。
     这条记录是我们压的，返回键已经把它吃掉，所以这里不再 back() */
  if(examInRun){
    examInRun = false;
    examChrome(false);
    renderExam();
    return;
  }
  /* 自己点遮罩/选牌组关闭时退记录，这一次 popstate 不处理，
     否则快速再点开会被它顺手关掉 */
  if(pickIgnorePop){ pickIgnorePop--; return; }
  if(!deckPickOpen) return;
  pickHistory = false;
  closeDeckPick();
  sfxPlay('panelClose');
});

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

/* ============================================================
   手机键盘：键入时收起底栏
   键盘弹出会让可视高度变矮，底栏会被一起顶到键盘上方；
   这里在输入框获得焦点（键盘弹出）时收起底栏，失焦后恢复
   ============================================================ */
function syncKeyboardBar(){
  const app = document.querySelector('.app');
  if(!app) return;
  const phoneLike = window.innerWidth < 520 ||
    (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);
  const ae = document.activeElement;
  const typing = phoneLike && !!ae &&
    (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
  app.classList.toggle('kb-typing', typing);
}
document.addEventListener('focusin', syncKeyboardBar, true);
document.addEventListener('focusout', () => setTimeout(syncKeyboardBar, 0), true);

/* ============================================================
   启动
   ============================================================ */
const restored = restoreQueue();
queue = restored.queue;
pos = restored.pos;
deckScopeLabel = restored.label || '';   /* 复习模式等非分组的卡组名跟着存档回来 */
savePos();          /* 把队列与当前下标同步回存档 */
renderDeckShell();
refreshHeader();
