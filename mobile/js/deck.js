/* 刷词：队列、朗读、音效、遮答案、词卡渲染、评分、撤回、牌组选择面板 */

/* ------------------------------------------------------------
   刷词队列：按到期日排序（到期早的先刷），同日按掌握度，再按字母序
   ------------------------------------------------------------ */
function shuffle(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function buildQueue(onlyFresh){
  const rated = ratedToday();
  const all = WORDS.slice().sort((a, b) =>
    rec(a.word).dueAt - rec(b.word).dueAt ||      /* 到期早的先刷 */
    masteryOf(a.word) - masteryOf(b.word) ||       /* 同一到期日按掌握度 */
    a.word.localeCompare(b.word));                 /* 并列时稳定可复现 */
  /* 今天已评分的词排到队尾：不删掉（允许重刷），但不占队首 */
  const fresh = all.filter(w => !rated.has(w.word));
  const done = all.filter(w => rated.has(w.word));
  /* onlyFresh：重开一轮只刷今天还没刷过的（方案 A） */
  return onlyFresh ? fresh : fresh.concat(done);
}
let queue = [];
let pos = 0;
let animating = false;
/* 词库「刷这组」：临时队列，不写全局进度存档 */
let deckScoped = false;
let deckBackup = null;      /* 进入分组前的 {queue, pos, undoSnap} */
let deckScopeLabel = '';    /* 当前分组字母，如 'C' */
let deckPickOpen = false;   /* 牌组选择面板是否展开 */
let deckPickDirty = true;   /* 面板里的计数是否过期（评分后掌握度会变） */
let pickHistory = false;    /* 面板打开时压了一条历史记录，供手机返回键收回 */
let pickIgnorePop = 0;      /* 自己发起的 back() 会触发 popstate，用计数把它忽略掉 */

/* ------------------------------------------------------------
   朗读：优先播放预生成的发音文件（WebView 壳里通常没有系统 TTS），
   文件缺失或不支持播放时再退回系统朗读
   ------------------------------------------------------------ */
const AUDIO_BASE = 'audio/';
let speakAudio = null;
let speakBtn = null;
function stopSpeak(){
  if(speakAudio){ try{ speakAudio.pause(); }catch(e){} }
  if(speakBtn){ speakBtn.classList.remove('speaking'); speakBtn = null; }
}
let speakVO = null;
let ttsWarned = false;
/* 设备没有英文语音引擎时只提示一次，避免每点一下朗读就弹一次 */
function warnNoTts(){
  if(ttsWarned) return;
  ttsWarned = true;
  toast('设备缺少英文语音引擎，请在系统设置里安装');
}
function speakFallback(word, btn){
  if(!('speechSynthesis' in window)){ toast('朗读音频缺失，请检查网络'); return; }
  window.speechSynthesis.cancel();
  const u = speakVO = new SpeechSynthesisUtterance(word);
  u.lang = 'en-US';
  u.rate = 0.85;
  const off = () => { if(btn && speakVO === u && speakBtn === btn){ btn.classList.remove('speaking'); speakBtn = null; } };
  if(btn){ btn.classList.add('speaking'); speakBtn = btn; }
  u.onend = off;
  u.onerror = (e) => {
    off();
    const reason = e && e.error;
    if(reason === 'interrupted' || reason === 'canceled') return;
    warnNoTts();
  };
  window.speechSynthesis.speak(u);
}
/* 预取当前卡和下一张卡的发音，滑卡后按下就能立刻出声 */
const audioPreload = new Map();
const audioMiss = new Set();
function preloadAudio(word){
  if(!word || audioPreload.has(word)) return;
  if(audioPreload.size > 6) audioPreload.clear();
  const a = new Audio();
  a.preload = 'auto';
  a.src = AUDIO_BASE + encodeURIComponent(word) + '.mp3';
  audioPreload.set(word, a);
}
function speakWord(word, btn){
  if(!word) return;
  stopSpeak();
  if(audioMiss.has(word)){ speakFallback(word, btn); return; }
  if('speechSynthesis' in window) window.speechSynthesis.cancel();
  if(!speakAudio){ speakAudio = new Audio(); speakAudio.preload = 'auto'; }
  const a = speakAudio;
  let done = false;
  const off = () => {
    if(btn && speakBtn === btn){ btn.classList.remove('speaking'); speakBtn = null; }
  };
  const fail = () => {
    if(done) return;
    done = true;
    audioMiss.add(word); /* 记住缺音频的词，下次直接走朗读，不再白请求 */
    off();
    speakFallback(word, btn);
  };
  a.onended = () => { done = true; off(); };
  a.onerror = fail;
  a.src = AUDIO_BASE + encodeURIComponent(word) + '.mp3';
  if(btn){ speakBtn = btn; btn.classList.add('speaking'); }
  try{ a.currentTime = 0; }catch(e){}
  const pr = a.play();
  if(pr && pr.catch) pr.catch(fail);
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
   合成音效（WebAudio，无外部音频资源）
   静音状态单独存 wc_sound_v1，不动既有的几个数据键
   ------------------------------------------------------------ */
const SFX_KEY = 'wc_sound_v1';
let sfxCtx = null;
let sfxMaster = null;
const SFX_ON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/></svg>';
const SFX_OFF_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5"/><path d="M21 9.5l-5 5"/></svg>';

function sfxOn(){
  try{ return localStorage.getItem(SFX_KEY) !== '0'; }catch(e){ return true; }
}
function sfxCtxGet(){
  if(sfxCtx) return sfxCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return null;
  try{
    sfxCtx = new AC();
    sfxMaster = sfxCtx.createGain();
    sfxMaster.gain.value = .2; /* master gain 固定在 .25 以下 */
    sfxMaster.connect(sfxCtx.destination);
  }catch(e){ sfxCtx = null; sfxMaster = null; }
  return sfxCtx;
}
function sfxTone(freq, offset, dur, type, vol, freqEnd){
  if(!sfxCtx) return;
  const t = sfxCtx.currentTime + offset;
  const o = sfxCtx.createOscillator(), g = sfxCtx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t);
  /* 带一点滑音：从 freq 滑到 freqEnd，刷词的「嗖」感就靠它 */
  if(freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + .008);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(sfxMaster);
  o.start(t); o.stop(t + dur + .02);
}
/* 小铃铛：基音 + 两个泛音，比单纯正弦更有「叮」的质感 */
function sfxBell(freq, offset, dur, vol){
  sfxTone(freq, offset, dur, 'sine', vol);
  sfxTone(freq * 2, offset, dur * .55, 'sine', vol * .34);
  sfxTone(freq * 3, offset, dur * .3, 'sine', vol * .13);
}
function sfxNoise(offset, dur, filterType, freq, vol, freqEnd, q){
  if(!sfxCtx) return;
  const t = sfxCtx.currentTime + offset;
  const len = Math.max(1, Math.floor(sfxCtx.sampleRate * dur));
  const buf = sfxCtx.createBuffer(1, len, sfxCtx.sampleRate);
  const data = buf.getChannelData(0);
  for(let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = sfxCtx.createBufferSource();
  src.buffer = buf;
  const f = sfxCtx.createBiquadFilter();
  f.type = filterType;
  f.frequency.setValueAtTime(freq, t);
  if(freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur); /* 扫频：翻纸/滑走的风声 */
  if(q) f.Q.value = q;
  const g = sfxCtx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(sfxMaster);
  src.start(t); src.stop(t + dur);
}
/* 轻振一下：和音效一起开关，安卓 Chrome 支持；不支持就静默跳过 */
function sfxHaptic(pattern){
  if(!sfxOn()) return;
  try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(e){}
}
/* 连续「认识」的连击数：音高逐张升高，连击断了就回落 */
let sfxStreak = 0;
function sfxPlay(name){
  if(!sfxOn()) return;
  const ctx = sfxCtxGet();
  if(!ctx) return; /* 首次手势前 ctx 不会被创建 */
  if(ctx.state === 'suspended'){ try{ ctx.resume(); }catch(e){} }
  if(name === 'rate2') sfxStreak++;
  else if(name === 'rate0' || name === 'skip') sfxStreak = 0;
  switch(name){
    case 'rate2': {
      /* 连击每多一张升高一个半音（最多 5 个），像珠子一颗颗落进碗里 */
      const k = Math.min(Math.max(sfxStreak - 1, 0), 5);
      const f = 523.25 * Math.pow(2, k / 12);
      sfxBell(f, 0, .34, .5);
      sfxNoise(0, .03, 'highpass', 2600, .18, 3200, .6);
      if(sfxStreak >= 3) sfxBell(f * 1.5, .08, .16, .16); /* 连击 3 张起加一颗小亮片 */
      sfxHaptic(12);
      break;
    }
    case 'rate1':
      /* 有点印象：一声短促的软音，尾巴微微下沉，像点头 */
      sfxTone(392, 0, .1, 'sine', .42, 356);
      sfxNoise(0, .04, 'lowpass', 900, .12);
      sfxHaptic(8);
      break;
    case 'rate0':
      /* 不认识：低沉但不惩罚，一声闷响带点风声落地 */
      sfxTone(196, 0, .11, 'triangle', .4, 168);
      sfxNoise(0, .09, 'lowpass', 420, .2, 240);
      sfxHaptic(22);
      break;
    case 'skip':
      /* 跳过：空气被划开的长「嗖」，不占评分音的记忆点 */
      sfxNoise(0, .17, 'highpass', 700, .28, 1500, .8);
      sfxTone(330, 0, .1, 'sine', .16, 294);
      sfxHaptic(6);
      break;
    case 'flip':
      /* 翻面：两段纸声——先掀起，再落下 */
      sfxNoise(0, .08, 'bandpass', 2200, .24, 900, 1.1);
      sfxNoise(.07, .1, 'lowpass', 1300, .2, 700, .8);
      sfxTone(170, .07, .07, 'sine', .1);
      sfxHaptic(6);
      break;
    case 'drop':
      /* 拼写落格：一粒小扣子落进格子的「哒」 */
      sfxNoise(0, .03, 'bandpass', 1700, .22, 2400, 2);
      sfxTone(880, 0, .025, 'square', .1);
      sfxHaptic(4);
      break;
    case 'ok':
      /* 拼写完成：三级小铃，一声比一声亮 */
      sfxBell(523.25, 0, .3, .42);
      sfxBell(659.25, .06, .3, .4);
      sfxBell(783.99, .12, .34, .4);
      sfxHaptic([10, 24, 12]);
      break;
    case 'bad':
      /* 拼错：两声轻闷的「嘟嘟」，音量压得很低 */
      sfxTone(190, 0, .08, 'square', .18, 176);
      sfxTone(150, .09, .1, 'square', .15, 140);
      sfxHaptic(18);
      break;
    case 'goal':
      /* 今日达标：四音上行 + 一把细碎亮片 */
      sfxBell(523.25, 0, .34, .42);
      sfxBell(659.25, .08, .34, .42);
      sfxBell(783.99, .16, .36, .4);
      sfxBell(1046.5, .24, .46, .46);
      sfxNoise(.1, .3, 'highpass', 2400, .16, 4200, 1.4);
      sfxHaptic([10, 30, 10, 30, 16]);
      break;
    case 'panelOpen':
      /* 牌架拉开：一段纸滑声 + 一声轻铃 */
      sfxNoise(0, .16, 'bandpass', 780, .2, 1700, .9);
      sfxBell(440, .03, .26, .2);
      sfxHaptic(8);
      break;
    case 'panelClose':
      /* 牌架收回：比拉开低一档、短一截 */
      sfxNoise(0, .12, 'lowpass', 900, .14, 420, .8);
      sfxHaptic(4);
      break;
    case 'pick':
      /* 选中一档：一粒小扣子落定 */
      sfxNoise(0, .03, 'bandpass', 1700, .2, 2400, 2);
      sfxTone(700, 0, .07, 'sine', .26, 620);
      sfxHaptic(8);
      break;
  }
}
function sfxButtonHtml(){
  const on = sfxOn();
  return '<button class="sfx-btn' + (on ? '' : ' off') + '" id="sfxBtn" type="button" aria-label="音效开关" title="音效开关">' +
    (on ? SFX_ON_ICON : SFX_OFF_ICON) + '</button>';
}
function syncSfxBtn(){
  const btn = document.getElementById('sfxBtn');
  if(!btn) return;
  const on = sfxOn();
  btn.classList.toggle('off', !on);
  btn.innerHTML = on ? SFX_ON_ICON : SFX_OFF_ICON;
}
function setSfx(on){
  try{ localStorage.setItem(SFX_KEY, on ? '1' : '0'); }catch(e){}
  if(!on){
    if(sfxCtx){ try{ sfxCtx.suspend(); }catch(e){} }
  } else {
    const ctx = sfxCtxGet();
    if(ctx && ctx.state === 'suspended'){ try{ ctx.resume(); }catch(e){} }
    sfxStreak = 0;
    sfxPlay('ok'); /* 开启时给一声确认音，顺便在当前手势里解锁音频 */
  }
  syncSfxBtn();
}

/* 首次手势解锁 AudioContext；页面隐藏时挂起 */
document.addEventListener('pointerdown', () => {
  const ctx = sfxCtxGet();
  if(ctx && ctx.state === 'suspended'){ try{ ctx.resume(); }catch(e){} }
}, {once:true, passive:true});
document.addEventListener('visibilitychange', () => {
  if(!sfxCtx) return;
  if(document.hidden){
    try{ sfxCtx.suspend(); }catch(e){}
  } else if(sfxOn() && sfxCtx.state === 'suspended'){
    try{ sfxCtx.resume(); }catch(e){}
  }
});

/* 音效开关：deck 会重渲染，所以用 document 级委托 */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#sfxBtn');
  if(!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const on = !sfxOn();
  setSfx(on);
  toast(on ? '音效已开启' : '音效已关闭');
});

/* ------------------------------------------------------------
   顶部「遮答案」开关：正面模糊释义、背面模糊单词，翻面/评分不变
   状态单独存 wc_hide_gloss_v1
   ------------------------------------------------------------ */
const GLOSS_KEY = 'wc_hide_gloss_v1';
const GLOSS_ON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const GLOSS_OFF_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/></svg>';

function glossHidden(){
  try{ return localStorage.getItem(GLOSS_KEY) === '1'; }catch(e){ return false; }
}
function applyGloss(){
  const hidden = glossHidden();
  const app = document.querySelector('.app');
  if(app) app.classList.toggle('hide-gloss', hidden);
  const btn = document.getElementById('hideGlossBtn');
  if(!btn) return;
  btn.classList.toggle('on', hidden);
  btn.setAttribute('aria-pressed', hidden ? 'true' : 'false');
  btn.setAttribute('aria-label', hidden ? '显示答案' : '遮住答案');
  btn.title = hidden ? '显示答案' : '遮住答案';
  btn.innerHTML = hidden ? GLOSS_OFF_ICON : GLOSS_ON_ICON;
}
function setGloss(hidden){
  try{ localStorage.setItem(GLOSS_KEY, hidden ? '1' : '0'); }catch(e){}
  applyGloss();
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#hideGlossBtn');
  if(!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const to = !glossHidden();
  setGloss(to);
  toast(to ? '已遮住：正面释义 · 背面单词' : '已显示释义与单词');
});
applyGloss();

/* ------------------------------------------------------------
   刷词卡渲染
   ------------------------------------------------------------ */
const SPEAK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/></svg>';

function rootOf(w){
  const roots = (w.roots && w.roots.length) ? w.roots : ['other'];
  const meta = ROOT_META[roots[0]] || ROOT_META.other;
  return {label: roots.map(r => (ROOT_META[r] || ROOT_META.other).label).join(' / '), color: meta.color};
}

/* 牌组面板打开时右上角收起来的小卡：显示当前词 */
function miniCardHtml(){
  const w = queue[pos] || queue[queue.length - 1];
  if(!w) return '<div class="deck-mini" id="deckMini" hidden></div>';
  return '<div class="deck-mini" id="deckMini" title="收起牌组面板">' +
      miniCardInner(w) +
    '</div>';
}
function miniCardInner(w){
  return '<div class="wm">' + esc(w.word) + '</div>' +
    '<div class="gm">' + esc(w.gloss || '') + '</div>' +
    '<div class="bm"><span>' + esc(scopeName()) + '</span></div>';
}
/* 小卡内容跟着当前词走：外壳只在重建 deck 时生成，词是刷到哪张算哪张 */
function syncMiniCard(){
  const box = document.getElementById('deckMini');
  const w = queue[pos] || queue[queue.length - 1];
  if(!box || !w) return;
  box.removeAttribute('hidden');
  box.innerHTML = miniCardInner(w);
}

function renderDeckShell(){
  const view = document.getElementById('view-deck');
  closeDeckPick(); /* 重建外壳时若面板还开着，顺手把那条历史记录也退掉 */
  view.innerHTML = '<div class="deck-wrap">' +
      '<div class="deck-meta">' +
        '<button class="deck-scope" id="deckScope" type="button" aria-haspopup="true" aria-expanded="false" title="切换牌组">' +
          '<span class="scope-back" aria-hidden="true"></span>' +
          '<span class="deck-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
          '<span class="scope-name">' +
            '<span class="nm">' + esc(scopeName()) + '</span>' +
            '<span class="bk" aria-hidden="true">返回</span>' +
          '</span>' +
        '</button>' +
        '<span>第 <b id="deckPos">1</b> / <b id="deckTotal">' + queue.length + '</b> 张</span>' +
        '<span class="deck-tools">' +
        (deckScoped ? '<button class="undo-btn" id="scopeExitBtn" type="button" aria-label="退出分组">退出</button>' : '') +
        '<button class="undo-btn" id="undoBtn" type="button" aria-label="撤回上一张" hidden>撤回</button>' +
        '<button class="gloss-btn" id="hideGlossBtn" type="button" aria-label="遮住答案" aria-pressed="false" title="遮住答案"></button>' +
        sfxButtonHtml() + '</span>' +
        '</div>' +
      '<div class="deck-stage" id="deckStage">' +
        '<div class="deck-mask" id="deckMask" aria-hidden="true"></div>' +
        '<div class="stack" id="cardStack"></div>' +
        miniCardHtml() +
        '<div class="shelf-clip">' +
          '<div class="deck-shelf" id="deckPick" role="dialog" aria-label="选择牌组"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  renderCard(false);
  deckPickPrebuild(); /* 面板内容提前建好，点开时只切类，不再临时排版 */
  syncSfxBtn();
  applyGloss(); /* 按钮随 deck 一起重建，重新同步图标与状态 */
}

function cardHtml(w, plain){
  const m = masteryOf(w.word);
  const rt = rootOf(w);
  const rep = reviewDone(w.word);
  const art = ART[w.word] || '';
  const qa = (w.q && w.q.length) ? w.q[0] : null;
  const ex = qa && qa.q ? qa.q.replace('<span class="qz-blank"></span>', '<span class="bz-ans">' + (qa.a || '') + '</span>') : '';
  const pal = paletteOf(w.word);
  return '<div class="swipe-card in' + (plain ? ' plain' : '') + '" data-word="' + w.word + '" style="--rc:' + rt.color + ';' + pal.style + '">' +
      '<div class="dir-hint" aria-hidden="true"></div>' +
      '<div class="flip-inner">' +
        '<div class="face front">' +
          '<div class="card-head rv1">' +
            '<span class="root-tag"><i class="dot"></i>' + rt.label + '</span>' +
            '<span class="mst-tag" style="color:' + (m === 2 ? '#4C6B52' : m === 1 ? '#9A7B34' : '#8A8378') + '">' + MST_LABEL[m] + '</span>' +
            '<a class="mini-card" href="../' + w.file + '">词卡 ›</a>' +
          '</div>' +
          '<div class="card-main">' +
            '<div class="word-row rv2"><div><h2 class="word">' + w.word + '</h2></div>' +
              '<button class="speak" type="button" data-speak aria-label="朗读 ' + w.word + '">' + SPEAK_ICON + '</button></div>' +
            '<p class="gloss rv3">' + (w.gloss || '') + '</p>' +
            '<div class="meta rv3"><span class="ipa">' + (w.ipa || '') + '</span>' +
              (w.pos ? '<span class="pos">' + w.pos + '</span>' : '') + '</div>' +
            '<div class="art-frame rv4"><div class="di-art" data-art="' + w.word + '">' + art + '</div>' +
              '<span class="art-tag">' + (w.scene ? '意象' : '词卡') + (rep ? ' · 打卡 ' + rep + '/4' : '') + '</span></div>' +
            '<p class="scene rv5">' + (w.scene || '') + '</p>' +
            '<p class="morph rv5b"><b>词根</b>' + (w.morph || '') + '</p>' +
          '</div>' +
          '<div class="actions rv6">' +
            '<button class="rate r0" type="button" data-rate="0">不认识</button>' +
            '<button class="rate r1" type="button" data-rate="1">有点印象</button>' +
            '<button class="rate r2" type="button" data-rate="2">认识</button>' +
          '</div>' +
        '</div>' +
        '<div class="face back">' +
          '<div class="back-band"></div>' +
          '<div class="back-inner">' +
            '<div class="back-head">' +
              '<div class="back-word"><span class="back-word-txt">' + w.word + '</span><span class="back-ipa">' + (w.ipa || '') + '</span></div>' +
              '<a class="mini-card back-link" href="../' + w.file + '">打开完整词卡 ›</a>' +
            '</div>' +
            '<div class="back-body">' +
              '<p class="back-gloss">' + (w.gloss || '') + '</p>' +
              (w.morph ? '<div class="back-block"><h4>构词</h4>' + rootLineHtml(w.morph) + '</div>' : '') +
              (ex ? '<div class="back-block"><h4>例句</h4><p class="back-ex">' + ex + '</p></div>' : '') +
              '<div class="back-block fill-block spell-block" data-spell-word="' + esc(w.word.toLowerCase()) + '">' +
                '<h4>拼写</h4>' +
                '<p class="fill-q">把下面的字母拖进格子，按顺序拼出这个单词</p>' +
                spellBlockHtml(w.word) +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function renderCard(plainInner){
  const host = document.getElementById('cardStack');
  const posEl = document.getElementById('deckPos');
  if(!host) return;
  if(posEl) posEl.textContent = Math.min(pos + 1, queue.length);
  const w = queue[pos];
  if(!w){
    /* 分组刷词：本组刷完，停在组内完成页 */
    if(deckScoped){
      host.innerHTML = '<div class="deck-empty">' +
        '<span class="big">' + esc(deckScopeLabel) + '刷完了</span>' +
        '<small>共 ' + queue.length + ' 个 · 这一组已经过了一遍</small>' +
        '<div class="empty-actions">' +
          '<button class="rate r2" type="button" data-scope-exit style="padding:.55rem 1.1rem;">回到全部</button>' +
          '<button class="rate r0" type="button" data-scope-again style="padding:.55rem 1.1rem;">再刷一遍</button>' +
        '</div></div>';
      return;
    }
    /* 今天已无未刷词 → 全部刷完；否则只是这一轮刷完，可继续刷没刷过的 */
    const rated = ratedToday();
    const allDone = WORDS.every(w => rated.has(w.word));
    const actions = allDone
      ? '<div class="empty-actions">' +
          '<button class="rate r2" type="button" data-review style="padding:.55rem 1.1rem;">复习今天刷过的</button>' +
          '<button class="rate r0" type="button" data-tabgo="quiz" style="padding:.55rem 1.1rem;">去自测</button>' +
          '<button class="rate r0" type="button" data-tabgo="lib" style="padding:.55rem 1.1rem;">回词库</button>' +
        '</div>'
      : '<button class="rate r2" type="button" data-restart style="padding:.55rem 1.1rem;">刷剩下的</button>';
    host.innerHTML = '<div class="deck-empty"><span class="big">' + (allDone ? '今天全部刷完' : '这轮刷完了') + '</span>' +
      '<small>' + (allDone
        ? '今天 ' + todayCount() + ' 个 · 复习一遍、做个自测，或回词库挑掌握度弱的刷。'
        : '今天 ' + todayCount() + ' 个 · 去词库或自测继续，也可以只刷今天没刷过的。') + '</small>' +
      actions + '</div>';
    return;
  }
  ensureArtCss(w.word);
  /* 界面强调色跟随当前词卡自己的强调色，不再固定一套通用配色 */
  const appEl = document.querySelector('.app');
  const pal = paletteOf(w.word);
  if(appEl && pal.accent) appEl.style.setProperty('--ac', pal.accent);
  host.innerHTML = cardHtml(w, plainInner);
  preloadAudio(w.word);
  preloadAudio(queue[pos + 1] && queue[pos + 1].word);
}

/* 间隔按「天」算，统一落到当天 0 点 */
function dueAfter(level){
  const today = startOfDay(Date.now());
  if(level === 0) return today;                   /* 不认识 → 次日回到到期队列前排 */
  if(level === 1) return today + 86400000;        /* 有点印象 → 明天 0 点 */
  return today + 3 * 86400000;                    /* 认识 → 3 天后 0 点 */
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
  r.dueAt = dueAfter(level);
  deckPickDirty = true; /* 掌握度分布变了，下次开面板要重算 */
  persist(STORE_KEY, store);
  markRated(word);
  bumpToday(1);
  sfxPlay('rate' + level);
  /* 今日首次达标：进度线扫光一次 + 达成音，当天只触发一次 */
  if(todayCount() === GOAL){
    shineGoal();
    sfxPlay('goal');
  }
}

function shineGoal(){
  const fill = document.getElementById('goalFill');
  if(!fill) return;
  fill.classList.remove('shine');
  void fill.offsetWidth;
  fill.classList.add('shine');
  fill.addEventListener('animationend', () => fill.classList.remove('shine'), {once:true});
}

function tickPos(){
  const el = document.getElementById('deckPos');
  if(!el) return;
  el.classList.remove('tick');
  void el.offsetWidth;
  el.classList.add('tick');
  el.addEventListener('animationend', () => el.classList.remove('tick'), {once:true});
}

/* ------------------------------------------------------------
   撤回：滑走一张后状态条出现「撤回」，把这张卡与今天的记录一起退回
   ------------------------------------------------------------ */
let undoSnap = null;

function setUndoVisible(v){
  const btn = document.getElementById('undoBtn');
  if(btn) btn.hidden = !v;
}

/* 在评分/跳过发生前拍快照，撤回时原样还原 */
function takeUndoSnap(word){
  undoSnap = {
    word: word,
    pos: pos,
    wordRec: store[word] ? Object.assign({}, store[word]) : null,
    days: Object.assign({}, mb.days || {}),
    total: mb.total || 0,
    rated: JSON.parse(JSON.stringify(mb.rated || {})),
    savedPos: mb.pos ? Object.assign({}, mb.pos) : null
  };
}

function undoLast(){
  if(!undoSnap || animating) return;
  const u = undoSnap;
  undoSnap = null;
  if(u.wordRec) store[u.word] = u.wordRec;
  else delete store[u.word];
  persist(STORE_KEY, store);
  mb.days = u.days;
  mb.total = u.total;
  mb.rated = u.rated;
  if(u.savedPos) mb.pos = u.savedPos;
  else delete mb.pos;
  persist(MB_KEY, mb);
  pos = u.pos;
  renderCard();
  tickPos();
  refreshHeader();
  setUndoVisible(false);
  toast('已撤回：' + u.word);
}

function advance(level, dir){
  if(animating) return;
  const w = queue[pos];
  if(!w) return;
  animating = true;
  takeUndoSnap(w.word);
  setUndoVisible(false);
  if(level === null) toast('已跳过');
  else {
    rateWord(w.word, level);
    toast(level === 2 ? '标记为已掌握' : level === 1 ? '标记为学习中' : '已回到未学，明天再来');
    refreshHeader();
    if(todayCount() === GOAL) setTimeout(() => toast('今日 10 个达成，收工！'), 700);
  }
  if(level === null) sfxPlay('skip'); /* 跳过单独音色，避免与评分音重复 */
  const card = document.querySelector('.swipe-card');
  if(card) card.classList.add('out-' + (dir || (level === null ? 'up' : 'right')));
  /* 系统开了「减少动态效果」时出卡几乎瞬间完成，不必再空等 */
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  setTimeout(() => {
    pos += 1;
    animating = false;
    savePos();
    renderCard(true);      /* 连刷不重放内部的错落入场 */
    tickPos();
    setUndoVisible(true);
  }, reduce ? 0 : (level === null ? 400 : 360));
}


/* 标题栏中间显示的当前卡组名：没有分组时就是全部词 */
function scopeName(){
  return deckScopeLabel || '全部词';
}

/* 点卡组名 → 切换牌组 */
function currentDeckKey(){
  if(deckScopeLabel === '今天复习') return 'review';
  if(!deckScoped) return 'all';
  const mi = MST_LABEL.indexOf(deckScopeLabel);
  if(mi >= 0) return 'm' + mi;
  if(deckScopeLabel.slice(-2) === ' 组') return 'l' + deckScopeLabel.charAt(0);
  return ''; /* 搜索等自定义分组不属于任何一格，不高亮 */
}

function deckPickHtml(){
  const cur = currentDeckKey();
  const rated = ratedToday();
  const mCount = [0, 1, 2].map(lv => WORDS.filter(w => masteryOf(w.word) === lv).length);
  const letters = new Map();
  WORDS.forEach(w => {
    const L = (w.word[0] || '#').toUpperCase();
    letters.set(L, (letters.get(L) || 0) + 1);
  });

  const sectHead = (title, count) =>
    '<div class="sect-head"><span class="sect-title">' + title + '</span>' +
    '<span class="sect-count">' + count + '</span></div>';

  /* 两张大牌组卡：一摞错位纸 + 小牌堆图标 + 数量/状态 */
  const tile = d =>
    '<button class="deck-tile' + (cur === d.key ? ' current' : '') + '" type="button" data-deck="' + d.key + '" style="--accent:' + d.accent + '">' +
      '<span class="deck-tile-inner">' +
        '<span class="row-top">' +
          '<span class="deck-icon" aria-hidden="true"><i></i><i></i><i>' + d.icon + '</i></span>' +
          '<span class="name">' + esc(d.name) + '</span>' +
        '</span>' +
        '<span class="line-meta">' +
          '<span class="count"><b>' + d.n + '</b> 个词</span>' +
          '<span class="status"><i></i>' + d.status + '</span>' +
        '</span>' +
      '</span>' +
    '</button>';

  const decks = [
    {key:'all', name:'全部词', n:WORDS.length, accent:'var(--ac)', icon:'全', status:'掌握度混合'},
    {key:'review', name:'今天复习', n:rated.size, accent:'var(--rose)', icon:'复', status:rated.size ? '今日已评' : '今日未评'}
  ];
  const mColors = ['#8F9296', 'var(--amber)', 'var(--moss)'];

  return '<div class="shelf-aura" aria-hidden="true"><i></i><i></i><i></i></div>' +
    '<div class="shelf-tip"><i></i>点选牌组，立即开刷</div>' +
    '<div class="sect sect-deck">' + sectHead('牌组', decks.length + ' 组') +
      '<div class="decks-grid">' + decks.map(tile).join('') + '</div></div>' +
    '<div class="sect sect-mst">' + sectHead('掌握度', '3 类') +
      '<div class="mst-grid">' +
        [0, 1, 2].map(i =>
          '<button class="mst-tile' + (cur === 'm' + i ? ' current' : '') + '" type="button" data-deck="m' + i + '" style="--dot:' + mColors[i] + '">' +
            '<span class="dot"></span><span class="name">' + MST_LABEL[i] + '</span><span class="num">' + mCount[i] + '</span>' +
          '</button>').join('') +
      '</div></div>' +
    '<div class="sect sect-ltr">' + sectHead('首字母', letters.size + ' 个') +
      '<div class="letters-grid" id="letterStage">' +
        Array.from(letters.keys()).sort().map(L => {
          const n = letters.get(L);
          /* 球径按词数开方缩放：1 个词 40px，9 个词 58px（面积更接近词量） */
          const t = Math.min(n, 9) / 9;
          const s = Math.round(40 + 18 * Math.sqrt(t));
          return '<button class="letter-tile' + (cur === 'l' + L ? ' current' : '') + '" type="button" data-deck="l' + L + '"' +
            ' style="--s:' + s + 'px" aria-label="' + esc(L + ' 组，' + n + ' 个词') + '">' +
            '<span class="lt">' + L + '</span><span class="n">' + n + '</span>' +
          '</button>';
        }).join('') +
      '</div></div>';
}

/* ------------------------------------------------------------
   首字母球阵：向上漂的浮力球
   向上有浮力，撞边界/彼此轻弹，可以抓起甩出去，松手继续往上飘。
   只在面板打开时跑 rAF，收起立刻停，不白耗电。
   ------------------------------------------------------------ */
const BALL_G = -150;      /* 浮力加速度 px/s²（负值向上） */
const BALL_DAMP = .45;    /* 速度半衰：每秒保留比例，越小越快停 */
const BALL_WALL = .45;    /* 撞墙保留速度 */
const BALL_PAIR = .30;    /* 球撞球保留速度 */
const BALL_STEP = 1 / 60;

let ballScene = null;

function ballSceneInit(){
  ballSceneStop();
  const stage = document.getElementById('letterStage');
  if(!stage){ ballScene = null; return; }
  const w = stage.clientWidth || 320;
  const h = stage.clientHeight || 196;
  const els = Array.from(stage.querySelectorAll('.letter-tile'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const balls = els.map((el, i) => {
    const r = el.offsetWidth / 2 || 24;
    const b = {
      el, r, m: r * r, x: 0, y: 0, vx: 0, vy: 0, held: false,
      phase: Math.random() * Math.PI * 2
    };
    if(reduce){
      /* 减少动效：直接摆成整齐几行，不再跑物理 */
      const cols = Math.max(1, Math.floor((w + 7) / (r * 2 + 7)));
      b.x = r + (i % cols) * (r * 2 + 7);
      b.y = r + Math.floor(i / cols) * (r * 2 + 7);
    }else{
      /* 从底部一片区域里出发，浮上来 */
      b.x = r + Math.random() * Math.max(1, w - r * 2);
      b.y = h - r - Math.random() * (h * .6);
      b.vx = (Math.random() - .5) * 60;
      b.vy = -50 - Math.random() * 80;
    }
    return b;
  });
  /* 随机落点会叠在一起，先就地推开再开始浮：开局不会有一团球黏在一起 */
  if(!reduce) ballSceneSettle(balls, w, h);
  ballScene = {
    stage, w, h, balls, raf: 0, last: 0, acc: 0, t: 0,
    held: null, gx: 0, gy: 0, lx: 0, ly: 0, lt: 0, svx: 0, svy: 0, moved: false
  };
  if(!stage.__ballBound){ ballSceneBind(stage); stage.__ballBound = true; }
  ballSceneRender();
  if(!reduce) ballSceneStart();
}

/* 开局把叠在一起的球就地推开（只修正位置，不加冲量） */
function ballSceneSettle(balls, w, h){
  for(let it = 0; it < 16; it++){
    for(let i = 0; i < balls.length; i++){
      const a = balls[i];
      for(let j = i + 1; j < balls.length; j++){
        const b = balls[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        const rr = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if(d2 >= rr * rr) continue;
        let d = Math.sqrt(d2);
        if(d < .001){ dx = 1; dy = 0; d = 1; }
        const nx = dx / d, ny = dy / d;
        const pen = (rr - Math.sqrt(d2)) * .5;
        a.x -= nx * pen; a.y -= ny * pen;
        b.x += nx * pen; b.y += ny * pen;
        a.x = Math.max(a.r, Math.min(w - a.r, a.x));
        a.y = Math.max(a.r, Math.min(h - a.r, a.y));
        b.x = Math.max(b.r, Math.min(w - b.r, b.x));
        b.y = Math.max(b.r, Math.min(h - b.r, b.y));
      }
    }
  }
}

function ballSceneBind(stage){
  stage.addEventListener('pointerdown', e => {
    const s = ballScene; if(!s) return;
    const el = e.target.closest('.letter-tile'); if(!el) return;
    const b = s.balls.find(x => x.el === el); if(!b) return;
    const rect = stage.getBoundingClientRect();
    b.held = true; s.held = b; s.moved = false;
    s.gx = e.clientX - rect.left - b.x;
    s.gy = e.clientY - rect.top - b.y;
    s.lx = e.clientX; s.ly = e.clientY; s.lt = performance.now();
    s.svx = 0; s.svy = 0;
    el.classList.add('dragging');
    ballSceneStart();
    try{ el.setPointerCapture(e.pointerId); }catch(err){}
  });

  stage.addEventListener('pointermove', e => {
    const s = ballScene; if(!s || !s.held) return;
    const b = s.held;
    const rect = stage.getBoundingClientRect();
    const nx = Math.max(b.r, Math.min(s.w - b.r, e.clientX - rect.left - s.gx));
    const ny = Math.max(b.r, Math.min(s.h - b.r, e.clientY - rect.top - s.gy));
    /* 带时间窗指数平滑：甩出去才有手感，又不会飞得太夸张 */
    const now = performance.now();
    const dtp = Math.max(1, now - s.lt) / 1000;
    s.svx = s.svx * .55 + ((e.clientX - s.lx) / dtp) * .45;
    s.svy = s.svy * .55 + ((e.clientY - s.ly) / dtp) * .45;
    s.lx = e.clientX; s.ly = e.clientY; s.lt = now;
    if(Math.abs(nx - b.x) + Math.abs(ny - b.y) > 2) s.moved = true;
    b.x = nx; b.y = ny; b.vx = 0; b.vy = 0;
    ballSceneRender();
  });

  const release = () => {
    const s = ballScene; if(!s || !s.held) return;
    const b = s.held;
    s.held = null; b.held = false;
    b.el.classList.remove('dragging');
    const cap = 1600;
    b.vx = Math.max(-cap, Math.min(cap, s.svx * .85));
    b.vy = Math.max(-cap, Math.min(cap, s.svy * .85));
    /* 甩到容器外先拉回来 */
    if(b.x - b.r < 0){ b.x = b.r; b.vx = Math.abs(b.vx) * .4; }
    if(b.x + b.r > s.w){ b.x = s.w - b.r; b.vx = -Math.abs(b.vx) * .4; }
    if(b.y - b.r < 0){ b.y = b.r; b.vy = Math.abs(b.vy) * .4; }
    if(b.y + b.r > s.h){ b.y = s.h - b.r; b.vy = -Math.abs(b.vy) * .4; }
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  /* 拖动结束的那一下不算「选牌组」；轻点才算 */
  stage.addEventListener('click', e => {
    const s = ballScene; if(!s) return;
    if(s.moved){ e.preventDefault(); e.stopPropagation(); s.moved = false; }
  }, true);
}

function ballSceneStep(dt){
  const s = ballScene; if(!s) return;
  const damp = Math.pow(BALL_DAMP, dt);
  /* 贴边：撞到四壁按 BALL_WALL 弹回，并把球推回框内 */
  const walls = () => {
    for(const b of s.balls){
      if(b.held) continue;
      if(b.x - b.r < 0){ b.x = b.r; if(b.vx < 0) b.vx = -b.vx * BALL_WALL; }
      if(b.x + b.r > s.w){ b.x = s.w - b.r; if(b.vx > 0) b.vx = -b.vx * BALL_WALL; }
      if(b.y - b.r < 0){ b.y = b.r; if(b.vy < 0) b.vy = -b.vy * BALL_WALL; }
      if(b.y + b.r > s.h){ b.y = s.h - b.r; if(b.vy > 0) b.vy = -b.vy * BALL_WALL; }
    }
  };
  for(const b of s.balls){
    if(b.held) continue;
    b.vy += BALL_G * dt;
    /* 缓慢横向摇摆：让贴在顶上的球也一直轻轻挪动，不显得死板 */
    b.vx += Math.sin(s.t * .9 + b.phase) * 30 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vx *= damp;
    b.vy *= damp;
  }
  walls();
  /* 球与球：位置修正 + 冲量，质量按半径平方，大球推小球 */
  for(let it = 0; it < 2; it++){
    for(let i = 0; i < s.balls.length; i++){
      const a = s.balls[i];
      for(let j = i + 1; j < s.balls.length; j++){
        const b = s.balls[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const rr = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if(d2 >= rr * rr) continue;
        const d = Math.sqrt(d2);
        /* 完全重合时法线取不到，给一个默认方向，否则这对球永远分不开 */
        let nx = 1, ny = 0;
        if(d > .001){ nx = dx / d; ny = dy / d; }
        const pen = rr - d;
        const ia = a.held ? 0 : 1 / a.m;
        const ib = b.held ? 0 : 1 / b.m;
        if(ia + ib > 0){
          const tot = ia + ib;
          if(ia > 0){ a.x -= nx * pen * (ia / tot) * .7; a.y -= ny * pen * (ia / tot) * .7; }
          if(ib > 0){ b.x += nx * pen * (ib / tot) * .7; b.y += ny * pen * (ib / tot) * .7; }
        }
        const rvx = b.vx - a.vx, rvy = b.vy - a.vy;
        const vn = rvx * nx + rvy * ny;
        if(vn >= 0 || ia + ib === 0) continue;
        const J = (1 + BALL_PAIR) * vn / (ia + ib);
        if(ia > 0){ a.vx += J * nx * ia; a.vy += J * ny * ia; }
        if(ib > 0){ b.vx -= J * nx * ib; b.vy -= J * ny * ib; }
      }
    }
  }
  /* 挤在一起的球会被推得穿出边界，再贴一次边，别让球压到框外 */
  walls();
}

function ballSceneRender(){
  const s = ballScene; if(!s) return;
  for(const b of s.balls){
    b.el.style.transform = 'translate3d(' + (b.x - b.r) + 'px,' + (b.y - b.r) + 'px,0)';
  }
}

function ballSceneFrame(now){
  const s = ballScene; if(!s) return;
  if(!deckPickOpen){ s.raf = 0; return; }   /* 面板收起就停 */
  if(!s.last) s.last = now;
  let dt = (now - s.last) / 1000;
  s.last = now;
  if(dt > .1) dt = .1;
  s.acc += dt; s.t += dt;
  let guard = 0;
  while(s.acc >= BALL_STEP && guard < 4){ ballSceneStep(BALL_STEP); s.acc -= BALL_STEP; guard++; }
  if(s.acc > BALL_STEP) s.acc = 0;
  ballSceneRender();
  s.raf = requestAnimationFrame(ballSceneFrame);
}

function ballSceneStart(){
  const s = ballScene; if(!s || s.raf) return;
  s.last = 0; s.acc = 0;
  s.raf = requestAnimationFrame(ballSceneFrame);
}
function ballSceneStop(){
  const s = ballScene; if(!s || !s.raf) return;
  cancelAnimationFrame(s.raf); s.raf = 0;
}

/* 面板内容提前渲染好（面板此时是隐藏的），点开时只切类，省掉打开瞬间的排版 */
function deckPickPrebuild(){
  const box = document.getElementById('deckPick');
  if(!box) return;
  box.innerHTML = deckPickHtml();
  deckPickDirty = false;
}

/* 面板打开时压一条历史记录：手机的返回键就能把面板收回去。
   用自己点遮罩/选牌组关掉时再退掉这条记录，不留空条目 */
function pushPickHistory(){
  if(pickHistory) return;
  try{ history.pushState({ deckPick: 1 }, ''); pickHistory = true; }catch(e){}
}
function popPickHistory(){
  if(!pickHistory) return;
  pickHistory = false;
  pickIgnorePop++;   /* 这次后退是我们自己发的，popstate 里不要再去关一次 */
  try{ history.back(); }catch(e){}
}

function closeDeckPick(){
  const wasOpen = deckPickOpen;
  deckPickOpen = false;
  const stage = document.getElementById('deckStage');
  const btn = document.getElementById('deckScope');
  if(stage) stage.classList.remove('pick-open');
  if(btn){
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
  if(wasOpen) popPickHistory();
  ballSceneStop();
}

function toggleDeckPick(){
  const box = document.getElementById('deckPick');
  const btn = document.getElementById('deckScope');
  const stage = document.getElementById('deckStage');
  if(!box || !btn || !stage) return;
  if(deckPickOpen){ closeDeckPick(); sfxPlay('panelClose'); return; }
  if(deckPickDirty || !box.firstElementChild){
    box.innerHTML = deckPickHtml();
    deckPickDirty = false;
  }
  syncMiniCard();
  box.scrollTop = 0;
  deckPickOpen = true;
  pushPickHistory();
  ballSceneInit();
  ballSceneStart();
  btn.classList.add('open');
  btn.setAttribute('aria-expanded', 'true');
  sfxPlay('panelOpen');
  /* 先让面板安静地排完版，下一帧再起过渡：开头就不会顿一下 */
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if(!deckPickOpen) return;
    stage.classList.add('pick-open');
  }));
}

/* 选中某个牌组：从头开始刷这一组 */
function pickDeck(key){
  if(animating) return;
  closeDeckPick();
  sfxPlay('pick');
  if(key === 'all'){
    deckScoped = false;
    deckBackup = null;
    deckScopeLabel = '';
    queue = buildQueue();
    pos = 0;
    undoSnap = null;
    savePos();
    renderDeckShell();
    return;
  }
  if(key === 'review'){ startReviewToday(); return; }
  const kind = key.charAt(0);
  if(kind === 'm'){
    const lv = Number(key.slice(1));
    const list = WORDS.filter(w => masteryOf(w.word) === lv);
    if(!list.length){ toast(MST_LABEL[lv] + ' 还没有词'); return; }
    queueWords(MST_LABEL[lv], list);
    return;
  }
  if(kind === 'l'){
    const L = key.slice(1);
    const list = WORDS.filter(w => (w.word[0] || '#').toUpperCase() === L);
    if(!list.length){ toast('没有 ' + L + ' 开头的词'); return; }
    queueWords(L + ' 组', list);
  }
}

/* 字母方块里的「刷这组」 */
function queueLibLetter(L, list){
  queueWords(L + ' 组', list);
}

/* 按当前筛选（关键词 + 掌握度）整批刷 */
function queueLibMst(){
  const list = libSorted(libMstWords(libFilter));
  if(!list.length) return;
  const label = libMst === 'all'
    ? (libFilter ? '含 “' + libFilter + '”' : '全部词')
    : MST_LABEL[Number(libMst)];
  queueWords(label, list);
}

/* 复习今天刷过的：把今天已评分的词按掌握度重排一遍（掌握度照常更新） */
function startReviewToday(){
  if(animating) return;
  const rated = ratedToday();
  const list = WORDS.filter(w => rated.has(w.word));
  if(!list.length){ toast('今天还没有刷过的词'); return; }
  deckScoped = false;
  deckBackup = null;
  deckScopeLabel = '今天复习';
  queue = libSorted(list);
  pos = 0;
  undoSnap = null;
  savePos();
  renderDeckShell();
  toast('复习今天刷过的 ' + queue.length + ' 个词');
}

/* 退出分组：原样回到进入前那张 */
function exitDeckScope(){
  if(!deckScoped || animating) return;
  if(deckBackup){
    queue = deckBackup.queue;
    pos = deckBackup.pos;
    undoSnap = deckBackup.undoSnap;
    deckScopeLabel = deckBackup.label || '';   /* 回到进入分组前的卡组名 */
  } else {
    /* 兜底：没有备份时按今天的存档重建 */
    const restored = restoreQueue();
    queue = restored.queue;
    pos = restored.pos;
    undoSnap = null;
    deckScopeLabel = restored.label || '';
  }
  deckBackup = null;
  deckScoped = false;
  renderDeckShell();
  toast('已回到 ' + (deckScopeLabel || '全部单词'));
}

/* 再刷一遍这组：位置归零，词序不变 */
function replayDeckScope(){
  if(!deckScoped || animating) return;
  pos = 0;
  undoSnap = null;
  renderDeckShell();
  toast('再刷一遍 ' + deckScopeLabel);
}
